import type { Metadata } from "next";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { listOrders, today } from "@/lib/orders";
import { PageHead } from "@/components/panel/kit";
import Calendar from "@/components/panel/Calendar";

export const metadata: Metadata = { title: "Kalendarz" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ nowe?: string; klient?: string; email?: string; tytul?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [orders, clients] = await Promise.all([listOrders(), all<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE role = 'client' AND verified_at IS NOT NULL ORDER BY name")]);
  return (
    <>
      <PageHead kicker="Kalendarz" title="Zlecenia i terminy" />
      <Calendar
        orders={orders.map((o) => ({ ...o, amount: o.amount === null ? null : Number(o.amount), remind_days: Number(o.remind_days) }))}
        clients={clients}
        today={today()}
        mail={!!process.env.RESEND_API_KEY}
        prefill={sp.nowe ? { client_name: sp.klient ?? "", client_email: sp.email ?? "", title: sp.tytul ?? "" } : null}
      />
    </>
  );
}
