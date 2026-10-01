"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";

const labels = ["Rysuję ramki", "Układam warstwy", "Dodaję animacje", "Gotowe"];
const DURATION = 2.1;

export default function Loader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const lenis = useLenis();
  const progress = useMotionValue(0);
  const pct = useTransform(progress, (v) => `${Math.round(v * 100)}`.padStart(3, "0"));
  const w = useTransform(progress, (v) => Math.round(v * 1440));
  const h = useTransform(progress, (v) => Math.round(v * 900));
  const [label, setLabel] = useState(0);

  useEffect(() => {
    lenis?.stop();
    window.scrollTo(0, 0);
  }, [lenis]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = animate(progress, 1, {
      duration: reduce ? 0.3 : DURATION,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setLabel(Math.min(labels.length - 1, Math.floor(v * labels.length))),
      onComplete: () => setTimeout(() => setVisible(false), reduce ? 0 : 250),
    });
    return () => controls.stop();
  }, [progress]);

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
          className="canvas-dots fixed inset-0 z-[100] flex items-center justify-center bg-canvas"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-label="Ładowanie strony"
          role="status"
        >
          {/* Ramka rysowana narzędziem Frame */}
          <div className="relative flex h-[46vmin] w-[74vmin] max-w-[92vw] items-center justify-center">
            <motion.div
              className="absolute inset-0 border border-sel"
              initial={{ scaleX: 0, scaleY: 0 }}
              animate={{ scaleX: 1, scaleY: 1 }}
              transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
              style={{ transformOrigin: "0 0" }}
            >
              {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((p) => (
                <span key={p} className={`absolute ${p} size-2 border border-sel bg-white`} />
              ))}
              <span className="absolute -top-6 left-0 font-mono text-[11px] text-muted">
                # Frame — {site.domain}
              </span>
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 rounded bg-sel px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-white">
                <motion.span>{w}</motion.span> × <motion.span>{h}</motion.span>
              </span>
            </motion.div>

            <div className="relative text-center">
              <motion.div
                className="font-display text-6xl font-semibold tracking-tighter sm:text-8xl"
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {site.brand}
                <span className="text-sel">.</span>
              </motion.div>
              <div className="mt-3 h-5 overflow-hidden font-mono text-xs text-muted">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={label}
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {labels[label]}…
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Licznik i pasek postępu */}
          <div className="absolute inset-x-4 bottom-6 flex items-end justify-between font-mono text-xs text-muted sm:inset-x-8 sm:bottom-8">
            <span>{site.tagline}</span>
            <span className="font-display text-5xl font-semibold tracking-tighter text-ink tabular-nums sm:text-7xl">
              <motion.span>{pct}</motion.span>
              <span className="text-muted">%</span>
            </span>
          </div>
          <motion.div
            className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-sel"
            style={{ scaleX: progress }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
