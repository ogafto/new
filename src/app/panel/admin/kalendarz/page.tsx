import type { Metadata } from "next";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { listOrders, today } from "@/lib/orders";
import Calendar from "@/components/panel/Calendar";
import { setting } from "@/lib/settings";

export const metadata: Metadata = { title: "Kalendarz" };

// ?nowe=1 (&klient, &email, &tytul) obsługuje sam kalendarz — działa też przy przejściu w obrębie strony
export default async function CalendarPage() {
  await requireAdmin();
  const [orders, clients, key] = await Promise.all([
    listOrders(),
    all<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE role = 'client' AND verified_at IS NOT NULL ORDER BY name"),
    setting("resend_api_key"),
  ]);
  return (
    <Calendar
      orders={orders.map((o) => ({ ...o, amount: o.amount === null ? null : Number(o.amount), remind_days: Number(o.remind_days) }))}
      clients={clients}
      today={today()}
      mail={!!key}
    />
  );
}
