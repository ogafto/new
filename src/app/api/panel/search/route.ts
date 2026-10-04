import { NextResponse } from "next/server";
import { all } from "@/lib/db";
import { currentUser, isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export type Hit = { id: string; kind: "client" | "inquiry" | "order" | "payment" | "site"; label: string; hint: string; href: string };

const zl = (gr: number) => `${(gr / 100).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;

// Wyszukiwanie w palecie ⌘K: klienci, zapytania, zlecenia, płatności, strony klientów (tylko admin)
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user || !user.verified_at || !isAdmin(user)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ hits: [] });
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const [clients, inquiries, orders, payments, sites] = await Promise.all([
    all<{ id: string; name: string; email: string; phone: string | null }>("SELECT id, name, email, phone FROM users WHERE role = 'client' AND (lower(name) LIKE ? OR lower(email) LIKE ? OR replace(COALESCE(phone, ''), ' ', '') LIKE ?) LIMIT 5", [like, like, like.replace(/\s/g, "")]),
    all<{ id: string; name: string; topic: string | null; status: string }>("SELECT id, name, topic, status FROM inquiries WHERE lower(name) LIKE ? OR lower(email) LIKE ? OR lower(COALESCE(topic, '')) LIKE ? OR lower(COALESCE(company, '')) LIKE ? ORDER BY created_at DESC LIMIT 5", [like, like, like, like]),
    all<{ id: string; title: string; client_name: string; due_date: string }>("SELECT id, title, client_name, due_date FROM orders WHERE lower(title) LIKE ? OR lower(client_name) LIKE ? OR lower(COALESCE(client_email, '')) LIKE ? ORDER BY created_at DESC LIMIT 5", [like, like, like]),
    all<{ id: string; title: string; client_name: string; amount: number; status: string }>("SELECT id, title, client_name, amount, status FROM payments WHERE status != 'canceled' AND (lower(title) LIKE ? OR lower(client_name) LIKE ? OR lower(COALESCE(client_email, '')) LIKE ?) ORDER BY created_at DESC LIMIT 5", [like, like, like]),
    all<{ id: string; name: string; domain: string | null }>("SELECT id, name, domain FROM cms_sites WHERE lower(name) LIKE ? OR lower(COALESCE(domain, '')) LIKE ? LIMIT 5", [like, like]),
  ]);
  const ST: Record<string, string> = { new: "nowe", contacted: "w kontakcie", won: "zlecenie", lost: "bez zlecenia", pending: "czeka", paid: "opłacona", refunded: "zwrot" };
  const hits: Hit[] = [
    ...clients.map((c) => ({ id: `c${c.id}`, kind: "client" as const, label: c.name, hint: `klient · ${c.email}`, href: `/panel/admin/klienci?q=${encodeURIComponent(c.email)}` })),
    ...inquiries.map((i) => ({ id: `i${i.id}`, kind: "inquiry" as const, label: i.name, hint: `zapytanie · ${i.topic ?? "—"} · ${ST[i.status] ?? i.status}`, href: `/panel/admin/zapytania?id=${i.id}` })),
    ...orders.map((o) => ({ id: `o${o.id}`, kind: "order" as const, label: o.title, hint: `zlecenie · ${o.client_name} · termin ${o.due_date}`, href: `/panel/admin/zlecenia/${o.id}` })),
    ...payments.map((p) => ({ id: `p${p.id}`, kind: "payment" as const, label: p.title, hint: `płatność · ${p.client_name} · ${zl(Number(p.amount))} · ${ST[p.status] ?? p.status}`, href: `/panel/admin/finanse?q=${encodeURIComponent(p.title)}` })),
    ...sites.map((s) => ({ id: `s${s.id}`, kind: "site" as const, label: s.name, hint: `strona klienta${s.domain ? ` · ${s.domain}` : ""}`, href: `/panel/admin/strony/${s.id}` })),
  ];
  return NextResponse.json({ hits }, { headers: { "Cache-Control": "no-store" } });
}
