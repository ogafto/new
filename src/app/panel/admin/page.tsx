import type { Metadata } from "next";
import Link from "next/link";
import { all, one } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { formFunnel, homeVisits, kpis, live, series, sources, topPages } from "@/lib/analytics";
import { daysBetween, STATUS, today, upcoming } from "@/lib/orders";
import { fmtDateTime } from "@/lib/format";
import { AreaChart, Badge, BarList, Card, CardHead, Count, Delta, Empty, Icon, Stat } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import { financeSummary, paymentsDueSoon } from "@/lib/finance";
import { listLogs } from "@/lib/logs";
import CockpitHero, { Activity, Todo, type TodoItem } from "@/components/panel/CockpitHero";
import { getContent } from "@/lib/content-server";

export const metadata: Metadata = { title: "Kokpit" };

const greet = () => {
  const h = Number(new Intl.DateTimeFormat("pl-PL", { hour: "numeric", hour12: false, timeZone: "Europe/Warsaw" }).format(new Date()));
  return h < 5 ? "Dobrej nocy" : h < 12 ? "Dzień dobry" : h < 18 ? "Cześć" : "Dobry wieczór";
};

export default async function Cockpit() {
  const admin = await requireAdmin();
  const [k, s, home, clients, orders, money, newInq, inquiries, next, pages, src, funnel, fin, activity, nowOnline] = await Promise.all([
    kpis(30),
    series(30),
    homeVisits(),
    one<{ n: number }>("SELECT COUNT(*) n FROM users WHERE role = 'client' AND verified_at IS NOT NULL"),
    one<{ n: number }>("SELECT COUNT(*) n FROM orders WHERE status IN ('planned', 'active')"),
    one<{ n: number }>("SELECT COALESCE(SUM(amount), 0) n FROM orders WHERE status IN ('planned', 'active')"),
    one<{ n: number }>("SELECT COUNT(*) n FROM inquiries WHERE status = 'new'"),
    all<{ id: string; name: string; topic: string | null; status: string; created_at: number }>("SELECT id, name, topic, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 8"),
    upcoming(6),
    topPages(30),
    sources(30),
    formFunnel(30),
    financeSummary(),
    listLogs({ limit: 7 }),
    live(),
  ]);
  const soon = (await getContent()).soon.enabled;
  const t = today();
  const conv = k.cur.visitors ? Math.round((funnel[2].n / k.cur.visitors) * 1000) / 10 : 0;

  // „Do zrobienia”: zapytania bez odpowiedzi, płatności do pilnowania, bliskie terminy
  const pay = await paymentsDueSoon(3);
  const pln = (gr: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(gr / 100);
  const when = (d: number) => (d < 0 ? `${-d} dni po terminie` : d === 0 ? "dziś" : d === 1 ? "jutro" : `za ${d} dni`);
  const todo: TodoItem[] = [
    ...inquiries.filter((q) => q.status === "new").map((q) => ({ id: `i${q.id}`, kind: "inquiry" as const, title: q.name, sub: q.topic || "Nowe zapytanie", href: "/panel/admin/zapytania", action: "Odpowiedz", urgent: false })),
    ...pay.map((p) => {
      const d = daysBetween(t, p.due_date!);
      return { id: `p${p.id}`, kind: "payment" as const, title: `${p.title} · ${pln(Number(p.amount))}`, sub: `${p.client_name} · ${when(d)}`, href: "/panel/admin/finanse", action: d < 0 ? "Przypomnij" : "Sprawdź", urgent: d < 0 };
    }),
    ...next.filter((o) => daysBetween(t, o.due_date) <= 3).map((o) => {
      const d = daysBetween(t, o.due_date);
      return { id: `o${o.id}`, kind: "deadline" as const, title: o.title, sub: `${o.client_name} · ${when(d)}`, href: "/panel/admin/kalendarz", action: "Otwórz", urgent: d <= 0 };
    }),
  ].sort((a, b) => Number(b.urgent) - Number(a.urgent));

  return (
    <>
      <CockpitHero
        soon={soon}
        live={nowOnline}
        greeting={`${greet()},`}
        name={`${admin.name.split(" ")[0]}.`}
        date={new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(new Date())}
        stats={[
          { label: "dziś na głównej", value: home.today },
          { label: "nowe zapytania", value: Number(newInq?.n ?? 0), href: "/panel/admin/zapytania" },
          { label: "przychód w miesiącu", value: Math.round(fin.month.revenue / 100), suffix: " zł", href: "/panel/admin/finanse" },
          { label: "do zapłaty", value: Math.round(fin.pending.amount / 100), suffix: " zł", href: "/panel/admin/finanse" },
        ]}
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Todo items={todo} />
        <Activity rows={activity.map((r) => ({ id: r.id, ts: Number(r.ts), level: r.level, kind: r.kind, message: r.message }))} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="col-span-2 lg:row-span-2" glow>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-muted">Odwiedzający · 30 dni</p>
              <div className="mt-3 flex items-end gap-3">
                <Count value={k.cur.visitors} className="h-display text-[44px] leading-none sm:text-[56px]" />
                <Delta cur={k.cur.visitors} prev={k.prev.visitors} />
              </div>
              <p className="mt-2 text-[13px] text-dim">
                {k.cur.pageviews.toLocaleString("pl-PL")} odsłon · śr. {Math.floor(k.cur.avgTime / 60)}:{String(k.cur.avgTime % 60).padStart(2, "0")} min na wizytę
              </p>
            </div>
            <Link href="/panel/admin/analityka" className="flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-[13px] text-muted transition-colors hover:text-ink">
              Pełna analityka <Icon d={ICONS.chart} className="size-3.5" />
            </Link>
          </div>
          <div className="mt-6">
            <AreaChart data={s.map((d) => ({ t: d.t, a: d.visitors, b: d.views }))} label={["Odwiedzający", "Odsłony"]} />
          </div>
        </Card>
        <Stat label="Klienci z kontem" value={Number(clients?.n ?? 0)} icon={ICONS.users} delay={0.05} hint="Zweryfikowane konta" />
        <Stat label="W realizacji" value={Number(orders?.n ?? 0)} icon={ICONS.clock} delay={0.1} hint={`${Number(money?.n ?? 0).toLocaleString("pl-PL")} zł w zleceniach`} />
        <Stat label="Zysk w miesiącu" value={Math.round(fin.month.profit / 100)} suffix=" zł" icon={ICONS.wallet} delay={0.15} hint={`przychód ${Math.round(fin.month.revenue / 100).toLocaleString("pl-PL")} zł · koszty ${Math.round(fin.month.costs / 100).toLocaleString("pl-PL")} zł`} />
        <Stat label="Konwersja formularza" value={conv} suffix="%" decimals={1} icon={ICONS.target} delay={0.2} hint={`${funnel[2].n} wysłanych · 30 dni`} spark={s.slice(-14).map((d) => d.visitors)} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card delay={0.35}>
          <CardHead title="Najczęściej oglądane" sub="30 dni" />
          <BarList items={pages.slice(0, 6).map((p) => ({ name: p.path, n: Number(p.views) }))} />
        </Card>
        <Card delay={0.4}>
          <CardHead title="Skąd przychodzą" sub="30 dni" />
          <BarList items={src.slice(0, 6).map((p) => ({ name: p.name, n: Number(p.visitors) }))} />
        </Card>
      </div>
    </>
  );
}
