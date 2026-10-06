import { createElement } from "react";
import { all, one, run } from "./db";
import { id } from "./auth/crypto";
import { addPayment, voidPayment, zl, type Payment } from "./finance";
import { log } from "./logs";
import { baseUrl, sendMail } from "./mail";
import { today } from "./orders";
import OfferEmail from "@/emails/OfferEmail";
import OrderStartedEmail from "@/emails/OrderStartedEmail";

/*
 * Wycena → płatność → zlecenie.
 * Admin wysyła wycenę (kwota, czas realizacji w dniach od wpłaty, termin płatności, opcjonalna zaliczka).
 * Klient płaci całość albo zaliczkę (link Stripe albo przelew). Po wpłacie zlecenie startuje samo:
 * start = dzień wpłaty, termin = start + dni realizacji; po zaliczce powstaje płatność za resztę.
 */

export type Offer = {
  id: string;
  inquiry_id: string | null;
  user_id: string | null;
  client_name: string;
  client_email: string;
  title: string;
  service: string | null;
  message: string | null;
  amount: number;
  deposit: number | null;
  work_days: number;
  pay_by: string;
  status: "sent" | "paid" | "cancelled";
  order_id: string | null;
  paid_at: number | null;
  created_at: number;
};

export type OfferPay = Pick<Payment, "id" | "amount" | "status" | "stripe_url" | "method"> & { kind: "full" | "deposit" | "rest" | null };

