"use client";

import Link from "next/link";
import { motion } from "motion/react";

/* Przełącznik zakresu (linki ?zakres=, z przesuwaną pigułką) */
export default function RangeTabs({ ranges, value }: { ranges: { days: number; label: string }[]; value: number }) {
  return (
    <div className="inline-flex gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.02] p-[3px]">
      {ranges.map((r) => {
        const on = r.days === value;
        return (
          <Link key={r.days} href={`?zakres=${r.days}`} scroll={false} className={`relative flex h-[30px] items-center rounded-full px-3 text-[12.5px] whitespace-nowrap transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
            {on && <motion.span layoutId="range-pill" className="absolute inset-0 rounded-full bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
            <span className="relative">{r.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
