import type { Metadata } from "next";
import Link from "next/link";
import { all, one } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { formFunnel, homeVisits, kpis, live, series, sources, topPages } from "@/lib/analytics";
import { daysBetween, STATUS, today, upcoming } from "@/lib/orders";
import { fmtDateTime } from "@/lib/format";
import { AreaChart, BarList, Card, CardHead, Count, Delta, Icon } from "@/components/panel/kit";
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
  const nNew = inquiries.filter((q) => q.status === "new").length;
  const nLate = pay.filter((p) => daysBetween(t, p.due_date!) < 0).length;
  const nSoon = next.filter((o) => daysBetween(t, o.due_date) <= 7).length;
  const summary = [
    nNew ? `${nNew} ${nNew === 1 ? "nowe zapytanie" : "nowe zapytania"}` : "Brak nowych zapytań",
    nLate ? `${nLate} ${nLate === 1 ? "płatność po terminie" : "płatności po terminie"}` : null,
    nSoon ? `${nSoon} ${nSoon === 1 ? "termin" : "terminy"} w tym tygodniu` : null,
  ]
    .filter(Boolean)
    .join(" · ") + ".";

  return (
    <>
      <CockpitHero
        soon={soon}
        greeting={`${greet()},`}
        name={`${admin.name.split(" ")[0]}.`}
        accent={todo.length ? `${todo.length} ${todo.length === 1 ? "sprawa czeka." : todo.length < 5 ? "sprawy czekają." : "spraw czeka."}` : "Wszystko ogarnięte."}
        date={new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(new Date())}
        summary={summary}
        stats={[
          { label: "na stronie teraz", value: nowOnline, live: true, href: "/panel/admin/analityka" },
          { label: "dziś na głównej", value: home.today, href: "/panel/admin/analityka" },
          { label: "przychód w miesiącu", value: Math.round(fin.month.revenue / 100), suffix: " zł", href: "/panel/admin/finanse" },
          { label: "do zapłaty", value: Math.round(fin.pending.amount / 100), suffix: " zł", href: "/panel/admin/finanse" },
        ]}
        actions={
          <>
            <Link href={todo[0]?.href ?? "/panel/admin/zapytania"} className="group btn btn-primary !h-12 text-[14.5px]">
              <span className="roll">
                <span>{todo.length ? "Zacznij od pierwszej" : "Zobacz zapytania"}</span>
                <span aria-hidden>{todo.length ? "Zacznij od pierwszej" : "Zobacz zapytania"}</span>
              </span>
              <span className="dot !size-9">
                <Icon d={ICONS.arrowUp} className="size-4 rotate-45" />
              </span>
            </Link>
            <Link href="/panel/admin/finanse?nowa=1" className="btn btn-outline !h-12 text-[14.5px]">
              Nowa płatność
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="min-w-0 lg:col-span-7">
          <Todo items={todo} />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <Activity rows={activity.map((r) => ({ id: r.id, ts: Number(r.ts), level: r.level, kind: r.kind, message: r.message }))} />
        </div>

        <Card className="lg:col-span-8" glow delay={0.2}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-muted">Odwiedzający · 30 dni</p>
              <div className="mt-2 flex items-end gap-3">
                <Count value={k.cur.visitors} className="h-display text-[48px] leading-none sm:text-[60px]" />
                <span className="mb-1.5">
                  <Delta cur={k.cur.visitors} prev={k.prev.visitors} />
                </span>
              </div>
            </div>
            <Link href="/panel/admin/analityka" className="group flex items-center gap-2 rounded-full border border-line-2 py-1.5 pr-1.5 pl-4 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-ink">
              Analityka
              <span className="grid size-7 place-items-center rounded-full bg-white/[0.06] transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon d={ICONS.arrowUp} className="size-3.5 rotate-45" />
              </span>
            </Link>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-4 sm:grid-cols-4">
            {[
              ["Odsłony", k.cur.pageviews.toLocaleString("pl-PL")],
              ["Śr. czas wizyty", `${Math.floor(k.cur.avgTime / 60)}:${String(k.cur.avgTime % 60).padStart(2, "0")} min`],
              ["Konwersja formularza", `${conv.toLocaleString("pl-PL")}%`],
              ["Klienci z kontem", String(Number(clients?.n ?? 0))],
            ].map(([l, v]) => (
              <div key={l}>
                <dt className="text-[12px] text-dim">{l}</dt>
                <dd className="mt-0.5 text-[16px] tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <AreaChart data={s.map((d) => ({ t: d.t, a: d.visitors, b: d.views }))} label={["Odwiedzający", "Odsłony"]} />
          </div>
        </Card>

        <Card className="lg:col-span-4" delay={0.25}>
          <CardHead title="Biznes" sub="Ten miesiąc">
            <Link href="/panel/admin/finanse" className="text-[13px] text-muted transition-colors hover:text-ink">
              Finanse →
            </Link>
          </CardHead>
          <p className="text-[13px] text-muted">Zysk</p>
          <Count value={Math.round(fin.month.profit / 100)} suffix=" zł" className={`h-display mt-1 block text-[44px] leading-none sm:text-[52px] ${fin.month.profit < 0 ? "text-red-300" : ""}`} />
          <div className="mt-6 space-y-3">
            {[
              { l: "Przychód", v: fin.month.revenue, c: "from-accent to-accent-2" },
              { l: "Koszty", v: fin.month.costs, c: "from-white/30 to-white/50" },
            ].map((r) => (
              <div key={r.l}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="text-muted">{r.l}</span>
                  <span className="tabular-nums">{pln(r.v)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div className={`h-full rounded-full bg-gradient-to-r ${r.c}`} style={{ width: `${Math.round((r.v / Math.max(1, fin.month.revenue, fin.month.costs)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link href="/panel/admin/kalendarz" className="rounded-2xl border border-line p-3.5 transition-colors hover:border-line-2 hover:bg-white/[0.02]">
              <p className="text-[12px] text-dim">W realizacji</p>
              <p className="mt-1 text-[22px] leading-none tabular-nums">{Number(orders?.n ?? 0)}</p>
              <p className="mt-1.5 truncate text-[12px] text-muted">{Number(money?.n ?? 0).toLocaleString("pl-PL")} zł</p>
            </Link>
            <Link href="/panel/admin/finanse" className="rounded-2xl border border-line p-3.5 transition-colors hover:border-line-2 hover:bg-white/[0.02]">
              <p className="text-[12px] text-dim">Do zapłaty</p>
              <p className="mt-1 text-[22px] leading-none tabular-nums">{fin.pending.count ?? 0}</p>
              <p className="mt-1.5 truncate text-[12px] text-muted">{pln(fin.pending.amount)}</p>
            </Link>
          </div>
        </Card>

        <Card className="lg:col-span-6" delay={0.3}>
          <CardHead title="Najczęściej oglądane" sub="30 dni" />
          <BarList items={pages.slice(0, 6).map((p) => ({ name: p.path, n: Number(p.views) }))} />
        </Card>
        <Card className="lg:col-span-6" delay={0.35}>
          <CardHead title="Skąd przychodzą" sub="30 dni" />
          <BarList items={src.slice(0, 6).map((p) => ({ name: p.name, n: Number(p.visitors) }))} />
        </Card>
      </div>
    </>
  );
}