const plus = (d: string, days: number) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + days);
  return x.toISOString().slice(0, 10);
};
export const longDate = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${d}T12:00:00`));

const norm = (o: Offer): Offer => ({ ...o, amount: Number(o.amount), deposit: o.deposit == null ? null : Number(o.deposit), work_days: Number(o.work_days), created_at: Number(o.created_at), paid_at: o.paid_at == null ? null : Number(o.paid_at) });

export async function offerPayments(offerId: string) {
  return (await all<OfferPay>("SELECT id, amount, status, stripe_url, method, kind FROM payments WHERE offer_id = ? ORDER BY created_at", [offerId])).map((p) => ({ ...p, amount: Number(p.amount) }));
}

export async function getOffer(oid: string) {
  const o = await one<Offer>("SELECT * FROM offers WHERE id = ?", [oid]);
  return o ? norm(o) : null;
}

export async function latestOffer(inquiryId: string) {
  const o = await one<Offer>("SELECT * FROM offers WHERE inquiry_id = ? AND status != 'cancelled' ORDER BY created_at DESC LIMIT 1", [inquiryId]);
  return o ? norm(o) : null;
}

export async function clientOffers(userId: string, email: string) {
  const rows = (await all<Offer>("SELECT * FROM offers WHERE status = 'sent' AND (user_id = ? OR lower(client_email) = lower(?)) ORDER BY created_at DESC", [userId, email])).map(norm);
  return Promise.all(rows.map(async (o) => ({ ...o, payments: await offerPayments(o.id) })));
}

/** Tworzy wycenę i jej płatności, wysyła maila do klienta */
export async function createOffer(d: { inquiryId: string | null; userId: string | null; clientName: string; clientEmail: string; title: string; service: string | null; message: string; amount: number; deposit: number | null; workDays: number; payDays: number; mail: boolean; actor: string }) {
  const oid = id();
  const base = await baseUrl();
  const payBy = plus(today(), d.payDays);
  await run(
    "INSERT INTO offers (id, inquiry_id, user_id, client_name, client_email, title, service, message, amount, deposit, work_days, pay_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?)",
    [oid, d.inquiryId, d.userId, d.clientName, d.clientEmail, d.title, d.service, d.message || null, d.amount, d.deposit, d.workDays, payBy, Date.now()],
  );
  const common = { client_name: d.clientName, client_email: d.clientEmail, user_id: d.userId, service: d.service, due_date: payBy, offer_id: oid, stripe: true, baseUrl: base };
  let full, dep;
  try {
    full = await addPayment({ ...common, title: d.title, amount: d.amount, kind: "full" });
    dep = d.deposit ? await addPayment({ ...common, title: `${d.title} (zaliczka)`, amount: d.deposit, kind: "deposit" }) : null;
  } catch (e) {
    await run("UPDATE offers SET status = 'cancelled' WHERE id = ?", [oid]);
    if (full) await voidPayment(full.id);
    throw e;
  }
  await log("payment", `Wysłano wycenę: ${d.title} — ${zl(d.amount)}${d.deposit ? ` (zaliczka ${zl(d.deposit)})` : ""} · ${d.clientName}`, { actor: d.actor });

  let mailed = false;
  if (d.mail) {
    const r = await sendMail({
      to: d.clientEmail,
      subject: `Wycena: ${d.title} — ${zl(d.amount)}`,
      react: createElement(OfferEmail, {
        name: d.clientName,
        title: d.title,
        message: d.message || null,
        amount: zl(d.amount),
        deposit: d.deposit ? zl(d.deposit) : null,
        workDays: d.workDays,
        payBy: longDate(payBy),
        fullUrl: full.url,
        depositUrl: dep?.url ?? null,
        transfer: full.method === "transfer",
        panelUrl: `${base}${d.userId ? "/panel/zamowienia" : "/konto/logowanie"}`,
        baseUrl: base,
      }),
    });
    mailed = r.ok;
  }
  return { id: oid, payBy, fullUrl: full.url, depositUrl: dep?.url ?? null, mailed };
}

/** Wywoływane po oznaczeniu płatności jako opłaconej — start zlecenia z wyceny */
export async function startFromPayment(p: Payment) {
  if (!p.offer_id) return null;
  const o = await getOffer(p.offer_id);
  if (!o) return null;
  // reszta po zaliczce — zlecenie już trwa
  if (p.kind === "rest" || o.status !== "sent") return null;
  // dokładnie jedno zlecenie na wycenę, nawet gdy dwie wpłaty (całość i zaliczka) albo dwa potwierdzenia przyjdą naraz
  const claim = await run("UPDATE offers SET status = 'paid', paid_at = ? WHERE id = ? AND status = 'sent'", [Date.now(), o.id]);
  if (!claim.rowsAffected) return null;
  const start = today();
  const due = plus(start, o.work_days);
  const order = id();
  await run(
    "INSERT INTO orders (id, title, client_name, client_email, user_id, service, amount, start_date, due_date, status, notes, remind_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, 3, ?)",
    [order, o.title, o.client_name, o.client_email, o.user_id, o.service, Math.round(o.amount / 100), start, due, Date.now()],
  );
  await run("UPDATE offers SET order_id = ? WHERE id = ?", [order, o.id]);
  await run("UPDATE payments SET order_id = ? WHERE offer_id = ?", [order, o.id]);
  if (o.inquiry_id) await run("UPDATE inquiries SET status = 'won', order_id = ? WHERE id = ?", [order, o.inquiry_id]);

  // druga opcja (całość/zaliczka) przestaje być potrzebna
  for (const x of await offerPayments(o.id)) if (x.id !== p.id && x.status === "pending") await voidPayment(x.id);

  const base = await baseUrl();
  let rest: { url: string | null; amount: number } | null = null;
  if (p.kind === "deposit" && o.amount > Number(p.amount)) {
    const r = await addPayment({ title: `${o.title} (pozostała kwota)`, client_name: o.client_name, client_email: o.client_email, user_id: o.user_id, service: o.service, amount: o.amount - Number(p.amount), due_date: due, order_id: order, offer_id: o.id, kind: "rest", stripe: true, baseUrl: base }).catch(async (e) => {
      await log("payment", `Nie utworzono płatności za resztę (${o.title}) — dodaj ją ręcznie w zleceniu: ${e instanceof Error ? e.message : e}`, { level: "error", meta: { order } });
      return null;
    });
    if (r) rest = { url: r.url, amount: o.amount - Number(p.amount) };
  }
  await log("payment", `Zlecenie wystartowało po wpłacie: ${o.title} — termin ${longDate(due)}`, { level: "success", meta: { offer: o.id, order } });

  await sendMail({
    to: o.client_email,
    subject: `Startujemy: ${o.title} — termin ${longDate(due)}`,
    react: createElement(OrderStartedEmail, { name: o.client_name, title: o.title, paid: zl(Number(p.amount)), deposit: p.kind === "deposit", start: longDate(start), due: longDate(due), days: o.work_days, rest: rest ? zl(rest.amount) : null, restUrl: rest?.url ?? null, url: `${base}/panel/zamowienia/${order}`, baseUrl: base }),
  }).catch(() => {});
  return { order, due: longDate(due), deposit: p.kind === "deposit" };
}

export async function cancelOffer(oid: string) {
  const o = await getOffer(oid);
  if (!o || o.status !== "sent") return null;
  for (const x of await offerPayments(oid)) if (x.status === "pending") await voidPayment(x.id);
  await run("UPDATE offers SET status = 'cancelled' WHERE id = ?", [oid]);
  return o;
}
