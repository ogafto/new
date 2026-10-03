"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ease } from "./kit";

const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const DAYS_LONG = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

const cell = (v: number) => (v ? `rgb(139 108 255 / ${0.1 + v * 0.9})` : "rgb(255 255 255 / 0.035)");

/* Mapa aktywności: dzień tygodnia × godzina */
export function Heatmap({ grid }: { grid: number[][] }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  const best = grid.flatMap((row, d) => row.map((n, h) => ({ d, h, n }))).sort((a, b) => b.n - a.n)[0];
  const byDay = grid.map((r) => r.reduce((a, b) => a + b, 0));
  const topDay = byDay.indexOf(Math.max(...byDay));
  return (
    <div>
      <div className="mb-4 flex min-h-[40px] flex-wrap items-end justify-between gap-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={hover ? hover.join() : "best"} className="text-[13px] text-muted" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {hover ? (
              <>
                {DAYS_LONG[hover[0]]}, {hover[1]}:00–{hover[1] + 1}:00
                <span className="block text-[20px] text-ink tabular-nums">{grid[hover[0]][hover[1]]} odsłon</span>
              </>
            ) : total ? (
              <>
                Najwięcej ruchu
                <span className="block text-[20px] text-ink">
                  {DAYS_LONG[best.d]}, {best.h}:00
                </span>
              </>
            ) : (
              "Brak danych w tym okresie"
            )}
          </motion.p>
        </AnimatePresence>
        {total > 0 && (
          <p className="text-[12.5px] text-dim">
            Najmocniejszy dzień: <span className="text-muted">{DAYS_LONG[topDay].toLowerCase()}</span>
          </p>
        )}
      </div>
      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]" data-lenis-prevent>
        <div className="grid min-w-[600px] grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px]" onMouseLeave={() => setHover(null)}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className={`text-center text-[10px] tabular-nums transition-colors ${hover?.[1] === h ? "text-ink" : "text-dim"}`}>
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {grid.map((row, d) => (
            <div key={d} className="contents">
              <span className={`self-center text-[11px] transition-colors ${hover?.[0] === d ? "text-ink" : "text-dim"}`}>{DAYS[d]}</span>
              {row.map((n, h) => {
                const v = n / max;
                const on = hover?.[0] === d && hover?.[1] === h;
                return (
                  <motion.span
                    key={h}
                    onMouseEnter={() => setHover([d, h])}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: hover && !on && hover[0] !== d && hover[1] !== h ? 0.55 : 1, scale: on ? 1.18 : 1 }}
                    transition={{ delay: hover ? 0 : (d * 24 + h) * 0.002, duration: 0.3, ease }}
                    className={`h-6 rounded-[5px] sm:h-7 ${on ? "relative z-10 ring-1 ring-white/70" : ""}`}
                    style={{ background: cell(v), boxShadow: v > 0.7 ? "0 0 14px rgb(139 108 255 / 0.45)" : undefined }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-dim">
        mniej
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <span key={v} className="size-3 rounded-[3px]" style={{ background: cell(v) }} />
        ))}
        więcej
      </div>
    </div>
  );
}

/* Nowi vs powracający — pierścień */
export function Returning({ fresh, back }: { fresh: number; back: number }) {
  const total = fresh + back;
  const p = total ? back / total : 0;
  const C = 2 * Math.PI * 40;
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-[132px] shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(139 108 255 / 0.9)" strokeWidth="9" />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#d4c8ff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - p) }}
            transition={{ delay: 0.3, duration: 1.1, ease }}
            style={{ filter: "drop-shadow(0 0 6px rgb(180 162 255 / 0.6))" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="h-display text-[26px] leading-none tabular-nums">{Math.round(p * 100)}%</p>
            <p className="mt-1 text-[11px] text-dim">wraca</p>
          </div>
        </div>
      </div>
      <dl className="min-w-0 flex-1 space-y-3 text-[14px]">
        {[
          ["Nowi", fresh, "bg-accent"],
          ["Powracający", back, "bg-[#d4c8ff]"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
            <dt className="flex items-center gap-2 text-[13px] text-muted">
              <span className={`size-2 rounded-full ${c}`} /> {l}
            </dt>
            <dd className="text-[18px] tabular-nums">{(v as number).toLocaleString("pl-PL")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* Odświeża dane strony co kilkanaście sekund (lista „teraz na stronie”) */
export function AutoRefresh({ every = 15000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => !document.hidden && router.refresh(), every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
