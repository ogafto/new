"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";
import Mark from "./chrome/Mark";

// Ekran "otwierania pliku" — krótki, rzeczowy, bez fajerwerków.
export default function Loader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const lenis = useLenis();
  const progress = useMotionValue(0);

  useEffect(() => {
    lenis?.stop();
  }, [lenis]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = async () => {
      await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
      await animate(progress, 1, { duration: reduce ? 0.2 : 1.1, ease: [0.65, 0, 0.35, 1] });
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
          className="canvas-dots fixed inset-0 z-[100] grid place-items-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          role="status"
          aria-label="Otwieranie pliku"
        >
          <motion.div className="flex flex-col items-center" exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.35 }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <Mark className="size-14" />
            </motion.div>
            <p className="mt-5 font-ui text-[14px] font-semibold">{site.domain}</p>
            <p className="mt-1 font-ui text-[12px] text-black/45">Otwieranie pliku…</p>
            <div className="mt-5 h-[3px] w-40 overflow-hidden rounded-full bg-black/10">
              <motion.div className="h-full origin-left rounded-full bg-sel" style={{ scaleX: progress }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
