"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Count, Delta, ease } from "../kit";

/* Pasek KPI + główny wykres ruchu (przełączany: odwiedzający / odsłony) */

type Totals = { visitors: number; sessions: number; pageviews: number; avgTime: number; bounce: number; scroll: number };
type Point = { t: number; visitors: number; views: number };
type Metric = "visitors" | "views";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// gładka krzywa (monotoniczna) przez punkty
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  const n = pts.length;
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const m = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / (dx[i] || 1));
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2));
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

// górna granica osi = 4 równe, „okrągłe” kroki
const niceMax = (v: number) => {
  const raw = Math.max(1, v / 4);
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * p >= raw && Number.isInteger(k * p)) return k * p * 4;
  return 10 * p * 4;
};

export default function Traffic({ cur, prev, series, hourly }: { cur: Totals; prev: Totals; series: Point[]; hourly: boolean }) {
  const [metric, setMetric] = useState<Metric>("visitors");
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId();
  const tiles: { key: string; label: string; v: number; p: number; fmt?: (n: number) => string; suffix?: string; invert?: boolean; metric?: Metric }[] = [
    { key: "visitors", label: "Odwiedzający", v: cur.visitors, p: prev.visitors, metric: "visitors" },
    { key: "views", label: "Odsłony", v: cur.pageviews, p: prev.pageviews, metric: "views" },
    { key: "sessions", label: "Wizyty", v: cur.sessions, p: prev.sessions },
    { key: "time", label: "Śr. czas wizyty", v: cur.avgTime, p: prev.avgTime, fmt: mmss },
    { key: "bounce", label: "Odrzucenia", v: cur.bounce, p: prev.bounce, suffix: "%", invert: true },
    { key: "scroll", label: "Śr. przewinięcie", v: cur.scroll, p: prev.scroll, suffix: "%" },
  ];

  const W = 1000;
  const H = 280;
  const vals = series.map((d) => d[metric]);
  const max = niceMax(Math.max(...vals, 1) * 1.1);
  const x = (i: number) => (i / Math.max(1, series.length - 1)) * W;
  const y = (v: number) => H - (v / max) * H;
  const line = smooth(vals.map((v, i) => [x(i), y(v)]));
  const fmtX = (t: number, long = false) =>
    new Intl.DateTimeFormat("pl-PL", hourly ? { hour: "2-digit", minute: "2-digit" } : long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" }).format(t);
  const tickEvery = Math.max(1, Math.ceil(series.length / 7));
  const h = hover !== null ? series[hover] : null;
  const total = vals.reduce((a, b) => a + b, 0);
  const peak = vals.indexOf(Math.max(...vals));

  return (
    <div>
      <div className="overflow-hidden border-b border-white/[0.06]">
      <div className="-mr-px -mb-px grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t, i) => {
          const on = t.metric === metric;
          const Cmp = t.metric ? "button" : "div";
          return (
            <Cmp
              key={t.key}
              {...(t.metric ? { type: "button" as const, onClick: () => setMetric(t.metric!), "aria-pressed": on } : {})}
              className={`relative border-r border-b border-white/[0.06] px-5 py-4 text-left transition-colors sm:py-5 ${t.metric ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
            >
              {on && <motion.span layoutId="traffic-metric" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_14px_rgb(139_108_255/0.8)]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
              <p className={`flex items-center gap-1.5 text-[12.5px] ${on ? "text-ink" : "text-dim"}`}>
                {t.metric && <span className={`size-1.5 rounded-full ${on ? "bg-accent-2" : "bg-white/20"}`} />}
                {t.label}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                {t.fmt ? <span className="h-display text-[26px] leading-none tabular-nums sm:text-[28px]">{t.fmt(t.v)}</span> : <Count value={t.v} suffix={t.suffix} className="h-display text-[26px] leading-none sm:text-[28px]" />}
                <Delta cur={t.v} prev={t.p} invert={t.invert} />
              </div>
            </Cmp>
          );
        })}
      </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
          <span className="flex items-center gap-2 text-muted">
            <span className="h-[3px] w-4 rounded-full bg-gradient-to-r from-accent to-accent-2" />
            {metric === "visitors" ? "Odwiedzający" : "Odsłony"}
            <span className="text-dim">· razem {total.toLocaleString("pl-PL")}</span>
          </span>
          <span className="flex items-center gap-3 text-dim">
            <span>
              Szczyt: <span className="text-muted">{total ? `${fmtX(series[peak].t)} · ${vals[peak].toLocaleString("pl-PL")}` : "—"}</span>
            </span>
          </span>
        </div>

        <div className="relative pl-9">
          {/* siatka */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] sm:h-[280px]" aria-hidden>
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <div key={g} className="absolute inset-x-0 flex items-center" style={{ bottom: `${g * 100}%`, transform: "translateY(50%)" }}>
                <span className="w-9 shrink-0 pr-2 text-right text-[10.5px] text-dim tabular-nums">{Math.round(max * g).toLocaleString("pl-PL")}</span>
                <span className={`h-px flex-1 ${g === 0 ? "bg-white/[0.1]" : "bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.06)_0_4px,transparent_4px_8px)]"}`} />
              </div>
            ))}
          </div>

          <div
            className="relative h-[220px] touch-pan-y sm:h-[280px]"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(Math.max(0, Math.min(series.length - 1, Math.round(((e.clientX - r.left) / r.width) * (series.length - 1)))));
            }}
            onPointerLeave={() => setHover(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b6cff" stopOpacity="0.38" />
                  <stop offset="70%" stopColor="#8b6cff" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#8b6cff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${gid}-l`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b6cff" />
                  <stop offset="100%" stopColor="#d4c8ff" />
                </linearGradient>
              </defs>
              <motion.path key={`a-${metric}`} d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${gid}-a)`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }} />
              <motion.path key={`l-${metric}`} d={line} fill="none" stroke={`url(#${gid}-l)`} strokeWidth="2.25" strokeLinecap="round" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease }} />
            </svg>
            {h && hover !== null && (
              <>
                <span className="pointer-events-none absolute inset-y-0 w-px bg-gradient-to-b from-white/0 via-white/25 to-white/0" style={{ left: `${(hover / Math.max(1, series.length - 1)) * 100}%` }} />
                <span
                  className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent-2 shadow-[0_0_0_4px_rgb(139_108_255/0.25),0_0_18px_rgb(139_108_255/0.9)]"
                  style={{ left: `${(hover / Math.max(1, series.length - 1)) * 100}%`, top: `${(y(h[metric]) / H) * 100}%` }}
                />
              </>
            )}
            <AnimatePresence>
              {h && hover !== null && (
                <motion.div
                  className="pointer-events-none absolute top-2 z-10 w-[188px] rounded-2xl border border-white/[0.1] bg-[rgb(16_16_22/0.94)] p-3 text-[12px] shadow-[0_18px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl"
                  style={hover < series.length / 2 ? { left: `calc(${(hover / Math.max(1, series.length - 1)) * 100}% + 14px)` } : { right: `calc(${100 - (hover / Math.max(1, series.length - 1)) * 100}% + 14px)` }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="mb-2 text-dim first-letter:uppercase">{fmtX(h.t, true)}</p>
                  <p className="flex items-center justify-between gap-3 py-0.5">
                    <span className="flex items-center gap-1.5 text-muted">
                      <span className="size-1.5 rounded-full bg-accent-2" /> Odwiedzający
                    </span>
                    <span className="tabular-nums">{h.visitors.toLocaleString("pl-PL")}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3 py-0.5">
                    <span className="flex items-center gap-1.5 text-muted">
                      <span className="size-1.5 rounded-full bg-white/40" /> Odsłony
                    </span>
                    <span className="tabular-nums">{h.views.toLocaleString("pl-PL")}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative mt-2.5 h-4">
            {series.map((d, i) =>
              i % tickEvery === 0 || i === series.length - 1 ? (
                <span
                  key={d.t}
                  className={`absolute -translate-x-1/2 text-[10.5px] whitespace-nowrap text-dim tabular-nums sm:text-[11px] ${i === series.length - 1 && i % tickEvery !== 0 ? "max-sm:hidden" : ""}`}
                  style={{ left: `${(i / Math.max(1, series.length - 1)) * 100}%`, ...(i === 0 ? { transform: "none" } : i === series.length - 1 ? { transform: "translateX(-100%)" } : {}) }}
                >
                  {fmtX(d.t)}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
