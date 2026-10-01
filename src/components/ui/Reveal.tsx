"use client";

import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export function FadeUp({ children, delay = 0, className = "", y = 24 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 1.1, ease }}
    >
      {children}
    </motion.div>
  );
}

// Nagłówek: linie wysuwają się spod maski
export function Heading({ lines, className = "" }: { lines: React.ReactNode[]; className?: string }) {
  return (
    <motion.h2 className={`h-display ${className}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
          <motion.span className="block" variants={{ hidden: { y: "108%" }, show: { y: "0%", transition: { delay: i * 0.09, duration: 1.2, ease } } }}>
            {l}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}

// Pozioma linia rysowana przy wejściu w widok
export function DrawLine({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={`block h-px origin-left bg-line ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
    />
  );
}
