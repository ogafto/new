"use client";

import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export function FadeUp({ children, delay = 0, className = "", y = 24 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 1.1, ease }}
    >
      {children}
    </motion.div>
  );
}

// Nagłówek: linie wysuwają się spod maski
export function Heading({ lines, className = "", as = "h2" }: { lines: React.ReactNode[]; className?: string; as?: "h1" | "h2" }) {
  const Tag = as === "h1" ? motion.h1 : motion.h2;
  return (
    <Tag className={`h-display ${className}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
          <motion.span
            className="block origin-[0%_100%]"
            variants={{ hidden: { y: "108%", rotate: 4, opacity: 0.4 }, show: { y: "0%", rotate: 0, opacity: 1, transition: { delay: i * 0.09, duration: 1.2, ease } } }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
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
