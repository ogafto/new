"use server";

import { revalidatePath } from "next/cache";
import { createElement } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { id } from "@/lib/auth/crypto";
import { one, run } from "@/lib/db";
import { EXPENSE_CATEGORIES, markPaid, zl, type Payment } from "@/lib/finance";
import { log } from "@/lib/logs";
import { baseUrl, sendMail } from "@/lib/mail";
import { createPaymentLink, deactivateLink, findPaidSession, stripeReady } from "@/lib/stripe";
import PaymentEmail from "@/emails/PaymentEmail";

type R = { ok?: string; error?: string; url?: string };

const grosze = (v: unknown) => Math.round(Number(String(v ?? "").replace(",", ".").replace(/\s/g, "")) * 100);
const done = () => {
  revalidatePath("/panel/admin/finanse");
  revalidatePath("/panel/admin");
  revalidatePath("/panel");
};

export type NewPayment = { title: string; client_name: string; client_email: string; user_id: string; service: string; amount: string; due_date: string; method: "stripe" | "transfer" | "cash"; notes: string; paid: boolean; send: boolean };

export async function createPayment(d: NewPayment): Promise<R> {
  const admin = await requireAdmin();
  const amount = grosze(d.amount);
  if (!d.title.trim()) return { error: "Podaj tytuł (np. Strona internetowa — zaliczka)." };
  if (!d.client_name.trim()) return { error: "Podaj klienta." };
  if (!amount || amount < 200) return { error: "Kwota musi wynosić co najmniej 2 zł." };
  if (d.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.client_email)) return { error: "Nieprawidłowy e-mail klienta." };
  if (d.method === "stripe" && !(await stripeReady())) return { error: "Stripe nie jest podłączony — dodaj klucz w Ustawieniach albo wybierz przelew/gotówkę." };

  const pid = id();
  const now = Date.now();
  await run(
    "INSERT INTO payments (id, title, client_name, client_email, user_id, service, amount, status, method, due_date, paid_at, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [pid, d.title.trim().slice(0, 200), d.client_name.trim().slice(0, 120), d.client_email.trim() || null, d.user_id || null, d.service || null, amount, d.paid ? "paid" : "pending", d.method, d.due_date || null, d.paid ? now : null, d.notes.trim().slice(0, 1000) || null, now],
  );

  let url: string | undefined;
  if (d.method === "stripe" && !d.paid) {
    try {
      const link = await createPaymentLink({ id: pid, title: d.title.trim(), amount, email: d.client_email || null, baseUrl: await baseUrl() });
      url = link.url;
      await run("UPDATE payments SET stripe_session = ?, stripe_url = ? WHERE id = ?", [link.id, link.url, pid]);
    } catch (e) {
      await run("DELETE FROM payments WHERE id = ?", [pid]);
      const msg = e instanceof Error ? e.message : String(e);
      await log("payment", `Nie udało się utworzyć linku Stripe: ${msg}`, { level: "error", actor: admin.email });
      return { error: `Stripe: ${msg}` };
    }
  }
  await log("payment", `${d.paid ? "Dodano wpłatę" : "Nowa płatność"}: ${d.title} — ${zl(amount)} (${d.client_name})`, { level: d.paid ? "success" : "info", actor: admin.email });

  if (d.send && url && d.client_email) {
    const r = await sendPaymentEmail(pid);
    done();
    return r.error ? { ok: "Utworzono link, ale mail nie wyszedł.", error: r.error, url } : { ok: "Utworzono link i wysłano go klientowi.", url };
  }
  done();
  return { ok: url ? "Utworzono link do płatności." : "Zapisano.", url };
}

