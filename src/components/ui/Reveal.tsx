"use client";

import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export function FadeUp({ children, delay = 0, className = "", y = 28 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 1, ease }}
    >
      {children}
    </motion.div>
  );
}

// Nagłówek sekcji: linie tekstu wysuwają się spod maski
export function Heading({ lines, className = "", as: Tag = "h2" }: { lines: React.ReactNode[]; className?: string; as?: "h1" | "h2" }) {
  const MotionTag = Tag === "h1" ? motion.h1 : motion.h2;
  return (
    <MotionTag className={`h-display ${className}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className="block"
            variants={{ hidden: { y: "105%" }, show: { y: "0%", transition: { delay: i * 0.08, duration: 1.1, ease } } }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
