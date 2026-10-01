import { all, one } from "./db";

/* Zapytania do analityki w panelu. Zakres = ostatnie N dni (i porównanie z poprzednim okresem). */

const DAY = 86_400_000;
export const RANGES = [
  { days: 1, label: "24 h" },
  { days: 7, label: "7 dni" },
  { days: 30, label: "30 dni" },
  { days: 90, label: "90 dni" },
];

type Totals = { visitors: number; sessions: number; pageviews: number; avgTime: number; bounce: number; scroll: number };

async function totals(from: number, to: number): Promise<Totals> {
  const base = await one<{ visitors: number; sessions: number; pageviews: number; scroll: number }>(
    "SELECT COUNT(DISTINCT visitor) visitors, COUNT(DISTINCT session) sessions, COUNT(*) pageviews, COALESCE(AVG(scroll), 0) scroll FROM pageviews WHERE ts >= ? AND ts < ?",
    [from, to],
  );
  const s = await one<{ avg: number; bounce: number }>(
    `SELECT COALESCE(AVG(t), 0) avg, COALESCE(AVG(CASE WHEN c = 1 AND t < 10000 THEN 1.0 ELSE 0 END), 0) bounce
     FROM (SELECT session, COUNT(*) c, SUM(duration) t FROM pageviews WHERE ts >= ? AND ts < ? GROUP BY session)`,
    [from, to],
  );
  return {
    visitors: Number(base?.visitors ?? 0),
    sessions: Number(base?.sessions ?? 0),
    pageviews: Number(base?.pageviews ?? 0),
    scroll: Math.round(Number(base?.scroll ?? 0)),
    avgTime: Math.round(Number(s?.avg ?? 0) / 1000),
    bounce: Math.round(Number(s?.bounce ?? 0) * 100),
  };
}

export async function kpis(days: number) {
  const now = Date.now();
  const [cur, prev] = await Promise.all([totals(now - days * DAY, now), totals(now - 2 * days * DAY, now - days * DAY)]);
  return { cur, prev };
}

