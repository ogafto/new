"use server";

import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { one, run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { requireAdmin } from "@/lib/auth/session";
import { zl } from "@/lib/finance";
import { log } from "@/lib/logs";
import { baseUrl, sendMail } from "@/lib/mail";
import { stripeReady } from "@/lib/stripe";
import { createPayment } from "../finanse/actions";
import OrderAcceptedEmail from "@/emails/OrderAcceptedEmail";

const refresh = () => {
  revalidatePath("/panel/admin", "layout");
  revalidatePath("/panel", "layout");
};

export async function setInquiryStatus(iid: string, status: "new" | "contacted" | "won" | "lost") {
  await requireAdmin();
  await run("UPDATE inquiries SET status = ? WHERE id = ?", [status, iid]);
  refresh();
}

// „Zajmę się tym” — klient widzi w panelu, że zgłoszenie jest w toku
export async function takeInquiry(iid: string) {
  const admin = await requireAdmin();
  const q = await one<{ name: string; topic: string | null; status: string }>("SELECT name, topic, status FROM inquiries WHERE id = ?", [iid]);
  if (!q) return { error: "Nie ma już tego zapytania." };
  if (q.status === "new") {
    await run("UPDATE inquiries SET status = 'contacted' WHERE id = ?", [iid]);
    await log("inquiry", `W toku: ${q.name}${q.topic ? ` · ${q.topic}` : ""}`, { actor: admin.email });
  }
  refresh();
  return { ok: true };
}

export async function setInquiryNote(iid: string, note: string) {
  await requireAdmin();
  await run("UPDATE inquiries SET note = ? WHERE id = ?", [note.slice(0, 2000) || null, iid]);
  revalidatePath("/panel/admin/zapytania");
}

export async function deleteInquiry(iid: string) {
  await requireAdmin();
  await run("DELETE FROM inquiries WHERE id = ?", [iid]);
  refresh();
}

export type AcceptInput = { iid: string; title: string; service: string; amount: string; start: string; due: string; status: "planned" | "active"; deposit: string; mail: boolean };
export type AcceptResult = { error?: string; ok?: boolean; orderId?: string; mailed?: boolean; payUrl?: string; warn?: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const pl = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${d}T12:00:00`));
const num = (v: string) => Number(v.replace(",", ".").replace(/\s|zł/g, ""));

// Przyjęcie zamówienia: zlecenie z terminem w kalendarzu, opcjonalnie zaliczka (Stripe/przelew) i mail do klienta
export async function acceptInquiry(d: AcceptInput): Promise<AcceptResult> {
  const admin = await requireAdmin();
  const q = await one<{ id: string; name: string; email: string; company: string | null; topic: string | null; user_id: string | null; order_id: string | null }>("SELECT id, name, email, company, topic, user_id, order_id FROM inquiries WHERE id = ?", [d.iid]);
  if (!q) return { error: "Nie ma już tego zapytania." };
  if (q.order_id) return { error: "To zamówienie jest już przyjęte." };
  const title = d.title.trim().slice(0, 120);
  if (title.length < 2) return { error: "Podaj nazwę zlecenia." };
  if (!DATE.test(d.start) || !DATE.test(d.due)) return { error: "Ustaw datę startu i termin." };
  if (d.due < d.start) return { error: "Termin nie może być przed startem." };
  const amount = d.amount.trim() ? Math.round(num(d.amount)) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) return { error: "Wycena musi być liczbą." };
  const deposit = d.deposit.trim() ? num(d.deposit) : 0;
  if (!Number.isFinite(deposit) || deposit < 0) return { error: "Zaliczka musi być liczbą." };
  if (deposit && deposit < 2) return { error: "Zaliczka musi wynosić co najmniej 2 zł." };

  // konto klienta: z zamówienia w panelu albo po adresie e-mail
  const userId = q.user_id ?? (await one<{ id: string }>("SELECT id FROM users WHERE lower(email) = lower(?)", [q.email]))?.id ?? null;
  const client = q.company || q.name;
  const oid = id();
  await run(
    "INSERT INTO orders (id, title, client_name, client_email, user_id, service, amount, start_date, due_date, status, notes, remind_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, ?)",
    [oid, title, client, q.email, userId, d.service.trim().slice(0, 200) || q.topic, amount, d.start, d.due, d.status, null, Date.now()],
  );
  await run("UPDATE inquiries SET status = 'won', order_id = ? WHERE id = ?", [oid, q.id]);
  await log("inquiry", `Przyjęto zlecenie: ${title} (${client}) — termin ${pl(d.due)}`, { level: "success", actor: admin.email });

  let payUrl: string | undefined;
  let warn: string | undefined;
  if (deposit) {
    const r = await createPayment({
      title: `${title} — zaliczka`,
      client_name: client,
      client_email: q.email,
      user_id: userId ?? "",
      service: d.service,
      amount: String(deposit),
      due_date: d.start,
      method: (await stripeReady()) ? "stripe" : "transfer",
      notes: "",
      paid: false,
      send: false,
      order_id: oid,
    });
    if (r.error) warn = `Zlecenie przyjęte, ale zaliczki nie udało się utworzyć: ${r.error}`;
    payUrl = r.url;
  }

  let mailed = false;
  if (d.mail) {
    const base = await baseUrl();
    const r = await sendMail({
      to: q.email,
      subject: `Przyjęte: ${title} — termin ${pl(d.due)}`,
      react: createElement(OrderAcceptedEmail, {
        name: q.name,
        title,
        start: pl(d.start),
        due: pl(d.due),
        amount: amount ? zl(amount * 100) : null,
        deposit: deposit ? zl(Math.round(deposit * 100)) : null,
        payUrl: payUrl ?? null,
        panelUrl: `${base}${userId ? "/panel/zamowienia" : "/konto/logowanie"}`,
        baseUrl: base,
      }),
    });
    mailed = r.ok;
    if (!r.ok) warn = warn ?? "Zlecenie przyjęte, ale mail do klienta nie wyszedł (sprawdź Resend w Ustawieniach).";
  }

  refresh();
  revalidatePath("/panel/admin/kalendarz");
  return { ok: true, orderId: oid, mailed, payUrl, warn };
}
