"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { Mark } from "./brand/Logo";

// Krótki ekran startowy: monogram rysuje się linią, kropka "wskakuje", całość odjeżdża w górę.
export default function Loader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const lenis = useLenis();

  useEffect(() => {
    lenis?.stop();
  }, [lenis]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    const run = async () => {
      await Promise.all([
        Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]),
        new Promise((r) => setTimeout(r, reduce ? 100 : 1500)),
      ]);
      if (!cancelled) setVisible(false);
    };
    run();
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
          className="fixed inset-0 z-[100] grid place-items-center bg-bg text-ink"
          exit={{ clipPath: "inset(0 0 100% 0 round 0 0 32px 32px)" }}
          initial={{ clipPath: "inset(0 0 0% 0 round 0 0 0px 0px)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          role="status"
          aria-label="Ładowanie strony"
        >
          <motion.div exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.5 }}>
            <Mark draw className="size-20" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
