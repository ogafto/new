"use client";

import { motion } from "motion/react";
import { steps } from "@/lib/site";
import { Count } from "./kit";

const ease = [0.16, 1, 0.3, 1] as const;

const Check = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden>
    <path d="M2 5.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Node({ i, done, now }: { i: number; done: boolean; now: boolean }) {
  return (
    <span
      className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full border text-[13px] tabular-nums transition-colors ${
        done ? "border-accent bg-accent text-white shadow-[0_0_20px_-4px_rgb(139_108_255/0.9)]" : now ? "border-accent bg-[rgb(20_18_32)] text-accent-2 shadow-[0_0_0_5px_rgb(139_108_255/0.12)]" : "border-white/[0.12] bg-[rgb(16_16_22)] text-dim"
      }`}
    >
      {now && <span className="absolute inset-0 animate-ping rounded-full border border-accent/60 [animation-duration:2.2s]" />}
      {done ? <Check /> : i + 1}
    </span>
  );
}

// Oś etapów: zrobione / bieżący (pulsuje) / kolejne — poziomo od md, pionowo na telefonie
export default function ProjectProgress({ stage }: { stage: number }) {
  const total = steps.length;
  const fill = Math.min(1, stage / (total - 1));
  return (
    <>
      {/* poziomo */}
      <div className="relative hidden md:block">
        <div className="absolute top-[18px] right-[12.5%] left-[12.5%] h-px bg-white/[0.08]">
          <motion.span className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_10px_rgb(139_108_255/0.8)]" initial={{ width: 0 }} animate={{ width: `${fill * 100}%` }} transition={{ delay: 0.4, duration: 1.2, ease }} />
        </div>
        <ol className="relative grid grid-cols-4 gap-3">
          {steps.map((s, i) => {
            const done = i < stage;
            const now = i === stage;
            return (
              <motion.li key={s.title} className="flex flex-col items-center text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08, duration: 0.45, ease }}>
                <Node i={i} done={done} now={now} />
                <div className={`mt-4 w-full rounded-2xl border p-4 transition-colors ${now ? "border-accent/30 bg-[linear-gradient(180deg,rgb(139_108_255/0.12),rgb(139_108_255/0.02))]" : "border-transparent"}`}>
                  <p className={`text-[15px] ${done || now ? "text-ink" : "text-muted"}`}>{s.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{s.lead}</p>
                  <p className={`mt-3 text-[11.5px] ${done ? "text-emerald-300/80" : now ? "text-accent-2" : "text-dim/70"}`}>{done ? "Zrobione" : now ? "W toku" : "Wkrótce"}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {/* pionowo */}
      <ol className="md:hidden">
        {steps.map((s, i) => {
          const done = i < stage;
          const now = i === stage;
          return (
            <motion.li key={s.title} className="relative flex gap-4 pb-6 last:pb-0" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08, duration: 0.45, ease }}>
              {i < total - 1 && (
                <span className="absolute top-9 bottom-0 left-[17.5px] w-px bg-white/[0.08]">
                  <motion.span className="absolute inset-0 origin-top bg-accent" initial={{ scaleY: 0 }} animate={{ scaleY: done ? 1 : 0 }} transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease }} />
                </span>
              )}
              <Node i={i} done={done} now={now} />
              <div className="min-w-0 pt-1.5">
                <p className={`text-[15px] ${done || now ? "text-ink" : "text-muted"}`}>
                  {s.title}
                  {now && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] text-accent-2">w toku</span>}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{s.lead}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </>
  );
}

/* Pierścień postępu projektu */
export function ProgressRing({ stage }: { stage: number }) {
  const total = steps.length;
  const pct = stage >= total ? 100 : Math.round(((stage + 0.5) / total) * 100);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-[148px] shrink-0 place-items-center sm:size-[168px]">
      <span className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgb(180_162_255/0.28),rgb(40_30_90/0.45)_45%,rgb(10_10_16/0.85)_75%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_20px_60px_-10px_rgb(139_108_255/0.5)]" />
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="pr-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b4a2ff" />
            <stop offset="100%" stopColor="#8b6cff" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="5" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke="url(#pr-g)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ delay: 0.3, duration: 1.4, ease }} />
      </svg>
      <span className="relative flex flex-col items-center">
        <span className="flex items-baseline">
          <Count value={pct} className="h-display text-[40px] leading-none sm:text-[46px]" />
          <span className="ml-0.5 text-[16px] text-muted">%</span>
        </span>
        <span className="mt-1 text-[11.5px] text-muted">{stage >= total ? "gotowe" : `etap ${stage + 1} z ${total}`}</span>
      </span>
    </div>
  );
}