// Seria dzienna (lub godzinowa dla 24 h)
export async function series(days: number) {
  const now = Date.now();
  const hourly = days <= 1;
  const step = hourly ? 3_600_000 : DAY;
  const buckets = hourly ? 24 : days;
  const start = hourly ? Math.floor(now / step) * step - (buckets - 1) * step : startOfDay(now) - (buckets - 1) * DAY;
  const rows = await all<{ b: number; visitors: number; views: number }>(
    `SELECT CAST((ts - ?) / ? AS INTEGER) b, COUNT(DISTINCT visitor) visitors, COUNT(*) views FROM pageviews WHERE ts >= ? GROUP BY b`,
    [start, step, start],
  );
  const map = new Map(rows.map((r) => [Number(r.b), r]));
  return Array.from({ length: buckets }, (_, i) => ({ t: start + i * step, visitors: Number(map.get(i)?.visitors ?? 0), views: Number(map.get(i)?.views ?? 0) }));
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const since = (days: number) => Date.now() - days * DAY;

export async function topPages(days: number) {
  return all<{ path: string; views: number; visitors: number; time: number; scroll: number }>(
    `SELECT path, COUNT(*) views, COUNT(DISTINCT visitor) visitors, CAST(AVG(duration) / 1000 AS INTEGER) time, CAST(AVG(scroll) AS INTEGER) scroll
     FROM pageviews WHERE ts >= ? GROUP BY path ORDER BY views DESC LIMIT 12`,
    [since(days)],
  );
}

export async function sources(days: number) {
  return all<{ name: string; visitors: number }>(
    `SELECT COALESCE(utm_source, ref_host, 'Bezpośrednio') name, COUNT(DISTINCT visitor) visitors
     FROM pageviews WHERE ts >= ? GROUP BY name ORDER BY visitors DESC LIMIT 10`,
    [since(days)],
  );
}

export async function breakdown(days: number, col: "device" | "browser" | "os" | "country") {
  return all<{ name: string; visitors: number }>(
    `SELECT COALESCE(${col}, 'Nieznane') name, COUNT(DISTINCT visitor) visitors FROM pageviews WHERE ts >= ? GROUP BY name ORDER BY visitors DESC LIMIT 8`,
    [since(days)],
  );
}

// Ile odsłon strony głównej dotarło do każdej sekcji
export async function sectionReach(days: number) {
  const home = await one<{ n: number }>("SELECT COUNT(*) n FROM pageviews WHERE path = '/' AND ts >= ?", [since(days)]);
  const rows = await all<{ label: string; n: number }>(
    "SELECT label, COUNT(DISTINCT pv) n FROM events WHERE type = 'section' AND path = '/' AND ts >= ? GROUP BY label",
    [since(days)],
  );
  const total = Number(home?.n ?? 0);
  const order = [
    ["start", "Start"],
    ["portfolio", "Portfolio"],
    ["proces", "Proces"],
    ["kontakt", "Kontakt"],
  ];
  const map = new Map(rows.map((r) => [r.label, Number(r.n)]));
  return { total, items: order.map(([k, name]) => ({ key: k, name, n: k === "start" ? total : (map.get(k) ?? 0) })) };
}

// Lejek formularza kontaktowego
export async function formFunnel(days: number) {
  const rows = await all<{ label: string; n: number }>("SELECT label, COUNT(DISTINCT session) n FROM events WHERE type = 'form' AND ts >= ? GROUP BY label", [since(days)]);
  const map = new Map(rows.map((r) => [r.label, Number(r.n)]));
  const reach = await one<{ n: number }>("SELECT COUNT(DISTINCT session) n FROM events WHERE type = 'section' AND label = 'kontakt' AND ts >= ?", [since(days)]);
  return [
    { name: "Zobaczyli formularz", n: Number(reach?.n ?? 0) },
    { name: "Zaczęli wypełniać", n: map.get("start") ?? 0 },
    { name: "Wysłali", n: map.get("submit") ?? 0 },
  ];
}

export async function scrollDepth(days: number) {
  const rows = await all<{ b: number; n: number }>(
    "SELECT MIN(3, scroll / 25) b, COUNT(*) n FROM pageviews WHERE path = '/' AND ts >= ? GROUP BY b",
    [since(days)],
  );
  const map = new Map(rows.map((r) => [Number(r.b), Number(r.n)]));
  return ["0–25%", "25–50%", "50–75%", "75–100%"].map((name, i) => ({ name, n: map.get(i) ?? 0 }));
}

export async function topClicks(days: number) {
  return all<{ label: string; value: string | null; n: number }>(
    "SELECT label, value, COUNT(*) n FROM events WHERE type = 'click' AND ts >= ? GROUP BY label, value ORDER BY n DESC LIMIT 10",
    [since(days)],
  );
}

// Gdzie kończą wizytę (ostatnia sekcja ostatniej odsłony w sesji)
export async function exitSections(days: number) {
  return all<{ name: string; n: number }>(
    `SELECT COALESCE(p.section, p.path) name, COUNT(*) n FROM pageviews p
     JOIN (SELECT session, MAX(ts) mts FROM pageviews WHERE ts >= ? GROUP BY session) l ON l.session = p.session AND l.mts = p.ts
     GROUP BY name ORDER BY n DESC LIMIT 8`,
    [since(days)],
  );
}

export async function live() {
  const r = await one<{ n: number }>("SELECT COUNT(DISTINCT visitor) n FROM pageviews WHERE COALESCE(seen, ts) > ?", [Date.now() - 5 * 60_000]);
  return Number(r?.n ?? 0);
}

export type SessionRow = { session: string; start: number; end: number; pages: number; time: number; source: string; device: string; browser: string; country: string | null; entry: string };

export async function recentSessions(days: number, limit = 25) {
  return all<SessionRow>(
    `SELECT session, MIN(ts) start, MAX(COALESCE(seen, ts)) "end", COUNT(*) pages, CAST(SUM(duration) / 1000 AS INTEGER) time,
            COALESCE(MAX(utm_source), MAX(ref_host), 'Bezpośrednio') source, MAX(device) device, MAX(browser) browser, MAX(country) country,
            (SELECT path FROM pageviews p2 WHERE p2.session = p.session ORDER BY ts LIMIT 1) entry
     FROM pageviews p WHERE ts >= ? GROUP BY session ORDER BY start DESC LIMIT ?`,
    [since(days), limit],
  );
}

// Pełna ścieżka jednej wizyty: odsłony + zdarzenia w kolejności
export async function sessionJourney(session: string) {
  const [pvs, evs] = await Promise.all([
    all<{ id: string; path: string; ts: number; duration: number; scroll: number; section: string | null }>(
      "SELECT id, path, ts, duration, scroll, section FROM pageviews WHERE session = ? ORDER BY ts",
      [session],
    ),
    all<{ type: string; label: string | null; value: string | null; ts: number; path: string }>("SELECT type, label, value, ts, path FROM events WHERE session = ? ORDER BY ts", [session]),
  ]);
  type Step = { kind: "page"; ts: number; path: string; duration: number; scroll: number } | { kind: "event"; ts: number; type: string; label: string | null; value: string | null };
  const steps: Step[] = [
    ...pvs.map((p) => ({ kind: "page" as const, ts: Number(p.ts), path: p.path, duration: Number(p.duration), scroll: Number(p.scroll) })),
    ...evs.map((e) => ({ kind: "event" as const, ts: Number(e.ts), type: e.type, label: e.label, value: e.value })),
  ].sort((a, b) => a.ts - b.ts);
  return steps;
}

export async function homeVisits() {
  const now = Date.now();
  const [today, month] = await Promise.all([
    one<{ n: number }>("SELECT COUNT(DISTINCT visitor) n FROM pageviews WHERE path = '/' AND ts >= ?", [startOfDay(now)]),
    one<{ n: number }>("SELECT COUNT(DISTINCT visitor) n FROM pageviews WHERE path = '/' AND ts >= ?", [now - 30 * DAY]),
  ]);
  return { today: Number(today?.n ?? 0), month: Number(month?.n ?? 0) };
}
