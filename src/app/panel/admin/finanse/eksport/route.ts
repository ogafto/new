import { requireAdmin } from "@/lib/auth/session";
import { effectiveStatus, listExpenses, listPayments, METHODS } from "@/lib/finance";

// Eksport do CSV (Excel / Google Sheets / księgowość)
export async function GET(req: Request) {
  await requireAdmin();
  const kind = new URL(req.url).searchParams.get("co") === "koszty" ? "koszty" : "platnosci";
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const d = (ms: number | null) => (ms ? new Date(Number(ms)).toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" }) : "");
  const money = (gr: number) => (Number(gr) / 100).toFixed(2).replace(".", ",");
  let rows: string[];
  if (kind === "koszty") {
    rows = [["Data", "Nazwa", "Kategoria", "Kwota (zł)", "Co miesiąc", "Notatka"].map(q).join(";")];
    for (const e of await listExpenses()) rows.push([e.date, e.title, e.category, money(e.amount), Number(e.recurring) ? "tak" : "nie", e.notes].map(q).join(";"));
  } else {
    const label = { pending: "oczekuje", overdue: "po terminie", paid: "opłacone", canceled: "anulowane", refunded: "zwrot" };
    rows = [["Utworzono", "Tytuł", "Klient", "E-mail", "Kwota (zł)", "Status", "Metoda", "Termin", "Opłacono"].map(q).join(";")];
    for (const p of await listPayments()) rows.push([d(p.created_at), p.title, p.client_name, p.client_email, money(p.amount), label[effectiveStatus(p)], METHODS[p.method], p.due_date, d(p.paid_at)].map(q).join(";"));
  }
  const name = `afto-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response("﻿" + rows.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` } });
}
