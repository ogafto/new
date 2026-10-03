import type { Metadata } from "next";
import { all, one } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { sitesForUser } from "@/lib/cms";
import { today, daysBetween, type Order } from "@/lib/orders";
import PanelShell, { type Note } from "@/components/panel/PanelShell";
import { getContent } from "@/lib/content-server";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

async function adminNotes() {
  const t = today();
  const [orders, inquiries] = await Promise.all([
    all<Order>("SELECT * FROM orders WHERE status IN ('planned', 'active') ORDER BY due_date LIMIT 20"),
    all<{ id: string; name: string; topic: string | null; created_at: number }>("SELECT id, name, topic, created_at FROM inquiries WHERE status = 'new' ORDER BY created_at DESC LIMIT 5"),
  ]);
  const notes: Note[] = [];
  for (const o of orders) {
    const d = daysBetween(t, o.due_date);
    if (d <= 7) notes.push({ id: `o-${o.id}`, kind: "deadline", title: o.title, text: `${o.client_name} · ${d < 0 ? `po terminie ${-d} dni` : d === 0 ? "termin dziś" : d === 1 ? "termin jutro" : `termin za ${d} dni`}`, href: "/panel/admin/kalendarz", urgent: d <= 1 });
  }
  for (const i of inquiries) notes.push({ id: `i-${i.id}`, kind: "inquiry", title: `Nowe zapytanie: ${i.name}`, text: i.topic ?? "Formularz kontaktowy", href: "/panel/admin/zapytania", urgent: false });
  return notes;
}

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const [notes, newInq, sites] = await Promise.all([
    admin ? adminNotes() : Promise.resolve([]),
    admin ? one<{ n: number }>("SELECT COUNT(*) n FROM inquiries WHERE status = 'new'") : Promise.resolve(null),
    admin ? Promise.resolve([]) : sitesForUser(user.id),
  ]);
  return (
    <PanelShell
      user={{ name: user.name, email: user.email }}
      admin={admin}
      notes={notes}
      counts={{ inquiries: Number(newInq?.n ?? 0) }}
      sites={sites.map((s) => ({ id: s.id, name: s.name }))}
      soon={admin ? (await getContent()).soon.enabled : false}
    >
      {children}
    </PanelShell>
  );
}
