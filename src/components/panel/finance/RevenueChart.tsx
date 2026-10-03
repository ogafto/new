"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Delta, ease } from "../kit";
import { monthName, zl, zlShort, type Summary } from "./shared";

const nice = (v: number) => {
  if (v <= 0) return 100_000;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
};

/* Przychody (słupki) i koszty (linia) — 12 miesięcy, podpowiedź po najechaniu */
export default function RevenueChart({ data }: { data: Summary["chart"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = nice(Math.max(...data.map((d) => Math.max(d.revenue, d.costs))) * 1.08);
  const last = data.length - 1;
  const i = hover ?? last;
  const cur = data[i];
  const prev = data[i - 1];
  const H = 256;
  const y = (v: number) => (v / max) * 100;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const n = data.length;
  const linePts = data.map((d, k) => `${((k + 0.5) / n) * 100},${100 - y(d.costs)}`).join(" ");
  const total = data.reduce((a, d) => a + d.revenue, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] text-dim">
            <span className="capitalize">{monthName(cur.m, "long")}</span> {cur.m.slice(0, 4)}
            {hover === null && <span className="text-dim"> · bieżący miesiąc</span>}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p key={cur.m} className="h-display text-[34px] leading-none tabular-nums sm:text-[40px]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease }}>
                {zl(cur.revenue)}
              </motion.p>
            </AnimatePresence>
            {prev && <Delta cur={cur.revenue} prev={prev.revenue} />}
          </div>
        </div>
        <dl className="flex gap-6 text-[12.5px]">
          <div>
            <dt className="flex items-center gap-1.5 text-dim">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-gradient-to-b from-accent-2 to-accent" /> Przychód
            </dt>
            <dd className="mt-1 text-[14px] tabular-nums">{zl(cur.revenue)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-dim">
              <span className="h-0.5 w-3 rounded-full bg-amber-200/80" /> Koszty
            </dt>
            <dd className="mt-1 text-[14px] tabular-nums">{zl(cur.costs)}</dd>
          </div>
          <div>
            <dt className="text-dim">Zysk</dt>
            <dd className={`mt-1 text-[14px] tabular-nums ${cur.revenue - cur.costs < 0 ? "text-red-300" : "text-emerald-300"}`}>{zl(cur.revenue - cur.costs)}</dd>
          </div>
        </dl>
      </div>

      <div className="relative mt-7 pl-11 sm:pl-12">
        {/* oś Y + siatka */}
        <div className="pointer-events-none absolute inset-y-0 right-0 left-0" style={{ height: H }} aria-hidden>
          {ticks.map((t) => (
            <div key={t} className="absolute right-0 left-0 flex items-center" style={{ bottom: `${t * 100}%` }}>
              <span className="w-11 shrink-0 pr-2 text-right text-[10.5px] text-dim tabular-nums sm:w-12">{t === 0 ? "0" : zlShort(max * t)}</span>
              <span className={`h-px flex-1 ${t === 0 ? "bg-white/[0.1]" : "bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.07)_0_4px,transparent_4px_8px)]"}`} />
            </div>
          ))}
        </div>

        <div className="relative" style={{ height: H }} onPointerLeave={() => setHover(null)}>
          {/* słupki */}
          <div className="absolute inset-0 flex">
            {data.map((d, k) => {
              const on = k === i;
              return (
                <button
                  key={d.m}
                  type="button"
                  className="group relative flex h-full flex-1 items-end justify-center outline-none"
                  onPointerEnter={() => setHover(k)}
                  onFocus={() => setHover(k)}
                  onClick={() => setHover(k)}
                  aria-label={`${monthName(d.m, "long")}: przychód ${zl(d.revenue)}, koszty ${zl(d.costs)}`}
                >
                  <span className={`absolute inset-x-[8%] inset-y-0 rounded-xl transition-colors duration-300 ${hover === k ? "bg-white/[0.035]" : ""}`} />
                  <motion.span
                    className={`relative w-[46%] max-w-[30px] rounded-t-[7px] rounded-b-[2px] transition-[filter,opacity] duration-300 ${hover !== null && !on ? "opacity-45" : ""}`}
                    style={{
                      background: k === last ? "linear-gradient(180deg,#d4c8ff,#8b6cff 55%,rgb(139 108 255/0.45))" : "linear-gradient(180deg,#b4a2ff,rgb(139 108 255/0.75) 50%,rgb(139 108 255/0.25))",
                      boxShadow: on ? "0 0 24px -2px rgb(139 108 255/0.55), inset 0 1px 0 rgb(255 255 255/0.35)" : "inset 0 1px 0 rgb(255 255 255/0.25)",
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(d.revenue ? 1.5 : 0, y(d.revenue))}%` }}
                    transition={{ delay: 0.1 + k * 0.035, duration: 0.8, ease }}
                  />
                </button>
              );
            })}
          </div>
          {/* linia kosztów */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <motion.polyline points={linePts} fill="none" stroke="rgb(253 230 138 / 0.75)" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 1.1, ease }} />
          </svg>
          {data.map((d, k) => (
            <motion.span
              key={d.m}
              className={`pointer-events-none absolute size-[7px] -translate-x-1/2 translate-y-1/2 rounded-full border-[1.5px] border-amber-200 bg-bg transition-transform duration-300 ${k === hover ? "scale-150" : ""}`}
              style={{ left: `${((k + 0.5) / n) * 100}%`, bottom: `${y(d.costs)}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 + k * 0.03 }}
            />
          ))}

          {/* podpowiedź */}
          <AnimatePresence>
            {hover !== null && (
              <motion.div
                className="pointer-events-none absolute z-10 w-[176px] rounded-2xl border border-white/[0.1] bg-[rgb(16_16_22/0.94)] p-3 text-[12px] shadow-[0_18px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl"
                style={hover < n / 2 ? { left: `calc(${((hover + 1) / n) * 100}% + 4px)`, top: 8 } : { right: `calc(${((n - hover) / n) * 100}% + 4px)`, top: 8 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
                transition={{ duration: 0.2, ease }}
              >
                <p className="mb-2 text-dim capitalize">
                  {monthName(data[hover].m, "long")} {data[hover].m.slice(0, 4)}
                </p>
                {[
                  ["Przychód", data[hover].revenue, "bg-accent"],
                  ["Koszty", data[hover].costs, "bg-amber-200"],
                ].map(([l, v, c]) => (
                  <p key={l as string} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="flex items-center gap-1.5 text-muted">
                      <span className={`size-1.5 rounded-full ${c}`} />
                      {l}
                    </span>
                    <span className="tabular-nums">{zl(v as number)}</span>
                  </p>
                ))}
                <p className="mt-1.5 flex justify-between gap-3 border-t border-white/[0.08] pt-1.5">
                  <span className="text-muted">Zysk</span>
                  <span className={`tabular-nums ${data[hover].revenue - data[hover].costs < 0 ? "text-red-300" : "text-emerald-300"}`}>{zl(data[hover].revenue - data[hover].costs)}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* oś X */}
        <div className="mt-2.5 flex">
          {data.map((d, k) => (
            <span key={d.m} className={`flex-1 text-center text-[10.5px] capitalize transition-colors sm:text-[11.5px] ${k === i ? "text-ink" : "text-dim"}`}>
              {monthName(d.m).replace(".", "")}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 text-right text-[12px] text-dim">
        Razem 12 mies.: <span className="text-muted tabular-nums">{zl(total)}</span>
      </p>
    </div>
  );
}
