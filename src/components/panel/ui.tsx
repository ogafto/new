"use client";

import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export function PageHead({ kicker, title, children }: { kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div>
        <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {kicker}
        </motion.p>
        <h1 className="h-display mt-5 overflow-hidden pb-[0.1em] text-[clamp(2.2rem,4.5vw,3.6rem)]">
          <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1.1, ease }}>
            {title}
          </motion.span>
        </h1>
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      className={`edge rounded-[22px] bg-surface p-5 sm:p-7 ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay, duration: 1, ease }}
    >
      {children}
    </motion.section>
  );
}
