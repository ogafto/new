import type { Metadata } from "next";
import Link from "next/link";
import { all, one } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { formFunnel, homeVisits, kpis, series, sources, topPages } from "@/lib/analytics";
import { daysBetween, STATUS, today, upcoming } from "@/lib/orders";
import { fmtDateTime } from "@/lib/format";
import { AreaChart, Badge, BarList, Card, CardHead, Count, Delta, Empty, Icon, PageHead, Stat } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import QuickActions from "@/components/panel/QuickActions";

export const metadata: Metadata = { title: "Kokpit" };

const greet = () => {
  const h = Number(new Intl.DateTimeFormat("pl-PL", { hour: "numeric", hour12: false, timeZone: "Europe/Warsaw" }).format(new Date()));
  return h < 5 ? "Dobrej nocy" : h < 12 ? "Dzień dobry" : h < 18 ? "Cześć" : "Dobry wieczór";
};

export default async function Cockpit() {
  const admin = await requireAdmin();
  const [k, s, home, clients, orders, money, newInq, inquiries, next, pages, src, funnel] = await Promise.all([
    kpis(30),
    series(30),
    homeVisits(),
    one<{ n: number }>("SELECT COUNT(*) n FROM users WHERE role = 'client' AND verified_at IS NOT NULL"),
    one<{ n: number }>("SELECT COUNT(*) n FROM orders WHERE status IN ('planned', 'active')"),
    one<{ n: number }>("SELECT COALESCE(SUM(amount), 0) n FROM orders WHERE status IN ('planned', 'active')"),
    one<{ n: number }>("SELECT COUNT(*) n FROM inquiries WHERE status = 'new'"),
    all<{ id: string; name: string; topic: string | null; status: string; created_at: number }>("SELECT id, name, topic, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 5"),
    upcoming(6),
    topPages(30),
    sources(30),
    formFunnel(30),
  ]);
  const t = today();
  const conv = k.cur.visitors ? Math.round((funnel[2].n / k.cur.visitors) * 1000) / 10 : 0;

  return (
    <>
      <PageHead kicker="Kokpit" title={`${greet()}, ${admin.name.split(" ")[0]}.`}>
        <QuickActions />
      </PageHead>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2 lg:row-span-2" glow>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-muted">Odwiedzający · 30 dni</p>
              <div className="mt-3 flex items-end gap-3">
                <Count value={k.cur.visitors} className="h-display text-[56px] leading-none" />
                <Delta cur={k.cur.visitors} prev={k.prev.visitors} />
              </div>
              <p className="mt-2 text-[13px] text-dim">
                {k.cur.pageviews.toLocaleString("pl-PL")} odsłon · śr. {Math.floor(k.cur.avgTime / 60)}:{String(k.cur.avgTime % 60).padStart(2, "0")} min na wizytę
              </p>
            </div>
            <Link href="/panel/admin/analityka" className="flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-[13px] text-muted transition-colors hover:text-ink">
              Pełna analityka <Icon d={ICONS.site} className="size-3.5" />
            </Link>
          </div>
          <div className="mt-6">
            <AreaChart data={s.map((d) => ({ t: d.t, a: d.visitors, b: d.views }))} label={["Odwiedzający", "Odsłony"]} />
          </div>
        </Card>
        <Stat label="Strona główna dziś" value={home.today} hint={`${home.month.toLocaleString("pl-PL")} osób w 30 dni`} icon={ICONS.eye} spark={s.slice(-14).map((d) => d.visitors)} delay={0.05} />
        <Stat label="Klienci z kontem" value={Number(clients?.n ?? 0)} icon={ICONS.users} delay={0.1} hint="Zweryfikowane konta" />
        <Stat label="W realizacji" value={Number(orders?.n ?? 0)} icon={ICONS.clock} delay={0.15} hint={`${Number(money?.n ?? 0).toLocaleString("pl-PL")} zł w trakcie`} />
        <Stat label="Nowe zapytania" value={Number(newInq?.n ?? 0)} icon={ICONS.inbox} delay={0.2} hint={`Konwersja formularza ${conv.toLocaleString("pl-PL")}%`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card delay={0.25}>
          <CardHead title="Nadchodzące terminy" sub="Zlecenia z kalendarza">
            <Link href="/panel/admin/kalendarz" className="text-[13px] text-muted transition-colors hover:text-ink">
              Kalendarz →
            </Link>
          </CardHead>
          {next.length === 0 ? (
            <Empty icon={ICONS.calendar} title="Brak zaplanowanych zleceń" text="Dodaj zlecenie w kalendarzu, a przypomnę Ci mailem o terminie." />
          ) : (
            <ul className="space-y-2">
              {next.map((o) => {
                const d = daysBetween(t, o.due_date);
                const total = Math.max(1, daysBetween(o.start_date, o.due_date));
                const done = Math.min(1, Math.max(0, daysBetween(o.start_date, t) / total));
                return (
                  <li key={o.id} className="rounded-2xl border border-line p-4 transition-colors hover:border-line-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px]">{o.title}</p>
                        <p className="mt-0.5 truncate text-[12.5px] text-dim">
                          <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${STATUS[o.status].dot}`} />
                          {o.client_name}
                          {o.service ? ` · ${o.service}` : ""}
                        </p>
                      </div>
                      <Badge tone={d < 0 ? "red" : d <= 2 ? "amber" : "default"}>{d < 0 ? `${-d} dni po terminie` : d === 0 ? "dziś" : d === 1 ? "jutro" : `za ${d} dni`}</Badge>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={`h-full rounded-full ${d < 0 ? "bg-red-400" : "bg-gradient-to-r from-accent to-accent-2"}`} style={{ width: `${Math.round(done * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card delay={0.3}>
          <CardHead title="Ostatnie zapytania" sub="Z formularza na stronie">
            <Link href="/panel/admin/zapytania" className="text-[13px] text-muted transition-colors hover:text-ink">
              Wszystkie →
            </Link>
          </CardHead>
          {inquiries.length === 0 ? (
            <Empty icon={ICONS.inbox} title="Jeszcze cisza" text="Gdy ktoś wyśle formularz, zobaczysz to tutaj." />
          ) : (
            <ul className="divide-y divide-line">
              {inquiries.map((q) => (
                <li key={q.id}>
                  <Link href="/panel/admin/zapytania" className="flex items-center gap-3 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.05] text-[13px]">{q.name.charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px]">{q.name}</span>
                      <span className="block truncate text-[12.5px] text-dim">{q.topic || "—"}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      {q.status === "new" && <Badge tone="accent">nowe</Badge>}
                      <span className="mt-1 block text-[11.5px] text-dim">{fmtDateTime(q.created_at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
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
