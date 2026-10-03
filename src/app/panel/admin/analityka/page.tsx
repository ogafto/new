import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { breakdown, campaigns, exitSections, formFunnel, heatmap, kpis, liveNow, projectStats, RANGES, recentSessions, returning, scrollDepth, sectionReach, series, sources, topClicks, topPages } from "@/lib/analytics";
import { getProjects } from "@/lib/projects";
import { AutoRefresh, Heatmap, Returning } from "@/components/panel/AnalyticsExtras";
import { Card, CardHead, Icon, ICONS, PageHead } from "@/components/panel/kit";
import Sessions from "@/components/panel/Sessions";
import Traffic from "@/components/panel/analytics/Traffic";
import RangeTabs from "@/components/panel/analytics/RangeTabs";
import { FunnelBars, PagesTable, TabCard } from "@/components/panel/analytics/Breakdown";
import { deviceIcon } from "@/components/panel/analytics/icons";

export const metadata: Metadata = { title: "Analityka" };

function ago(ms: number) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min`;
}

const SECTIONS: Record<string, string> = { start: "Start", portfolio: "Portfolio", proces: "Proces", kontakt: "Kontakt" };
const SOURCE_ICON: Record<string, string> = { Bezpośrednio: ICONS.link };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ zakres?: string }> }) {
  await requireAdmin();
  const { zakres } = await searchParams;
  const days = RANGES.find((r) => String(r.days) === zakres)?.days ?? 30;
  const [k, s, pages, src, devices, browsers, os, countries, reach, funnel, depth, clicks, exits, sessions, heat, online, camps, ret, projStats, projects] = await Promise.all([
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
    heatmap(days),
    liveNow(),
    campaigns(days),
    returning(days),
    projectStats(days),
    getProjects(),
  ]);
  const regions = new Intl.DisplayNames(["pl"], { type: "region" });
  const flag = (cc: string | null) => (cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : "🌐");
  const countryName = (cc: string) => {
    try {
      return /^[A-Z]{2}$/.test(cc) ? (regions.of(cc) ?? cc) : cc;
    } catch {
      return cc;
    }
  };
  const projName = new Map(projects.map((p) => [p.slug, p.name]));
  const map = (rows: { name: string; visitors: number }[], icon?: (n: string) => string | undefined) => rows.map((r) => ({ name: r.name, n: Number(r.visitors), icon: icon?.(r.name) }));
  const range = RANGES.find((r) => r.days === days)!.label;

  return (
    <>
      <AutoRefresh every={20000} />
      <PageHead title="Analityka">
        <a href={`/panel/admin/analityka/eksport?zakres=${days}`} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink">
          <Icon d={ICONS.download} className="size-4" /> CSV
        </a>
        <RangeTabs ranges={RANGES} value={days} />
      </PageHead>

      <Card pad={false} glow>
        <Traffic
          cur={k.cur}
          prev={k.prev}
          series={s}
          hourly={days <= 1}
        />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card delay={0.04} className="lg:col-span-2">
          <CardHead title="Podstrony" sub={range} />
          <PagesTable rows={pages.map((p) => ({ path: p.path, views: Number(p.views), visitors: Number(p.visitors), time: Number(p.time), scroll: Number(p.scroll) }))} />
        </Card>
        <Card delay={0.06}>
          <CardHead title="Teraz na stronie" sub="Ostatnie 5 minut">
            <span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[12px] text-emerald-300 tabular-nums">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                <span className="relative size-1.5 rounded-full bg-emerald-400" />
              </span>
              {online.length}
            </span>
          </CardHead>
          {online.length === 0 ? (
            <div className="grid min-h-[200px] place-items-center text-center">
              <div>
                <span className="relative mx-auto grid size-12 place-items-center rounded-full border border-white/[0.08]">
                  <span className="absolute inset-0 animate-ping rounded-full border border-emerald-400/20 [animation-duration:2.6s]" />
                  <span className="size-2 rounded-full bg-emerald-400/60" />
                </span>
                <p className="mt-4 text-[13px] text-dim">Nikogo w tej chwili</p>
              </div>
            </div>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {online.map((o) => (
                <li key={o.visitor} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]">
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-[15px]">
                    {flag(o.country)}
                    <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-[rgb(17_17_23)] bg-emerald-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[12.5px]">{o.path}</span>
                    <span className="flex items-center gap-1.5 truncate text-[12px] text-dim">
                      <Icon d={deviceIcon(o.device ?? "")} className="size-3 shrink-0" />
                      {o.source} · {Number(o.pages)} {Number(o.pages) === 1 ? "strona" : "str."}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11.5px] text-dim tabular-nums">{ago(Number(o.seen))}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TabCard
          id="src"
          title="Źródła"
          delay={0.08}
          tabs={[
            { key: "src", label: "Źródła", rows: map(src, (n) => SOURCE_ICON[n] ?? ICONS.globe), head: ["Źródło", "Osoby"] },
            {
              key: "utm",
              label: "Kampanie",
              rows: camps.map((c) => ({ name: c.campaign, n: Number(c.visitors), extra: `${c.source}${c.medium ? ` / ${c.medium}` : ""}` })),
              head: ["Kampania UTM", "Osoby"],
              empty: "Brak linków z utm_campaign",
            },
          ]}
        />
        <TabCard
          id="tech"
          title="Technologia"
          delay={0.1}
          tabs={[
            { key: "dev", label: "Urządzenia", rows: map(devices, deviceIcon), head: ["Urządzenie", "Osoby"] },
            { key: "br", label: "Przeglądarki", rows: map(browsers), head: ["Przeglądarka", "Osoby"] },
            { key: "os", label: "Systemy", rows: map(os), head: ["System", "Osoby"] },
          ]}
        />
        <TabCard id="geo" title="Kraje" delay={0.12} className="md:col-span-2 xl:col-span-1" tabs={[{ key: "cc", label: "Kraje", rows: countries.map((r) => ({ name: countryName(r.name), n: Number(r.visitors), icon: flag(r.name) })), head: ["Kraj", "Osoby"] }]} />
      </div>

      <div className="mt-4">
        <Card delay={0.14}>
          <CardHead title="Kiedy odwiedzają" sub="Odsłony wg dnia i godziny · czas polski" />
          <Heatmap grid={heat} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card delay={0.16}>
          <CardHead title="Formularz kontaktowy" sub="Lejek konwersji" />
          <FunnelBars steps={funnel} />
        </Card>
        <TabCard
          id="home"
          title="Strona główna"
          delay={0.18}
          tabs={[
            { key: "reach", label: "Zasięg", rows: reach.items.map((i) => ({ name: i.name, n: i.n })), head: ["Sekcja", "Odsłony"] },
            { key: "depth", label: "Przewinięcie", rows: depth, head: ["Głębokość", "Odsłony"] },
            { key: "exit", label: "Wyjścia", rows: exits.map((e) => ({ name: SECTIONS[e.name] ?? e.name, n: Number(e.n) })), head: ["Ostatnia sekcja", "Wizyty"] },
          ]}
        />
        <Card delay={0.2} className="md:col-span-2 xl:col-span-1">
          <CardHead title="Nowi i powracający" sub={range} />
          <Returning fresh={ret.fresh} back={ret.back} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TabCard
          id="clicks"
          title="Kliknięcia"
          delay={0.22}
          tabs={[{ key: "c", label: "Kliknięcia", rows: clicks.map((c) => ({ name: c.label || c.value || "—", n: Number(c.n), extra: c.value && c.value !== c.label ? c.value : undefined })), head: ["Element", "Kliknięcia"] }]}
        />
        <TabCard
          id="proj"
          title="Projekty w portfolio"
          delay={0.24}
          tabs={[
            {
              key: "p",
              label: "Projekty",
              rows: projStats.map((p) => ({ name: projName.get(p.slug) ?? p.slug, n: Number(p.views), extra: `${Number(p.visitors)} os. · ${Number(p.time)} s · ${Number(p.scroll)}%` })),
              head: ["Projekt", "Odsłony"],
              empty: "Brak odsłon projektów w tym okresie",
            },
          ]}
        />
      </div>

      <Card delay={0.26} pad={false} className="mt-4">
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <h2 className="text-[16px] font-medium tracking-[-0.01em]">Ostatnie wizyty</h2>
            <p className="mt-0.5 text-[13px] text-dim">Kliknij wizytę, aby zobaczyć ścieżkę</p>
          </div>
          <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[12px] text-dim tabular-nums">{sessions.length}</span>
        </div>
        <Sessions rows={sessions.map((r) => ({ ...r, start: Number(r.start), end: Number(r.end), pages: Number(r.pages), time: Number(r.time) }))} />
      </Card>
    </>
  );
}
