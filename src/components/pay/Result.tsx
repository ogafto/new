"use client";

import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

// Animowany znak wyniku płatności: ✓ (opłacone) albo zegar (w toku)
export function ResultMark({ ok }: { ok: boolean }) {
  const c = ok ? ["#34d399", "#6ee7b7", "rgb(52 211 153 / 0.25)"] : ["#8b6cff", "#b4a2ff", "rgb(139 108 255 / 0.3)"];
  return (
    <div className="relative mx-auto grid size-28 place-items-center">
      <motion.span className="absolute inset-0 rounded-full blur-2xl" style={{ background: c[2] }} initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1.1] }} transition={{ duration: 1.1, ease }} />
      {[0, 1].map((i) => (
        <motion.span key={i} className="absolute inset-2 rounded-full border" style={{ borderColor: c[0] }} initial={{ scale: 0.8, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ delay: 0.6 + i * 0.5, duration: 1.8, repeat: Infinity, repeatDelay: 1.2 }} />
      ))}
      <svg viewBox="0 0 64 64" className="relative size-24" fill="none" aria-hidden>
        <motion.circle cx="32" cy="32" r="30" stroke={c[0]} strokeWidth="1.5" initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} style={{ originX: "50%", originY: "50%" }} />
        {ok ? (
          <motion.path d="M20 33l8 8 16-17" stroke={c[1]} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.55, duration: 0.5, ease }} />
        ) : (
          <motion.path d="M32 18v15l9 6" stroke={c[1]} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.55, duration: 0.5, ease }} />
        )}
      </svg>
    </div>
  );
}

export function Rise({ children, i = 0, className = "" }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.8, ease }}>
      {children}
    </motion.div>
  );
}
