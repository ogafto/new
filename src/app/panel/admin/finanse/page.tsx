import type { Metadata } from "next";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { effectiveStatus, financeSummary, listExpenses, listPayments } from "@/lib/finance";
import { stripeReady } from "@/lib/stripe";
import { services } from "@/lib/site";
import { PageHead } from "@/components/panel/kit";
import Finance from "@/components/panel/Finance";

export const metadata: Metadata = { title: "Finanse" };

export default async function FinancePage() {
  await requireAdmin();
  const [payments, expenses, summary, stripe, clients] = await Promise.all([
    listPayments(),
    listExpenses(),
    financeSummary(),
    stripeReady(),
    all<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE role = 'client' ORDER BY name"),
  ]);
  return (
    <>
      <PageHead title="Finanse" />
      <Finance
        payments={payments.map((p) => ({ ...p, amount: Number(p.amount), created_at: Number(p.created_at), paid_at: p.paid_at ? Number(p.paid_at) : null, status: effectiveStatus(p) }))}
        expenses={expenses.map((e) => ({ ...e, amount: Number(e.amount), recurring: Number(e.recurring), created_at: Number(e.created_at) }))}
        summary={summary}
        stripe={stripe}
        clients={clients.map((c) => ({ id: String(c.id), name: String(c.name), email: String(c.email) }))}
        services={services.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );
}
