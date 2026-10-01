"use client";

import { motion } from "motion/react";
import type { ServiceId } from "@/lib/site";

// Ikony usług rysowane linią; przy aktywacji "rysują się" od nowa.
const paths: Record<ServiceId, string[]> = {
  www: ["M4 8h40v32H4z", "M4 15h40", "M9 11.5h1M13 11.5h1M17 11.5h1", "M10 22h16M10 27h22M10 32h12", "M32 22h6v10h-6z"],
  shop: ["M10 16h28l-2.5 26h-23z", "M17 16v-3a7 7 0 0 1 14 0v3", "M17 22v2M31 22v2", "M16 34h16"],
  brand: ["M24 6a18 18 0 1 0 0.01 0", "M10 24h28M24 10v28", "M15 15l18 18M33 15L15 33", "M24 17a7 7 0 1 0 0.01 0"],
  ui: ["M14 4h20v40H14z", "M14 10h20M14 38h20", "M19 16h10v8H19z", "M19 28h10M19 32h6", "M4 14h6v20H4zM38 14h6v20h-6z"],
};

export default function ServiceIcon({ id, active = false, className = "size-11" }: { id: ServiceId; active?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      {paths[id].map((d, i) => (
        <motion.path
          key={`${id}-${i}-${active}`}
          d={d}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: !active }}
          transition={{ delay: i * 0.12, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
    </svg>
  );
}
