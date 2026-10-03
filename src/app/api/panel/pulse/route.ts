import { NextResponse } from "next/server";
import { all } from "@/lib/db";
import { currentUser, isAdmin } from "@/lib/auth/session";
import { live } from "@/lib/analytics";

/*
 * Puls panelu admina: licznik „na stronie” + nowe wpłaty i zapytania od `since`.
 * Zwykły GET zamiast akcji serwera — akcje idą w kolejce routera i co 8 s blokowałyby przejścia między podstronami.
 */

export const dynamic = "force-dynamic";

export type PulseEvent = { id: string; kind: "payment" | "inquiry" | "order"; iid?: string; title: string; text: string; meta?: string; ts: number; href: string };

const zl = (gr: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: gr % 100 ? 2 : 0 }).format(gr / 100);

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user || !user.verified_at || !isAdmin(user)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const since = Math.max(0, Number(new URL(req.url).searchParams.get("since")) || 0);
  const now = Date.now();
  const [n, paid, inq] = await Promise.all([
    live(),
    all<{ id: string; title: string; client_name: string; amount: number; paid_at: number }>("SELECT id, title, client_name, amount, paid_at FROM payments WHERE status = 'paid' AND paid_at > ? ORDER BY paid_at DESC LIMIT 5", [since]),
    all<{ id: string; name: string; topic: string | null; budget: string | null; timeline: string | null; source: string | null; created_at: number }>(
      "SELECT id, name, topic, budget, timeline, source, created_at FROM inquiries WHERE created_at > ? AND status = 'new' ORDER BY created_at DESC LIMIT 5",
      [since],
    ),
  ]);
  const events: PulseEvent[] = [
    ...paid.map((p) => ({ id: `p-${p.id}`, kind: "payment" as const, title: `Wpłata ${zl(Number(p.amount))}`, text: `${p.client_name} · ${p.title}`, ts: Number(p.paid_at), href: "/panel/admin/finanse" })),
    ...inq.map((q) => ({
      id: `i-${q.id}`,
      kind: q.source === "panel" ? ("order" as const) : ("inquiry" as const),
      iid: q.id,
      title: q.source === "panel" ? `Nowe zamówienie: ${q.name}` : `Nowe zapytanie: ${q.name}`,
      text: q.topic || "Formularz kontaktowy",
      meta: [q.budget, q.timeline].filter(Boolean).join(" · ") || undefined,
      ts: Number(q.created_at),
      href: `/panel/admin/zapytania?id=${q.id}`,
    })),
  ].sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ live: n, now, events }, { headers: { "Cache-Control": "no-store" } });
}
