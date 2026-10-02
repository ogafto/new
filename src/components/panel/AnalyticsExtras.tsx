"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ease } from "./kit";

const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

/* Mapa aktywności: dzień tygodnia × godzina */
export function Heatmap({ grid }: { grid: number[][] }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  const best = grid.flatMap((row, d) => row.map((n, h) => ({ d, h, n }))).sort((a, b) => b.n - a.n)[0];
  return (
    <div>
      <p className="mb-4 text-[13px] text-muted">
        {hover ? (
          <>
            {DAYS[hover[0]]}, {hover[1]}:00–{hover[1] + 1}:00 · <span className="text-ink tabular-nums">{grid[hover[0]][hover[1]]}</span> odsłon
          </>
        ) : total ? (
          <>
            Najwięcej ruchu: <span className="text-ink">{DAYS[best.d]}, {best.h}:00</span>
          </>
        ) : (
          "Brak danych w tym okresie"
        )}
      </p>
      <div className="-mx-1 overflow-x-auto px-1 pb-1" data-lenis-prevent>
        <div className="grid min-w-[560px] grid-cols-[34px_repeat(24,1fr)] gap-[3px]" onMouseLeave={() => setHover(null)}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[9.5px] text-dim tabular-nums">
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {grid.map((row, d) => (
            <div key={d} className="contents">
              <span className="self-center text-[11px] text-dim">{DAYS[d]}</span>
              {row.map((n, h) => {
                const v = n / max;
                return (
                  <motion.span
                    key={h}
                    onMouseEnter={() => setHover([d, h])}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (d * 24 + h) * 0.0025, duration: 0.4, ease }}
                    className={`aspect-square rounded-[4px] ${hover?.[0] === d && hover?.[1] === h ? "ring-1 ring-white/60" : ""}`}
                    style={{ background: n ? `rgb(139 108 255 / ${0.12 + v * 0.88})` : "rgb(255 255 255 / 0.035)", boxShadow: v > 0.75 ? "0 0 12px rgb(139 108 255 / 0.45)" : undefined }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Nowi vs powracający — pierścień */
export function Returning({ fresh, back }: { fresh: number; back: number }) {
  const total = fresh + back;
  const p = total ? back / total : 0;
  const C = 2 * Math.PI * 42;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="size-32 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="10" />
        <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#8b6cff" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: total ? C * p : C }} transition={{ duration: 1.2, ease }} />
        <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#b4a2ff" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} strokeDashoffset={-C * (1 - p)} initial={{ opacity: 0 }} animate={{ opacity: p ? 1 : 0 }} transition={{ delay: 0.6, duration: 0.6 }} />
      </svg>
      <dl className="space-y-3 text-[14px]">
        <div>
          <dt className="flex items-center gap-2 text-[12.5px] text-dim">
            <span className="size-2 rounded-full bg-accent" /> Nowi
          </dt>
          <dd className="mt-0.5 text-[22px] tabular-nums">{fresh}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-[12.5px] text-dim">
            <span className="size-2 rounded-full bg-accent-2" /> Powracający
          </dt>
          <dd className="mt-0.5 text-[22px] tabular-nums">
            {back} <span className="text-[13px] text-dim">{Math.round(p * 100)}%</span>
          </dd>
        </div>
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
