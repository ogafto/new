"use client";

import { motion } from "motion/react";
import { steps } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

// Oś etapów: zrobione / bieżący (pulsuje) / kolejne
export default function ProjectProgress({ stage }: { stage: number }) {
  return (
    <ol className="mt-8 space-y-0">
      {steps.map((s, i) => {
        const done = i < stage;
        const now = i === stage;
        return (
          <motion.li
            key={s.title}
            className="relative flex gap-5 pb-7 last:pb-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.9, ease }}
          >
            {i < steps.length - 1 && (
              <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line">
                <motion.span className="absolute inset-0 origin-top bg-accent" initial={{ scaleY: 0 }} animate={{ scaleY: done ? 1 : 0 }} transition={{ delay: 0.6 + i * 0.2, duration: 0.8, ease }} />
              </span>
            )}
            <span
              className={`relative grid size-8 shrink-0 place-items-center rounded-full border text-[13px] ${
                done ? "border-accent bg-accent text-white" : now ? "border-accent text-accent-2" : "border-line-2 text-dim"
              }`}
            >
              {now && <span className="absolute inset-0 animate-ping rounded-full border border-accent/60 [animation-duration:2s]" />}
              {done ? (
                <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden>
                  <path d="M2 5.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <div className="pt-1">
              <p className={`text-[16px] ${done || now ? "text-ink" : "text-muted"}`}>
                {s.title}
                {now && <span className="ml-2 text-[12px] text-accent-2">w toku</span>}
              </p>
              <p className="mt-1 max-w-md text-[14px] leading-relaxed text-dim">{s.lead}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
