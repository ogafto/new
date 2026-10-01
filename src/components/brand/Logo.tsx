"use client";

import { motion } from "motion/react";
import { MARK, STROKE, WORDMARK } from "@/lib/logo";

type Geo = typeof MARK | typeof WORDMARK;

function Shape({ g, className, draw = false, label }: { g: Geo; className?: string; draw?: boolean; label: string }) {
  const t = (i: number) => ({ delay: i * 0.12, duration: 0.9, ease: [0.65, 0, 0.35, 1] as const });
  // wersja statyczna — bez dasharray, więc bez szwów na okręgach
  if (!draw)
    return (
      <svg viewBox={g.viewBox} fill="none" className={className} role="img" aria-label={label}>
        {g.circles.map((c, i) => (
          <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} stroke="currentColor" strokeWidth={STROKE} />
        ))}
        {g.paths.map((d, i) => (
          <path key={`p${i}`} d={d} stroke="currentColor" strokeWidth={STROKE} />
        ))}
        <rect x={g.dot.x} y={g.dot.y} width={g.dot.size} height={g.dot.size} fill="var(--color-accent)" />
      </svg>
    );
  return (
    <svg viewBox={g.viewBox} fill="none" className={className} role="img" aria-label={label}>
      {g.circles.map((c, i) => (
        <motion.circle
          key={`c${i}`}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          stroke="currentColor"
          strokeWidth={STROKE}
          initial={draw ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={t(i)}
        />
      ))}
      {g.paths.map((d, i) => (
        <motion.path
          key={`p${i}`}
          d={d}
          stroke="currentColor"
          strokeWidth={STROKE}
          initial={draw ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={t(i + g.circles.length)}
        />
      ))}
      <motion.rect
        className="logo-dot"
        x={g.dot.x}
        y={g.dot.y}
        width={g.dot.size}
        height={g.dot.size}
        fill="var(--color-accent)"
        initial={draw ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{ delay: draw ? 0.9 : 0, type: "spring", stiffness: 400, damping: 14 }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  );
}

// Monogram "af."
export function Mark({ className = "h-8 w-8", draw }: { className?: string; draw?: boolean }) {
  return <Shape g={MARK} className={className} draw={draw} label="afto" />;
}

// Logotyp "afto."
export function Wordmark({ className = "h-7 w-auto", draw }: { className?: string; draw?: boolean }) {
  return <Shape g={WORDMARK} className={className} draw={draw} label="afto" />;
}
