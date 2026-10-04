import { createElement } from "react";
import { all, one, run } from "./db";
import { log } from "./logs";
import { setting } from "./settings";
import { site } from "./site";
import { deactivateLink, findPaidSession, getSession } from "./stripe";

/* Finanse: płatności od klientów (przychody) i koszty. Kwoty w groszach. */

export type PaymentStatus = "pending" | "paid" | "overdue" | "canceled" | "refunded";
export type PaymentMethod = "stripe" | "transfer" | "cash";

export type Payment = {
  id: string;
  title: string;
  client_name: string;
  client_email: string | null;
  user_id: string | null;
  order_id: string | null;
  service: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  due_date: string | null;
  paid_at: number | null;
  stripe_session: string | null;
  stripe_url: string | null;
  stripe_payment: string | null;
  notes: string | null;
  created_at: number;
  offer_id?: string | null;
  kind?: "full" | "deposit" | "rest" | null;
};

export type Expense = { id: string; title: string; category: string; amount: number; date: string; recurring: number; notes: string | null; created_at: number };

export const EXPENSE_CATEGORIES: Record<string, string> = {
  hosting: "Hosting i domeny",
  tools: "Narzędzia i subskrypcje",
  ads: "Reklama",
  hardware: "Sprzęt",
  fees: "Opłaty i prowizje",
  other: "Inne",
};

export const METHODS: Record<PaymentMethod, string> = { stripe: "Stripe (link)", transfer: "Przelew", cash: "Gotówka" };

export const zl = (gr: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: gr % 100 ? 2 : 0 }).format(gr / 100);

const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

/** Status z uwzględnieniem terminu (oczekujące po terminie = zaległe) */
export const effectiveStatus = (p: Pick<Payment, "status" | "due_date">): PaymentStatus => (p.status === "pending" && p.due_date && p.due_date < today() ? "overdue" : p.status);

export async function listPayments() {
  return all<Payment>("SELECT * FROM payments ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 500");
}

export async function listExpenses() {
  return all<Expense>("SELECT * FROM expenses ORDER BY date DESC, created_at DESC LIMIT 500");
}

export async function paymentsForUser(userId: string, email: string) {
  const q = () => all<Payment>("SELECT * FROM payments WHERE (user_id = ? OR lower(client_email) = lower(?)) AND status IN ('pending', 'paid') ORDER BY created_at DESC LIMIT 20", [userId, email]);
  const first = await q();
  // opłacone w Stripe, a webhook jeszcze nie dotarł (albo nie jest ustawiony) — dociągnij stan od razu
  const rows = (await syncStripe(first)) ? await q() : first;
  // linki z wyceny czekającej na wpłatę pokazuje karta wyceny (całość i zaliczka to jedna kwota, nie dwie)
  return rows.filter((p) => !(p.status === "pending" && p.offer_id && (p.kind === "full" || p.kind === "deposit")));
}

/** Podsumowanie: bieżący miesiąc, rok, oczekujące i 12 miesięcy wstecz */
export async function financeSummary() {
  const [payments, expenses] = await Promise.all([all<Payment>("SELECT amount, status, paid_at, due_date, created_at, kind FROM payments"), all<Expense>("SELECT amount, date, recurring, created_at FROM expenses")]);
  const now = new Date();
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const months = Array.from({ length: 12 }, (_, i) => ym(new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)));
  const rev = Object.fromEntries(months.map((m) => [m, 0]));
  const cost = Object.fromEntries(months.map((m) => [m, 0]));

  for (const p of payments) if (p.status === "paid" && p.paid_at) {
    const m = ym(new Date(Number(p.paid_at)));
    if (m in rev) rev[m] += Number(p.amount);
  }
  for (const e of expenses) {
    const start = e.date.slice(0, 7);
    if (Number(e.recurring)) {
      for (const m of months) if (m >= start) cost[m] += Number(e.amount);
    } else if (start in cost) cost[start] += Number(e.amount);
  }

  const cur = months[11];
  const prev = months[10];
  const year = String(now.getFullYear());
  // zaliczka z wyceny to alternatywa dla całości — liczymy tylko całość
  const pending = payments.filter((p) => p.status === "pending" && p.kind !== "deposit");
  return {
    month: { revenue: rev[cur], costs: cost[cur], profit: rev[cur] - cost[cur], prevRevenue: rev[prev], prevCosts: cost[prev] },
    year: { revenue: months.filter((m) => m.startsWith(year)).reduce((a, m) => a + rev[m], 0), costs: months.filter((m) => m.startsWith(year)).reduce((a, m) => a + cost[m], 0) },
    pending: { count: pending.length, amount: pending.reduce((a, p) => a + Number(p.amount), 0), overdue: pending.filter((p) => effectiveStatus(p as Payment) === "overdue").length },
    chart: months.map((m) => ({ m, revenue: rev[m], costs: cost[m] })),
    paidCount: payments.filter((p) => p.status === "paid").length,
  };
}

