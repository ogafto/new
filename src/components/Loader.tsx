"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { MARK, STROKE } from "@/lib/logo";

const ease = [0.65, 0, 0.35, 1] as const;
const parts = [...MARK.circles.map((c) => ({ c })), ...MARK.paths.map((d) => ({ d }))];

/*
 * Znak rysuje się cienką linią, nabiera grubości, kropka się zapala.
 * Ten sam ekran działa przy wejściu na stronę i przy przejściach między podstronami.
 * `k` skraca animację (przejścia są szybsze niż pierwsze ładowanie).
 */
export function LoaderScreen({ k = 1, label = "Ładowanie strony" }: { k?: number; label?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-bg text-ink"
      initial={{ opacity: k < 1 ? 0 : 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: k < 1 ? 0.35 : 0.9, ease }}
      role="status"
      aria-label={label}
    >
      <motion.div className="flex flex-col items-center gap-8" exit={{ scale: 1.12, opacity: 0, filter: "blur(6px)" }} transition={{ duration: 0.8, ease }}>
        <svg viewBox={MARK.viewBox} className="size-14" fill="none" aria-hidden>
          {parts.map((p, i) => {
            const anim = {
              initial: { pathLength: 0, strokeWidth: 0.8 },
              animate: { pathLength: 1, strokeWidth: STROKE },
              transition: {
                pathLength: { delay: (0.1 + i * 0.14) * k, duration: 0.9 * k, ease },
                strokeWidth: { delay: 0.95 * k, duration: 0.6 * k, ease },
              },
            };
            return "c" in p && p.c ? (
              <motion.circle key={i} cx={p.c.cx} cy={p.c.cy} r={p.c.r} stroke="currentColor" {...anim} />
            ) : (
              <motion.path key={i} d={(p as { d: string }).d} stroke="currentColor" {...anim} />
            );
          })}
          <motion.rect
            x={MARK.dot.x}
            y={MARK.dot.y}
            width={MARK.dot.size}
            height={MARK.dot.size}
            fill="var(--color-accent)"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.15 * k, duration: 0.5 * k, ease }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </svg>
        <span className="relative h-px w-24 overflow-hidden bg-line">
          <motion.span className="absolute inset-0 origin-left bg-ink/70" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.8 * k, ease }} />
        </span>
      </motion.div>
    </motion.div>
  );
}

// Pierwsze wejście na stronę
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
      await Promise.all([Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]), new Promise((r) => setTimeout(r, reduce ? 100 : 1900))]);
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
      {visible && <LoaderScreen key="loader" />}
    </AnimatePresence>
  );
}
