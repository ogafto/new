import { all } from "./db";
import type { Order } from "./orders";

/* Dane panelu klienta: jego zgłoszenia (zamówienia z panelu / formularza) i zlecenia z kalendarza. */

export type ClientRequest = { id: string; topic: string | null; budget: string | null; timeline: string | null; message: string; status: string; created_at: number; source: string | null };

export async function clientRequests(userId: string, email: string) {
  return (
    await all<ClientRequest>(
      "SELECT id, topic, budget, timeline, message, status, created_at, source FROM inquiries WHERE user_id = ? OR lower(email) = lower(?) ORDER BY created_at DESC LIMIT 50",
      [userId, email],
    )
  ).map((r) => ({ ...r, created_at: Number(r.created_at) }));
}

export async function clientOrders(userId: string, email: string) {
  return (
    await all<Order>("SELECT * FROM orders WHERE (user_id = ? OR lower(client_email) = lower(?)) AND status != 'cancelled' ORDER BY CASE status WHEN 'done' THEN 1 ELSE 0 END, due_date", [userId, email])
  ).map((o) => ({ ...o, amount: o.amount == null ? null : Number(o.amount) }));
}

// statusy zgłoszeń widziane przez klienta
export const REQUEST_STATUS: Record<string, { label: string; tone: "accent" | "sky" | "green" | "default" }> = {
  new: { label: "Wysłane", tone: "accent" },
  contacted: { label: "W rozmowie", tone: "sky" },
  won: { label: "Przyjęte", tone: "green" },
  lost: { label: "Zamknięte", tone: "default" },
};