async function notifyPaid(p: Payment, via: string, started?: { order: string; due: string; deposit: boolean } | null) {
  const text = `Wpłata ${zl(Number(p.amount))} — ${p.title} (${p.client_name})`;
  // mail do admina (powiadomienia albo adres admina)
  try {
    const [{ sendMail, baseUrl }, { adminEmail }, { default: PaidEmail }] = await Promise.all([import("./mail"), import("./auth/admin"), import("@/emails/PaidEmail")]);
    const to = (await setting("notify_email")) || adminEmail();
    if (to)
      await sendMail({
        to,
        subject: started ? `✅ Zamówienie opłacone: ${p.title} — ${zl(Number(p.amount))}` : `💸 ${p.client_name} zapłacił(a) ${zl(Number(p.amount))}`,
        react: createElement(PaidEmail, { client: p.client_name, title: p.title, amount: zl(Number(p.amount)), method: via, email: p.client_email, baseUrl: await baseUrl(), started }),
      });
  } catch (e) {
    await log("mail", "Nie wysłano powiadomienia o wpłacie", { level: "error", meta: { error: String(e) } });
  }
  const hook = await setting("discord_webhook");
  if (hook)
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: site.domain,
        allowed_mentions: { parse: [] },
        embeds: [{ title: started ? "Zamówienie opłacone — zlecenie wystartowało" : "Nowa wpłata", description: started ? `${text}\nTermin oddania: ${started.due}` : text, color: 0x34d399, timestamp: new Date().toISOString() }],
      }),
    }).catch(() => {});
}

/** Oznacza płatność jako opłaconą (webhook, ręczne sprawdzenie albo ręcznie w panelu) */
export async function markPaid(id: string, opts: { via: "webhook" | "check" | "manual"; stripePayment?: string | null; actor?: string }) {
  const p = await one<Payment>("SELECT * FROM payments WHERE id = ?", [id]);
  if (!p || p.status === "paid") return p;
  const now = Date.now();
  // webhook, strona po płatności i synchronizacja panelu mogą przyjść naraz — dalej idzie tylko ten, kto faktycznie zmienił status
  const r = await run("UPDATE payments SET status = 'paid', paid_at = ?, stripe_payment = COALESCE(?, stripe_payment) WHERE id = ? AND status != 'paid'", [now, opts.stripePayment ?? null, id]);
  if (!r.rowsAffected) return { ...p, status: "paid" as const, paid_at: now };
  if (p.stripe_session) await deactivateLink(p.stripe_session);
  const label = { webhook: "Stripe", check: "sprawdzenie w Stripe", manual: "ręcznie" }[opts.via];
  await log("payment", `Opłacono: ${p.title} — ${zl(Number(p.amount))} (${p.client_name})`, { level: "success", actor: opts.actor ?? null, meta: { id, via: label } });
  // wpłata za wycenę → zlecenie startuje (termin liczony od dziś)
  const started = p.offer_id ? await import("./offers").then((m) => m.startFromPayment({ ...p, status: "paid" })).catch((e) => (console.error("offer:", e), null)) : null;
  // ręczne oznaczenie robi sam admin — powiadomienia tylko dla wpłat ze Stripe
  if (opts.via !== "manual") await notifyPaid(p, "Stripe", started);
  return { ...p, status: "paid" as const, paid_at: now };
}

/*
 * Potwierdzenie bez czekania na webhook: po powrocie ze Stripe (sesja z adresu)
 * albo przy wejściu klienta do panelu (oczekujące linki Stripe, z limitem i odstępem między sprawdzeniami).
 */
