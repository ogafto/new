"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { MARK, STROKE } from "@/lib/logo";
import { Wordmark } from "./brand/Logo";

const draw = [0.65, 0, 0.35, 1] as const;

// Linie monogramu: warstwa światła (fiolet + rozmycie) i warstwa właściwa
function Strokes({ glow }: { glow?: boolean }) {
  const items = [...MARK.circles.map((c) => ({ c })), ...MARK.paths.map((d) => ({ d }))];
  return (
    <>
      {items.map((it, i) => {
        const common = {
          stroke: glow ? "#b4a2ff" : "currentColor",
          strokeWidth: glow ? STROKE + 1 : STROKE,
          fill: "none",
          initial: { pathLength: 0, opacity: glow ? 1 : 1 },
          animate: glow ? { pathLength: 1, opacity: [1, 1, 0] } : { pathLength: 1 },
          transition: glow
            ? { pathLength: { delay: 0.15 + i * 0.18, duration: 0.9, ease: draw }, opacity: { delay: 0.15 + i * 0.18, duration: 1.6, times: [0, 0.55, 1] } }
            : { delay: 0.25 + i * 0.18, duration: 0.9, ease: draw },
        };
        return "c" in it && it.c ? (
          <motion.circle key={i} cx={it.c.cx} cy={it.c.cy} r={it.c.r} {...common} />
        ) : (
          <motion.path key={i} d={(it as { d: string }).d} {...common} />
        );
      })}
    </>
  );
}

export default function Loader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const lenis = useLenis();

  useEffect(() => {
    lenis?.stop();
  }, [lenis]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    (async () => {
      await Promise.all([Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]), new Promise((r) => setTimeout(r, reduce ? 100 : 2300))]);
      if (!cancelled) setVisible(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        lenis?.start();
        onDone();
      }}
    >
      {visible && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-bg text-ink"
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          role="status"
          aria-label="Ładowanie strony"
        >
          {/* miękkie światło za znakiem */}
          <motion.div
            className="pointer-events-none absolute size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.22),transparent)]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div className="relative flex items-center gap-5" exit={{ y: -30, opacity: 0 }} transition={{ duration: 0.5 }}>
            <svg viewBox={MARK.viewBox} className="size-20 overflow-visible" aria-hidden>
              <g style={{ filter: "blur(5px)" }}>
                <Strokes glow />
              </g>
              <Strokes />
              <motion.rect
                x={MARK.dot.x}
                y={MARK.dot.y}
                width={MARK.dot.size}
                height={MARK.dot.size}
                fill="var(--color-accent)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.15, type: "spring", stiffness: 420, damping: 14 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
              <motion.rect
                x={MARK.dot.x - 3}
                y={MARK.dot.y - 3}
                width={MARK.dot.size + 6}
                height={MARK.dot.size + 6}
                fill="var(--color-accent)"
                style={{ filter: "blur(4px)", transformBox: "fill-box", transformOrigin: "center" }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2.2, 1], opacity: [0, 0.9, 0] }}
                transition={{ delay: 1.15, duration: 0.9 }}
              />
            </svg>
            <div className="overflow-hidden">
              <motion.div initial={{ x: "-110%" }} animate={{ x: 0 }} transition={{ delay: 1.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                <Wordmark className="h-12 w-auto" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-transparent via-accent to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 2.2, ease: draw }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