export async function sendPaymentEmail(pid: string): Promise<R> {
  const admin = await requireAdmin();
  const p = await one<Payment>("SELECT * FROM payments WHERE id = ?", [pid]);
  if (!p?.stripe_url || !p.client_email) return { error: "Brak linku albo e-maila klienta." };
  const due = p.due_date ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${p.due_date}T12:00:00`)) : null;
  const r = await sendMail({
    to: p.client_email,
    subject: `${p.title} — płatność ${zl(Number(p.amount))}`,
    react: createElement(PaymentEmail, { name: p.client_name, title: p.title, amount: zl(Number(p.amount)), due, url: p.stripe_url, baseUrl: await baseUrl() }),
  });
  if (!r.ok) return { error: "Nie udało się wysłać maila — sprawdź ustawienia e-mail." };
  await log("payment", `Wysłano link do płatności: ${p.title} → ${p.client_email}`, { actor: admin.email });
  return { ok: r.dev ? "Tryb dev — treść maila w konsoli serwera." : `Wysłano na ${p.client_email}.` };
}

export async function setPaid(pid: string): Promise<R> {
  const admin = await requireAdmin();
  await markPaid(pid, { via: "manual", actor: admin.email });
  done();
  return { ok: "Oznaczono jako opłacone." };
}

export async function checkStripe(pid: string): Promise<R> {
  const admin = await requireAdmin();
  const p = await one<Payment>("SELECT * FROM payments WHERE id = ?", [pid]);
  if (!p?.stripe_session) return { error: "Ta płatność nie ma linku Stripe." };
  try {
    const s = await findPaidSession(p.stripe_session);
    if (!s) return { ok: "Jeszcze nie opłacono." };
    await markPaid(pid, { via: "check", stripePayment: s.payment_intent, actor: admin.email });
    done();
    return { ok: "Opłacone ✓" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function cancelPayment(pid: string): Promise<R> {
  const admin = await requireAdmin();
  const p = await one<Payment>("SELECT * FROM payments WHERE id = ?", [pid]);
  if (!p) return { error: "Nie znaleziono." };
  if (p.stripe_session) await deactivateLink(p.stripe_session);
  await run("UPDATE payments SET status = 'canceled' WHERE id = ?", [pid]);
  await log("payment", `Anulowano: ${p.title} (${p.client_name})`, { level: "warn", actor: admin.email });
  done();
  return { ok: "Anulowano — link przestał działać." };
}

export async function deletePayment(pid: string): Promise<R> {
  const admin = await requireAdmin();
  const p = await one<Payment>("SELECT * FROM payments WHERE id = ?", [pid]);
  if (!p) return {};
  if (p.stripe_session && p.status === "pending") await deactivateLink(p.stripe_session);
  await run("DELETE FROM payments WHERE id = ?", [pid]);
  await log("payment", `Usunięto pozycję: ${p.title} — ${zl(Number(p.amount))}`, { level: "warn", actor: admin.email });
  done();
  return { ok: "Usunięto." };
}

export async function saveExpense(d: { title: string; category: string; amount: string; date: string; recurring: boolean; notes: string }): Promise<R> {
  const admin = await requireAdmin();
  const amount = grosze(d.amount);
  if (!d.title.trim()) return { error: "Podaj nazwę kosztu." };
  if (!amount || amount < 1) return { error: "Podaj kwotę." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return { error: "Podaj datę." };
  await run("INSERT INTO expenses (id, title, category, amount, date, recurring, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
    id(),
    d.title.trim().slice(0, 160),
    d.category in EXPENSE_CATEGORIES ? d.category : "other",
    amount,
    d.date,
    d.recurring ? 1 : 0,
    d.notes.trim().slice(0, 500) || null,
    Date.now(),
  ]);
  await log("payment", `Dodano koszt: ${d.title} — ${zl(amount)}${d.recurring ? " / mies." : ""}`, { actor: admin.email });
  done();
  return { ok: "Dodano koszt." };
}

export async function deleteExpense(eid: string): Promise<R> {
  await requireAdmin();
  await run("DELETE FROM expenses WHERE id = ?", [eid]);
  done();
  return { ok: "Usunięto." };
}
