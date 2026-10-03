"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Count, ease, Icon, ICONS } from "./kit";

/*
 * Klocki kokpitu: kafle z małymi wykresami (kropki, lizaki, słupki z kwadracików, łuk),
 * duży wykres z poświatą i wiersze-listy ze strzałką. Jeden kolor akcentu, wypełnione karty bez ramek-ozdobników.
 */

export type Viz = { kind: "dots"; data: number[] } | { kind: "lollipop"; data: number[] } | { kind: "bars"; data: number[] } | { kind: "gauge"; value: number; label?: string };

// gładka krzywa przez punkty — monotoniczna (bez „przestrzeleń” ponad dane i sztucznych ząbków)
function smooth(pts: [number, number][]) {
  const n = pts.length;
  if (!n) return "";
  if (n < 3) return pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const m = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / (dx[i] || 1));
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])));
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

const W = 260;
const H = 84;

function Dots({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [8 + (i / Math.max(1, data.length - 1)) * (W - 16), H - 10 - (v / max) * (H - 26)] as [number, number]);
  const hi = data.lastIndexOf(Math.max(...data));
  const last = pts.length - 1;
  const mark = data[last] > 0 ? last : hi;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" aria-hidden>
      <motion.path d={smooth(pts)} fill="none" stroke="#b4a2ff" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0 6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />
      {pts[mark] && (
        <>
          <circle cx={pts[mark][0]} cy={pts[mark][1]} r="9" fill="#8b6cff" opacity="0.25" />
          <circle cx={pts[mark][0]} cy={pts[mark][1]} r="4" fill="#c9bcff" />
        </>
      )}
    </svg>
  );
}

function Lollipop({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const n = Math.max(1, data.length);
  const hi = data.indexOf(Math.max(...data));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" aria-hidden>
      {data.map((v, i) => {
        const x = 12 + (i / Math.max(1, n - 1)) * (W - 24);
        const y = H - 6 - (v / max) * (H - 20);
        const on = i === hi;
        return (
          <motion.g key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03, duration: 0.5, ease }}>
            <line x1={x} x2={x} y1={H - 4} y2={y} stroke={on ? "#efedf5" : "rgba(255,255,255,0.22)"} strokeWidth="1.4" strokeDasharray="2 3" />
            <circle cx={x} cy={y} r={on ? 4 : 2.6} fill={on ? "#efedf5" : "rgba(255,255,255,0.35)"} />
          </motion.g>
        );
      })}
    </svg>
  );
}

function Bars({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const rows = 11;
  const n = data.length;
  const bw = (W - 8) / n;
  const cell = Math.min(bw - 2.5, 5.5);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      {data.map((v, i) => {
        const on = Math.round((v / max) * rows);
        return Array.from({ length: rows }, (_, r) => (
          <rect key={`${i}-${r}`} x={4 + i * bw + (bw - cell) / 2} y={H - 4 - (r + 1) * (cell + 1.6)} width={cell} height={cell} rx="1" fill={r < on ? (i >= n - 7 ? "#b4a2ff" : "rgba(180,162,255,0.55)") : "rgba(255,255,255,0.05)"} />
        ));
      })}
    </svg>
  );
}

function Gauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  const r = 60;
  const cx = W / 2;
  const cy = H - 22;
  const at = (t: number) => [cx - r * Math.cos(Math.PI * t), cy - r * Math.sin(Math.PI * t)] as const;
  const [ex, ey] = at(v);
  const len = Math.PI * r;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" aria-hidden>
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" strokeDasharray="2 4" />
      <motion.path
        d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke="#b4a2ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={len}
        initial={{ strokeDashoffset: len }}
        animate={{ strokeDashoffset: len * (1 - v) }}
        transition={{ duration: 1.2, ease }}
      />
      <circle cx={at(0)[0]} cy={at(0)[1]} r="3" fill="#efedf5" />
      <circle cx={ex} cy={ey} r="9" fill="#8b6cff" opacity="0.3" />
      <circle cx={ex} cy={ey} r="4.5" fill="#efedf5" />
    </svg>
  );
}

