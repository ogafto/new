"use client";

import { motion } from "motion/react";

type Props = {
  index: string;
  frame: string;
  title: React.ReactNode;
  lead?: string;
  align?: "left" | "center";
};

// Nagłówek sekcji podpisany jak ramka w Figmie: "# 02 — Proces".
export default function SectionHeader({ index, frame, title, lead, align = "left" }: Props) {
  const center = align === "center";
  return (
    <div className={`mb-12 sm:mb-16 ${center ? "mx-auto text-center" : ""} max-w-3xl`}>
      <motion.div
        className={`mb-5 flex items-center gap-2 font-mono text-xs text-muted ${center ? "justify-center" : ""}`}
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-sel" aria-hidden>
          <path d="M3 0v12M9 0v12M0 3h12M0 9h12" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span className="text-sel">{index}</span>
        <span>—</span>
        <span>{frame}</span>
      </motion.div>
      <motion.h2
        className="font-display text-4xl leading-[1.02] font-semibold tracking-tighter text-balance sm:text-6xl"
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.h2>
      {lead && (
        <motion.p
          className={`mt-5 max-w-xl text-base text-pretty text-muted sm:text-lg ${center ? "mx-auto" : ""}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.15, duration: 0.7 }}
        >
          {lead}
        </motion.p>
      )}
    </div>
  );
}
