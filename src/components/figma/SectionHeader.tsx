"use client";

import { motion } from "motion/react";
import { Words } from "../ui/Reveal";

type Props = {
  index: string;
  label: string;
  title: string;
  accent?: string; // słowo pisane kursywą z gradientem, doklejane na końcu tytułu
  lead?: string;
  align?: "left" | "center";
  className?: string;
};

// Nagłówek sekcji: etykieta jak nazwa ramki w Figmie + tytuł odsłaniany słowo po słowie.
export default function SectionHeader({ index, label, title, accent, lead, align = "left", className = "" }: Props) {
  const center = align === "center";
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""} ${className}`}>
      <motion.div
        className={`mb-6 inline-flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 font-mono text-[11px] tracking-wide text-muted uppercase hairline`}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-ink">{index}</span>
        {label}
      </motion.div>
      <h2 className="font-display text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[1] font-medium tracking-[-0.045em] text-balance">
        <Words text={title} className="text-silver" />
        {accent && (
          <motion.span
            className="text-accent inline-block pr-1 font-serif font-normal tracking-[-0.02em] italic"
            initial={{ opacity: 0, y: "0.3em", filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: title.split(" ").length * 0.05 + 0.05, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {accent}
          </motion.span>
        )}
      </h2>
      {lead && (
        <motion.p
          className={`mt-6 max-w-xl text-[17px] leading-relaxed text-pretty text-muted ${center ? "mx-auto" : ""}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {lead}
        </motion.p>
      )}
    </div>
  );
}
