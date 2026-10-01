"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";

const ease = [0.76, 0, 0.24, 1] as const;

// Ekran startowy: linie siatki rysują się od góry, licznik dobija do 100.
export default function Loader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const lenis = useLenis();
  const progress = useMotionValue(0);
  const pct = useTransform(progress, (v) => String(Math.round(v * 100)).padStart(3, "0"));

  useEffect(() => {
    lenis?.stop();
  }, [lenis]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = async () => {
      await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]);
      await animate(progress, 1, { duration: reduce ? 0.2 : 1.3, ease: [0.65, 0, 0.35, 1] });
      setVisible(false);
    };
    run();
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
          className="fixed inset-0 z-[100] bg-bg"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease }}
          role="status"
          aria-label="Ładowanie strony"
        >
          <div className="absolute inset-0 grid grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span
                key={i}
                className={`border-r border-line ${i >= 4 ? "hidden lg:block" : ""}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.06, duration: 1, ease }}
                style={{ transformOrigin: "top" }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="overflow-hidden">
              <motion.p
                className="display text-[clamp(3rem,10vw,8rem)]"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.25, duration: 0.9, ease }}
              >
                {site.brand}
                <span className="text-accent">.</span>
                works
              </motion.p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between border-t border-line px-4 py-3 sm:px-6">
            <span className="label text-muted">{site.role}</span>
            <motion.span className="label text-ink tabular-nums">{pct}</motion.span>
          </div>
          <motion.div className="absolute bottom-0 left-0 h-px w-full origin-left bg-accent" style={{ scaleX: progress }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