export async function confirmSession(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const s = await getSession(sessionId).catch(() => null);
  if (!s) return null;
  const p =
    (s.metadata?.payment_id && (await one<Payment>("SELECT * FROM payments WHERE id = ?", [s.metadata.payment_id]))) ||
    (s.payment_link ? await one<Payment>("SELECT * FROM payments WHERE stripe_session = ?", [s.payment_link]) : null);
  if (!p) return null;
  if (s.payment_status === "paid") return (await markPaid(p.id, { via: "check", stripePayment: s.payment_intent })) ?? p;
  return { ...p, processing: s.status === "complete" };
}

const checked = (globalThis as unknown as { __afto_paycheck?: Map<string, number> }).__afto_paycheck ?? new Map<string, number>();
(globalThis as unknown as { __afto_paycheck?: Map<string, number> }).__afto_paycheck = checked;

export async function syncStripe(rows: Pick<Payment, "id" | "status" | "method" | "stripe_session">[]) {
  const now = Date.now();
  const due = rows.filter((p) => p.status === "pending" && p.method === "stripe" && p.stripe_session && now - (checked.get(p.id) ?? 0) > 20_000).slice(0, 3);
  if (!due.length) return false;
  const res = await Promise.all(
    due.map(async (p) => {
      checked.set(p.id, now);
      const s = await findPaidSession(p.stripe_session!).catch(() => null);
      if (!s) return false;
      await markPaid(p.id, { via: "check", stripePayment: s.payment_intent });
      return true;
    }),
  );
  return res.some(Boolean);
}

/** Nowa płatność bez sprawdzania uprawnień (wywołują ją akcje admina i automaty, np. reszta po zaliczce) */
export async function addPayment(d: { title: string; client_name: string; client_email: string | null; user_id: string | null; service: string | null; amount: number; due_date: string | null; order_id?: string | null; offer_id?: string | null; kind?: Payment["kind"]; stripe: boolean; baseUrl: string }) {
  const { createPaymentLink, stripeReady } = await import("./stripe");
  const pid = (await import("./auth/crypto")).id();
  const method = d.stripe && (await stripeReady()) ? "stripe" : "transfer";
  await run(
    "INSERT INTO payments (id, title, client_name, client_email, user_id, service, amount, status, method, due_date, notes, created_at, order_id, offer_id, kind) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, ?, ?, ?, ?)",
    [pid, d.title.slice(0, 200), d.client_name.slice(0, 120), d.client_email, d.user_id, d.service, d.amount, method, d.due_date, Date.now(), d.order_id ?? null, d.offer_id ?? null, d.kind ?? null],
  );
  let url: string | null = null;
  if (method === "stripe") {
    try {
      const link = await createPaymentLink({ id: pid, title: d.title, amount: d.amount, email: d.client_email, baseUrl: d.baseUrl });
      url = link.url;
      await run("UPDATE payments SET stripe_session = ?, stripe_url = ? WHERE id = ?", [link.id, link.url, pid]);
    } catch (e) {
      await run("DELETE FROM payments WHERE id = ?", [pid]);
      throw e;
    }
  }
  return { id: pid, url, method };
}

/** Anuluje oczekującą płatność (np. druga opcja wyceny po wpłacie pierwszej) */
export async function voidPayment(pid: string) {
  const p = await one<Payment>("SELECT * FROM payments WHERE id = ?", [pid]);
  if (!p || p.status !== "pending") return;
  await run("UPDATE payments SET status = 'canceled' WHERE id = ?", [pid]);
  if (p.stripe_session) await deactivateLink(p.stripe_session);
}

/** Oczekujące płatności z terminem w ciągu `days` dni (albo już po terminie) */
export async function paymentsDueSoon(days: number) {
  const limit = new Date(Date.now() + days * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  return all<Pick<Payment, "id" | "title" | "client_name" | "amount" | "due_date">>(
    "SELECT id, title, client_name, amount, due_date FROM payments WHERE status = 'pending' AND COALESCE(kind, '') != 'deposit' AND due_date IS NOT NULL AND due_date <= ? ORDER BY due_date LIMIT 5",
    [limit],
  );
}
