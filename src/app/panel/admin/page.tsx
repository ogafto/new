import type { Metadata } from "next";
import Link from "next/link";
import { all, one } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { kpis, live, series, sources, topPages } from "@/lib/analytics";
import { daysBetween, STATUS, today, upcoming } from "@/lib/orders";
import { BarList, PageHead } from "@/components/panel/kit";
import { Ago, GlowChart, Metric, Panel, Row } from "@/components/panel/dash";
import { ICONS } from "@/components/panel/icons";
import { financeSummary, paymentsDueSoon } from "@/lib/finance";
import { listLogs } from "@/lib/logs";

export const metadata: Metadata = { title: "Kokpit" };

const greet = () => {
  const h = Number(new Intl.DateTimeFormat("pl-PL", { hour: "numeric", hour12: false, timeZone: "Europe/Warsaw" }).format(new Date()));
  return h < 5 ? "Dobrej nocy" : h < 12 ? "Dzień dobry" : h < 18 ? "Cześć" : "Dobry wieczór";
};

export default async function Cockpit() {
  const admin = await requireAdmin();
  const [k, s, orders, money, inquiries, next, pages, src, fin, activity, nowOnline] = await Promise.all([
    kpis(30),
    series(30),
    one<{ n: number }>("SELECT COUNT(*) n FROM orders WHERE status IN ('planned', 'active')"),
    one<{ n: number }>("SELECT COALESCE(SUM(amount), 0) n FROM orders WHERE status IN ('planned', 'active')"),
    all<{ id: string; name: string; topic: string | null; status: string; source: string | null; created_at: number }>("SELECT id, name, topic, status, source, created_at FROM inquiries ORDER BY created_at DESC LIMIT 8"),
    upcoming(6),
    topPages(30),
    sources(30),
    financeSummary(),
    listLogs({ limit: 7, skip: ["auth", "system"] }),
    live(),
  ]);
  const t = today();

  // „Do zrobienia”: zapytania bez odpowiedzi, płatności do pilnowania, bliskie terminy
  const pay = await paymentsDueSoon(3);
  const pln = (gr: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(gr / 100);
  const when = (d: number) => (d < 0 ? `${-d} dni po terminie` : d === 0 ? "dziś" : d === 1 ? "jutro" : `za ${d} dni`);
  type TodoItem = { id: string; kind: "inquiry" | "payment" | "deadline"; title: string; sub: string; href: string; action: string; urgent: boolean };
  const todo: TodoItem[] = [
    ...inquiries
      .filter((q) => q.status === "new")
      .map((q) => ({
        id: `i${q.id}`,
        kind: "inquiry" as const,
        title: q.source === "panel" ? `Zamówienie · ${q.name}` : q.name,
        sub: q.topic || "Nowe zapytanie",
        href: `/panel/admin/zapytania?id=${q.id}`,
        action: q.source === "panel" ? "Przyjmij" : "Odpowiedz",
        urgent: false,
      })),
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

  const pct = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);
  const day = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" }).format(ms);
  const prog = (o: { start_date: string; due_date: string }) => Math.max(0.04, Math.min(1, daysBetween(o.start_date, t) / Math.max(1, daysBetween(o.start_date, o.due_date))));
  const paidShare = fin.year.revenue + fin.pending.amount ? fin.year.revenue / (fin.year.revenue + fin.pending.amount) : 0;
  const ICON = { inquiry: ICONS.inbox, payment: ICONS.wallet, deadline: ICONS.calendar } as const;
  const peak = s.reduce((b, d) => (d.visitors > b.visitors ? d : b), s[0] ?? { t: 0, visitors: 0, views: 0 });
  const KIND: Record<string, string> = { payment: ICONS.wallet, inquiry: ICONS.inbox, content: ICONS.doc, client: ICONS.users, mail: ICONS.mail, settings: ICONS.gear };

  return (
    <>
      <PageHead title="Kokpit" text={`${greet()}, ${admin.name.split(" ")[0]} — ${todo.length ? `${todo.length} ${todo.length === 1 ? "sprawa czeka" : todo.length < 5 ? "sprawy czekają" : "spraw czeka"} na Ciebie. ${summary}` : "wszystko ogarnięte."}`} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric i={0} label="Przychód w tym miesiącu" value={Math.round(fin.month.revenue / 100)} suffix=" zł" viz={{ kind: "dots", data: fin.chart.map((m) => m.revenue) }} delta={pct(fin.month.revenue, fin.month.prevRevenue)} foot="vs poprzedni miesiąc" href="/panel/admin/finanse" />
        <Metric i={1} label="Odwiedzający · 30 dni" value={k.cur.visitors} viz={{ kind: "bars", data: s.map((d) => d.visitors) }} delta={pct(k.cur.visitors, k.prev.visitors)} foot="vs poprzednie 30 dni" href="/panel/admin/analityka" />
        <Metric
          i={2}
          label="Zlecenia w realizacji"
          value={Number(orders?.n ?? 0)}
          viz={{ kind: "lollipop", data: next.length ? next.map(prog) : [0.1, 0.1, 0.1] }}
          foot={`${Number(money?.n ?? 0).toLocaleString("pl-PL")} zł w zleceniach`}
          href="/panel/admin/kalendarz"
        />
        <Metric
          i={3}
          label="Do zapłaty"
          value={Math.round(fin.pending.amount / 100)}
          suffix=" zł"
          viz={{ kind: "gauge", value: paidShare, label: `opłacono ${Math.round(paidShare * 100)}% w tym roku` }}
          foot={fin.pending.overdue ? <span className="text-red-300">{fin.pending.overdue} po terminie</span> : `${fin.pending.count} ${fin.pending.count === 1 ? "płatność" : "płatności"} czeka`}
          href="/panel/admin/finanse"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <GlowChart
            title="Ruch na stronie"
            value={
              <>
                <span className="text-ink tabular-nums">{k.cur.visitors.toLocaleString("pl-PL")}</span> odwiedzających · <span className="text-ink tabular-nums">{k.cur.pageviews.toLocaleString("pl-PL")}</span> odsłon · teraz{" "}
                <span className="text-emerald-300 tabular-nums">{nowOnline}</span> na stronie
              </>
            }
            aside={
              <Link href="/panel/admin/analityka" className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 py-2 text-[13px] transition-colors hover:bg-white/[0.09] hover:text-ink">
                Szczyt {peak.visitors} · {day(peak.t)}
              </Link>
            }
            data={s.map((d) => ({ label: day(d.t), v: d.visitors }))}
          />
        </div>
        <div className="lg:col-span-4">
          <Panel
            title={`Do zrobienia${todo.length ? ` · ${todo.length}` : ""}`}
            action={
              <Link href="/panel/admin/zapytania" className="text-[13px] text-muted hover:text-ink">
                Zapytania →
              </Link>
            }
          >
            {todo.length ? (
              <div className="-mr-1 max-h-[318px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]" data-lenis-prevent>
                {todo.map((it) => (
                  <Row key={it.id} href={it.href} icon={ICON[it.kind]} title={it.title} sub={it.sub} badge={it.action} tone={it.urgent ? "red" : it.kind === "inquiry" ? "accent" : "muted"} dot={it.urgent} />
                ))}
              </div>
            ) : (
              <div className="grid flex-1 place-items-center py-10 text-center">
                <p className="text-[15px]">Wszystko ogarnięte</p>
                <p className="mt-1 text-[13px] text-dim">Nowe sprawy pojawią się tutaj.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel
          i={1}
          title="Aktywność"
          action={
            <Link href="/panel/admin/logi" className="text-[13px] text-muted hover:text-ink">
              Logi →
            </Link>
          }
        >
          {activity.length ? (
            <div className="space-y-2">
              {activity.slice(0, 5).map((r) => (
                <Row key={r.id} href="/panel/admin/logi" icon={KIND[r.kind] ?? ICONS.logs} title={r.message} badge={<Ago ts={Number(r.ts)} />} tone={r.level === "success" ? "green" : r.level === "error" ? "red" : "muted"} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-dim">Cisza — zdarzenia pojawią się tutaj.</p>
          )}
        </Panel>
        <Panel
          i={2}
          title="Najbliższe terminy"
          action={
            <Link href="/panel/admin/kalendarz" className="text-[13px] text-muted hover:text-ink">
              Kalendarz →
            </Link>
          }
        >
          {next.length ? (
            <div className="space-y-2">
              {next.slice(0, 5).map((o) => {
                const d = daysBetween(t, o.due_date);
                return <Row key={o.id} href="/panel/admin/kalendarz" icon={ICONS.calendar} title={o.title} sub={`${o.client_name} · ${STATUS[o.status].label}`} badge={when(d)} tone={d < 0 ? "red" : d <= 3 ? "amber" : "muted"} />;
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-dim">Brak zaplanowanych zleceń.</p>
          )}
        </Panel>
        <Panel i={3} title="Skąd przychodzą" className="md:col-span-2 xl:col-span-1">
          <BarList items={src.slice(0, 5).map((p) => ({ name: p.name, n: Number(p.visitors) }))} />
          <p className="mt-auto pt-4 text-[12.5px] text-dim">Najczęściej: {pages[0]?.path ?? "—"}</p>
        </Panel>
      </div>
    </>
  );
}