function VizBox({ viz }: { viz: Viz }) {
  return (
    <div className="relative h-[64px] sm:h-[84px]">
      {viz.kind === "dots" && <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1.2px)] [mask-image:linear-gradient(to_bottom,transparent,black_40%)] bg-[size:7px_7px]" />}
      <div className="relative h-full">
        {viz.kind === "dots" && <Dots data={viz.data} />}
        {viz.kind === "lollipop" && <Lollipop data={viz.data} />}
        {viz.kind === "bars" && <Bars data={viz.data} />}
        {viz.kind === "gauge" && <Gauge value={viz.value} />}
        {viz.kind === "gauge" && viz.label && <span className="absolute inset-x-0 bottom-0 text-center text-[12px] text-muted">{viz.label}</span>}
      </div>
    </div>
  );
}

// Kafel z liczbą: etykieta, wartość, mały wykres albo ikona, dopisek ze zmianą
export function Metric({ label, value, suffix, decimals, viz, icon, delta, foot, href, tone, i = 0 }: { label: string; value: number; suffix?: string; decimals?: number; viz?: Viz; icon?: string; delta?: number | null; foot?: React.ReactNode; href?: string; tone?: string; i?: number }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] leading-snug text-muted sm:text-[14.5px]">{label}</p>
        {icon ? (
          <span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-accent-2 sm:grid">
            <Icon d={icon} className="size-[17px]" />
          </span>
        ) : (
          href && <Icon d={ICONS.arrowUp} className="size-4 rotate-45 text-dim transition-colors group-hover:text-ink" />
        )}
      </div>
      <Count value={value} suffix={suffix} decimals={decimals} className={`mt-1.5 block text-[24px] leading-tight font-medium sm:text-[30px] tracking-[-0.03em] whitespace-nowrap ${tone ?? ""}`} />
      {viz && (
        <div className="mt-3">
          <VizBox viz={viz} />
        </div>
      )}
      <p className={`text-[12.5px] text-dim ${viz ? "mt-3" : "mt-2"}`}>
        {delta !== undefined && delta !== null && <span className={`mr-1 font-medium ${delta >= 0 ? "text-ink" : "text-red-300"}`}>{`${delta >= 0 ? "+" : ""}${delta.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`}</span>}
        {foot}
      </p>
    </>
  );
  const cls = "group relative block h-full overflow-hidden rounded-[22px] bg-surface p-4 ring-1 sm:p-5 ring-white/[0.04] transition-colors duration-300 ring-inset";
  return (
    <motion.div className="h-full min-w-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 + i * 0.05, duration: 0.45, ease }}>
      {href ? (
        <Link href={href} className={`${cls} hover:bg-surface-2`}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </motion.div>
  );
}

// Duży wykres: kropkowane pionowe linie, linia z wyróżnionym szczytem i świecącą kolumną, poświata w rogu
export function GlowChart({ title, value, aside, data }: { title: string; value?: React.ReactNode; aside?: React.ReactNode; data: { label: string; v: number }[] }) {
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const Wc = 800;
  const Hc = 230;
  const max = Math.max(4, ...data.map((d) => d.v));
  const x = (i: number) => 20 + (i / Math.max(1, data.length - 1)) * (Wc - 40);
  const y = (v: number) => Hc - 14 - (v / max) * (Hc - 40);
  const pts = data.map((d, i) => [x(i), y(d.v)] as [number, number]);
  // dzisiejszy dzień jeszcze trwa — linia ciągła do wczoraj, ostatni odcinek przerywany
  const solid = pts.length > 2 ? pts.slice(0, -1) : pts;
  const peak = data.reduce((b, d, i) => (d.v > data[b].v ? i : b), 0);
  const focus = hover ?? peak;
  const ticks = data.length ? Array.from({ length: 7 }, (_, k) => Math.round((k / 6) * (data.length - 1))) : [];
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease }} className="relative h-full min-w-0 overflow-hidden rounded-[22px] bg-surface p-5 ring-1 ring-white/[0.04] ring-inset sm:p-6">
      <div className="pointer-events-none absolute -top-40 -left-32 size-[460px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.28),transparent)]" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-medium tracking-[-0.02em] sm:text-[26px]">{title}</h2>
          {value && <div className="mt-1 text-[14px] text-muted">{value}</div>}
        </div>
        {aside && <div className="text-[14px] text-muted">{aside}</div>}
      </div>
      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${Wc} ${Hc}`}
          className="h-[230px] w-full overflow-visible"
          preserveAspectRatio="none"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)))));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${gid}c`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8b6cff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#8b6cff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gid}a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8b6cff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#8b6cff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={Wc} y1={y(max * g)} y2={y(max * g)} stroke="rgba(255,255,255,0.05)" vectorEffect="non-scaling-stroke" />
          ))}
          {ticks.map((i) => (
            <line key={i} x1={x(i)} x2={x(i)} y1="6" y2={Hc} stroke="rgba(255,255,255,0.1)" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
          ))}
          {pts[focus] && <rect x={pts[focus][0] - 9} y={pts[focus][1]} width="18" height={Hc - pts[focus][1]} fill={`url(#${gid}c)`} rx="4" />}
          {pts.length > 1 && <motion.path d={`${smooth(solid)} L${solid[solid.length - 1][0]},${Hc} L${solid[0][0]},${Hc} Z`} fill={`url(#${gid}a)`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.9 }} />}
          <motion.path d={smooth(solid)} fill="none" stroke="#c9bcff" strokeWidth="2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease }} />
          {pts.length > 1 && <motion.path d={`M${pts[pts.length - 2][0]},${pts[pts.length - 2][1]} L${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`} fill="none" stroke="#c9bcff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} />}
        </svg>
        {pts[focus] && (
          <div className="pointer-events-none absolute" style={{ left: `${(pts[focus][0] / Wc) * 100}%`, top: `${(pts[focus][1] / Hc) * 100}%` }}>
            <span className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/40" />
            <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d6ccff] shadow-[0_0_12px_#8b6cff]" />
            <span className="absolute -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg bg-bg/90 px-2.5 py-1 text-[12px] whitespace-nowrap ring-1 ring-line-2">
              <span className="text-ink tabular-nums">{data[focus].v}</span> <span className="text-dim">· {data[focus].label}</span>
            </span>
          </div>
        )}
        <div className="mt-2 flex h-5 justify-between text-[13px] text-dim">
          {ticks.map((i, k) => (
            <span key={i} className="relative w-0 whitespace-nowrap">
              <span className={`absolute top-0 ${k === 0 ? "left-0" : k === ticks.length - 1 ? "right-0" : "left-0 -translate-x-1/2"}`}>{data[i]?.label ?? ""}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// Karta z nagłówkiem i „…”
export function Panel({ title, action, children, i = 0, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease }} className={`flex h-full min-w-0 flex-col rounded-[22px] bg-surface p-5 ring-1 ring-white/[0.04] ring-inset ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[16.5px] font-medium tracking-[-0.01em]">{title}</h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

const TONE = { accent: "text-accent-2", red: "text-red-300", amber: "text-amber-200", green: "text-emerald-300", muted: "text-muted" } as const;

// Wiersz listy: ikona, dwie linie, plakietka, strzałka
export function Row({ href, icon, title, sub, badge, tone = "muted", dot }: { href: string; icon: string; title: React.ReactNode; sub?: React.ReactNode; badge?: React.ReactNode; tone?: keyof typeof TONE; dot?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]">
      <span className={`relative grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] ${TONE[tone]}`}>
        {dot && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-400 ring-2 ring-surface" />}
        <Icon d={icon} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] leading-snug">{title}</span>
        {sub && <span className="block truncate text-[12.5px] text-dim">{sub}</span>}
      </span>
      {badge && <span className={`shrink-0 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11.5px] ${TONE[tone]}`}>{badge}</span>}
      <Icon d="M9 6l6 6-6 6" className="size-4 shrink-0 text-dim transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}

// „5 min temu” liczone po stronie przeglądarki
export function Ago({ ts }: { ts: number }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 30000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);
  if (!now) return null;
  const m = Math.round((now - ts) / 60000);
  return <>{m < 1 ? "teraz" : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`}</>;
}
