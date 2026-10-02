import { requireAdmin } from "@/lib/auth/session";
import { exportViews, RANGES } from "@/lib/analytics";

export async function GET(req: Request) {
  await requireAdmin();
  const z = new URL(req.url).searchParams.get("zakres");
  const days = RANGES.find((r) => String(r.days) === z)?.days ?? 30;
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Czas", "Adres", "Źródło", "Urządzenie", "Przeglądarka", "System", "Kraj", "Czas na stronie (s)", "Przewinięcie (%)"].map(q).join(";")];
  for (const r of await exportViews(days))
    rows.push([new Date(Number(r.ts)).toLocaleString("sv-SE", { timeZone: "Europe/Warsaw" }), r.path, r.source, r.device, r.browser, r.os, r.country, Math.round(Number(r.duration) / 1000), r.scroll].map(q).join(";"));
  return new Response("﻿" + rows.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="afto-analityka-${days}d.csv"` } });
}
