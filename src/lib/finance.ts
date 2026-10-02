import { createElement } from "react";
import { all, one, run } from "./db";
import { log } from "./logs";
import { setting } from "./settings";
import { site } from "./site";
import { deactivateLink } from "./stripe";

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
  return all<Payment>("SELECT * FROM payments WHERE (user_id = ? OR lower(client_email) = lower(?)) AND status IN ('pending', 'paid') ORDER BY created_at DESC LIMIT 20", [userId, email]);
}

/** Podsumowanie: bieżący miesiąc, rok, oczekujące i 12 miesięcy wstecz */
export async function financeSummary() {
  const [payments, expenses] = await Promise.all([all<Payment>("SELECT amount, status, paid_at, due_date, created_at FROM payments"), all<Expense>("SELECT amount, date, recurring, created_at FROM expenses")]);
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
  const pending = payments.filter((p) => p.status === "pending");
  return {
    month: { revenue: rev[cur], costs: cost[cur], profit: rev[cur] - cost[cur], prevRevenue: rev[prev], prevCosts: cost[prev] },
    year: { revenue: months.filter((m) => m.startsWith(year)).reduce((a, m) => a + rev[m], 0), costs: months.filter((m) => m.startsWith(year)).reduce((a, m) => a + cost[m], 0) },
    pending: { count: pending.length, amount: pending.reduce((a, p) => a + Number(p.amount), 0), overdue: pending.filter((p) => effectiveStatus(p as Payment) === "overdue").length },
    chart: months.map((m) => ({ m, revenue: rev[m], costs: cost[m] })),
    paidCount: payments.filter((p) => p.status === "paid").length,
  };
}

async function notifyPaid(p: Payment, via: string) {
  const text = `Wpłata ${zl(Number(p.amount))} — ${p.title} (${p.client_name})`;
  // mail do admina (powiadomienia albo adres admina)
  try {
    const [{ sendMail, baseUrl }, { adminEmail }, { default: PaidEmail }] = await Promise.all([import("./mail"), import("./auth/admin"), import("@/emails/PaidEmail")]);
    const to = (await setting("notify_email")) || adminEmail();
    if (to)
      await sendMail({
        to,
        subject: `💸 ${p.client_name} zapłacił(a) ${zl(Number(p.amount))}`,
        react: createElement(PaidEmail, { client: p.client_name, title: p.title, amount: zl(Number(p.amount)), method: via, email: p.client_email, baseUrl: await baseUrl() }),
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
        embeds: [{ title: "Nowa wpłata", description: text, color: 0x34d399, timestamp: new Date().toISOString() }],
      }),
    }).catch(() => {});
}

/** Oznacza płatność jako opłaconą (webhook, ręczne sprawdzenie albo ręcznie w panelu) */
export async function markPaid(id: string, opts: { via: "webhook" | "check" | "manual"; stripePayment?: string | null; actor?: string }) {
  const p = await one<Payment>("SELECT * FROM payments WHERE id = ?", [id]);
  if (!p || p.status === "paid") return p;
  const now = Date.now();
  await run("UPDATE payments SET status = 'paid', paid_at = ?, stripe_payment = COALESCE(?, stripe_payment) WHERE id = ?", [now, opts.stripePayment ?? null, id]);
  if (p.stripe_session) await deactivateLink(p.stripe_session);
  const label = { webhook: "Stripe", check: "sprawdzenie w Stripe", manual: "ręcznie" }[opts.via];
  await log("payment", `Opłacono: ${p.title} — ${zl(Number(p.amount))} (${p.client_name})`, { level: "success", actor: opts.actor ?? null, meta: { id, via: label } });
  // ręczne oznaczenie robi sam admin — powiadomienia tylko dla wpłat ze Stripe
  if (opts.via !== "manual") await notifyPaid(p, "Stripe");
  return { ...p, status: "paid" as const, paid_at: now };
}
