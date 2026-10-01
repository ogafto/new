"use client";

import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Intro({ kicker, title, text }: { kicker: string; title: React.ReactNode; text?: React.ReactNode }) {
  return (
    <div className="mb-10">
      <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        {kicker}
      </motion.p>
      <h1 className="h-display mt-6 overflow-hidden pb-[0.1em] text-[clamp(2.4rem,5vw,3.2rem)]">
        <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.05, duration: 1.1, ease }}>
          {title}
        </motion.span>
      </h1>
      {text && (
        <motion.p className="mt-4 text-[15.5px] leading-relaxed text-muted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }}>
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function Stagger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 1, ease }}>
      {children}
    </motion.div>
  );
}
