import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { breakdown, exitSections, formFunnel, kpis, live, RANGES, recentSessions, scrollDepth, sectionReach, series, sources, topClicks, topPages } from "@/lib/analytics";
import { AreaChart, BarList, Card, CardHead, Count, Delta, Funnel, PageHead } from "@/components/panel/kit";
import Sessions from "@/components/panel/Sessions";

export const metadata: Metadata = { title: "Analityka" };

const SECTIONS: Record<string, string> = { start: "Start", portfolio: "Portfolio", proces: "Proces", kontakt: "Kontakt" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ zakres?: string }> }) {
  await requireAdmin();
  const { zakres } = await searchParams;
  const days = RANGES.find((r) => String(r.days) === zakres)?.days ?? 30;
  const [k, s, pages, src, devices, browsers, os, countries, reach, funnel, depth, clicks, exits, sessions, now] = await Promise.all([
    kpis(days),
    series(days),
    topPages(days),
    sources(days),
    breakdown(days, "device"),
    breakdown(days, "browser"),
    breakdown(days, "os"),
    breakdown(days, "country"),
    sectionReach(days),
    formFunnel(days),
    scrollDepth(days),
    topClicks(days),
    exitSections(days),
    recentSessions(days, 30),
    live(),
  ]);

  const strip = [
    { label: "Odwiedzający", v: k.cur.visitors, p: k.prev.visitors },
    { label: "Wizyty", v: k.cur.sessions, p: k.prev.sessions },
    { label: "Odsłony", v: k.cur.pageviews, p: k.prev.pageviews },
    { label: "Śr. czas wizyty", v: k.cur.avgTime, p: k.prev.avgTime, suffix: " s" },
    { label: "Odrzucenia", v: k.cur.bounce, p: k.prev.bounce, suffix: "%", invert: true },
    { label: "Śr. przewinięcie", v: k.cur.scroll, p: k.prev.scroll, suffix: "%" },
  ];
  const map = (rows: { name: string; visitors: number }[]) => rows.map((r) => ({ name: r.name, n: Number(r.visitors) }));

  return (
    <>
      <PageHead kicker="Analityka" title="Co robią odwiedzający">
        <div className="inline-flex rounded-full border border-line p-1">
          {RANGES.map((r) => (
            <Link key={r.days} href={`?zakres=${r.days}`} scroll={false} className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${r.days === days ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"}`}>
              {r.label}
            </Link>
          ))}
        </div>
      </PageHead>

      <Card pad={false}>
        <div className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          {strip.map((x) => (
            <div key={x.label} className="p-5">
              <p className="text-[12.5px] text-dim">{x.label}</p>
              <Count value={x.v} suffix={x.suffix} className="h-display mt-2 block text-[28px] leading-none" />
              <div className="mt-2">
                <Delta cur={x.v} prev={x.p} invert={x.invert} />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-4 text-muted">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 rounded bg-accent-2" />
                Odwiedzający
              </span>
              <span className="flex items-center gap-2">
                <span className="h-px w-4 border-t border-dashed border-white/40" />
                Odsłony
              </span>
            </span>
            <span className="flex items-center gap-2 text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              {now} teraz na stronie
            </span>
          </div>
          <AreaChart data={s.map((d) => ({ t: d.t, a: d.visitors, b: d.views }))} label={["Odwiedzający", "Odsłony"]} unit={days <= 1 ? "hour" : "day"} />
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card delay={0.05} className="lg:col-span-2">
          <CardHead title="Strony" sub="Odsłony · unikalni · średni czas · przewinięcie" />
          {pages.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-dim">Brak danych</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13.5px]">
                <thead className="text-left text-[12px] text-dim">
                  <tr>
                    <th className="pb-3 font-normal">Adres</th>
                    <th className="pb-3 text-right font-normal">Odsłony</th>
                    <th className="pb-3 text-right font-normal">Osoby</th>
                    <th className="pb-3 text-right font-normal">Czas</th>
                    <th className="pb-3 pl-4 font-normal">Przewinięcie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pages.map((p) => (
                    <tr key={p.path}>
                      <td className="max-w-[240px] truncate py-2.5 pr-3">{p.path}</td>
                      <td className="py-2.5 text-right tabular-nums">{Number(p.views).toLocaleString("pl-PL")}</td>
                      <td className="py-2.5 text-right text-muted tabular-nums">{Number(p.visitors).toLocaleString("pl-PL")}</td>
                      <td className="py-2.5 text-right text-muted tabular-nums">{p.time}s</td>
                      <td className="py-2.5 pl-4">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                            <span className="block h-full rounded-full bg-accent" style={{ width: `${p.scroll}%` }} />
                          </span>
                          <span className="text-[12px] text-dim tabular-nums">{p.scroll}%</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card delay={0.1}>
          <CardHead title="Źródła" sub="Skąd przyszli" />
          <BarList items={map(src)} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card delay={0.12}>
          <CardHead title="Dokąd dochodzą" sub={`Strona główna · ${reach.total} odsłon`} />
          <Funnel steps={reach.items.map((i) => ({ name: i.name, n: i.n }))} />
        </Card>
        <Card delay={0.15}>
          <CardHead title="Formularz kontaktowy" sub="Lejek konwersji" />
          <Funnel steps={funnel} />
        </Card>
        <Card delay={0.18}>
          <CardHead title="Gdzie kończą wizytę" sub="Ostatnia oglądana sekcja" />
          <BarList items={exits.map((e) => ({ name: SECTIONS[e.name] ?? e.name, n: Number(e.n) }))} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card delay={0.2}>
          <CardHead title="Urządzenia" />
          <BarList items={map(devices)} />
        </Card>
        <Card delay={0.22}>
          <CardHead title="Przeglądarki" />
          <BarList items={map(browsers)} />
        </Card>
        <Card delay={0.24}>
          <CardHead title="Systemy" />
          <BarList items={map(os)} />
        </Card>
        <Card delay={0.26}>
          <CardHead title="Kraje" />
          <BarList items={map(countries)} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card delay={0.28}>
          <CardHead title="Głębokość przewinięcia" sub="Strona główna" />
          <BarList items={depth} />
        </Card>
        <Card delay={0.3}>
          <CardHead title="W co klikają" sub="Linki i przyciski" />
          <BarList items={clicks.map((c) => ({ name: c.label || c.value || "—", n: Number(c.n), extra: c.value && c.value !== c.label ? c.value : undefined }))} />
        </Card>
      </div>

      <div className="mt-4">
        <Card delay={0.32}>
          <CardHead title="Ostatnie wizyty" sub="Kliknij, żeby zobaczyć całą ścieżkę: strony, sekcje i kliknięcia" />
          <Sessions rows={sessions.map((r) => ({ ...r, start: Number(r.start), end: Number(r.end), pages: Number(r.pages), time: Number(r.time) }))} />
        </Card>
      </div>
    </>
  );
}
