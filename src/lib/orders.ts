import { createElement } from "react";
import { all, run } from "./db";
import { baseUrl, sendMail } from "./mail";
import { adminEmail } from "./auth/admin";
import { setting } from "./settings";
import ReminderEmail from "@/emails/ReminderEmail";
import { log } from "./logs";

export type Order = {
  id: string;
  title: string;
  client_name: string;
  client_email: string | null;
  user_id: string | null;
  service: string | null;
  amount: number | null;
  start_date: string;
  due_date: string;
  status: "planned" | "active" | "done" | "cancelled";
  notes: string | null;
  remind_days: number;
  reminded_before: number | null;
  reminded_due: number | null;
  created_at: number;
};

export const STATUS: Record<Order["status"], { label: string; dot: string }> = {
  planned: { label: "Zaplanowane", dot: "bg-sky-400" },
  active: { label: "W realizacji", dot: "bg-accent" },
  done: { label: "Oddane", dot: "bg-emerald-400" },
  cancelled: { label: "Anulowane", dot: "bg-white/30" },
};

// dzisiejsza data w Polsce jako RRRR-MM-DD
export const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(new Date());
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export async function listOrders() {
  return all<Order>("SELECT * FROM orders ORDER BY due_date, created_at");
}

export async function upcoming(limit = 6) {
  return all<Order>("SELECT * FROM orders WHERE status IN ('planned', 'active') ORDER BY due_date LIMIT ?", [limit]);
}

/*
 * Przypomnienia: jeden mail dziennie z listą zleceń, którym zbliża się termin (remind_days przed),
 * których termin jest dziś albo minął. Każde zlecenie trafia do maila „przed” i „w dniu” tylko raz.
 */
export async function sendReminders() {
  const to = (await setting("notify_email")) || adminEmail();
  if (!to) return { sent: 0, reason: "Brak ADMIN_EMAIL / NOTIFY_EMAIL" };
  const t = today();
  const open = await all<Order>("SELECT * FROM orders WHERE status IN ('planned', 'active')");
  const soon = open.filter((o) => !o.reminded_before && daysBetween(t, o.due_date) > 0 && daysBetween(t, o.due_date) <= o.remind_days);
  const due = open.filter((o) => !o.reminded_due && daysBetween(t, o.due_date) <= 0);
  if (!soon.length && !due.length) return { sent: 0 };

  const items = [...due, ...soon].map((o) => ({
    title: o.title,
    client: o.client_name,
    service: o.service,
    due: o.due_date,
    days: daysBetween(t, o.due_date),
  }));
  const res = await sendMail({
    to,
    subject: due.length ? `Termin dziś: ${due.map((o) => o.title).join(", ")}` : `Zbliża się termin: ${soon.map((o) => o.title).join(", ")}`,
    react: createElement(ReminderEmail, { items, baseUrl: await baseUrl() }),
  });
  if (res.ok) {
    const now = Date.now();
    for (const o of soon) await run("UPDATE orders SET reminded_before = ? WHERE id = ?", [now, o.id]);
    for (const o of due) await run("UPDATE orders SET reminded_due = ? WHERE id = ?", [now, o.id]);
  }
  await log("system", res.ok ? `Przypomnienie o terminach (${items.length}) wysłane do ${to}` : "Nie wysłano przypomnienia o terminach", { level: res.ok ? "info" : "error" });
  return { sent: res.ok ? items.length : 0 };
}

// Porządki zgodne z polityką prywatności (raz dziennie razem z przypomnieniami)
export async function housekeeping() {
  const now = Date.now();
  const months = (m: number) => now - m * 30.44 * 86_400_000;
  await run("DELETE FROM pageviews WHERE ts < ?", [months(26)]);
  await run("DELETE FROM events WHERE ts < ?", [months(26)]);
  await run("DELETE FROM inquiries WHERE status != 'won' AND created_at < ?", [months(12)]);
  await run("DELETE FROM sessions WHERE expires_at < ?", [now]);
}
