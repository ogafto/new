"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";

const labels = ["Rysuję ramki", "Układam warstwy", "Dodaję animacje", "Gotowe"];
const DURATION = 2.2;
const ease = [0.16, 1, 0.3, 1] as const;

export default function Loader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const lenis = useLenis();
  const progress = useMotionValue(0);
  const pct = useTransform(progress, (v) => `${Math.round(v * 100)}`.padStart(3, "0"));
  const w = useTransform(progress, (v) => Math.round(v * 1440));
  const h = useTransform(progress, (v) => Math.round(v * 900));
  const [label, setLabel] = useState(0);
  const [name, tld] = site.domain.split(".");

  useEffect(() => {
    lenis?.stop();
  }, [lenis]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = animate(progress, 1, {
      duration: reduce ? 0.3 : DURATION,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setLabel(Math.min(labels.length - 1, Math.floor(v * labels.length))),
      onComplete: () => setTimeout(() => setVisible(false), reduce ? 0 : 300),
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
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-canvas"
          initial={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0% round 0px 0px 48px 48px)" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          role="status"
          aria-label="Ładowanie strony"
        >
          <div className="canvas-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_70%)]" />
          <div className="absolute top-1/2 left-1/2 size-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sel/10 blur-[120px]" />

          <motion.div
            className="relative flex aspect-[16/10] w-[min(70vmin,560px)] items-center justify-center"
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            <motion.div
              className="absolute inset-0 border border-sel"
              initial={{ clipPath: "inset(0 100% 100% 0)" }}
              animate={{ clipPath: "inset(0 0% 0% 0)" }}
              transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
            >
              {["-left-[4px] -top-[4px]", "-right-[4px] -top-[4px]", "-left-[4px] -bottom-[4px]", "-right-[4px] -bottom-[4px]"].map((p) => (
                <span key={p} className={`absolute ${p} size-[7px] border border-sel bg-white`} />
              ))}
            </motion.div>
            <span className="absolute -top-6 left-0 font-mono text-[11px] text-muted">Frame · {site.domain}</span>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 rounded-[4px] bg-sel px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-white tabular-nums">
              <motion.span>{w}</motion.span> × <motion.span>{h}</motion.span>
            </span>

            <div className="flex flex-col items-center gap-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 1, ease }}
              >
                <LogoMark className="size-12" />
              </motion.div>
              <div className="overflow-hidden">
                <motion.p
                  className="font-display text-5xl font-medium tracking-[-0.05em] sm:text-7xl"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.35, duration: 1, ease }}
                >
                  {name}
                  <span className="text-muted">.{tld}</span>
                </motion.p>
              </div>
              <div className="h-4 overflow-hidden font-mono text-[11px] text-muted">
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
          </motion.div>

          <div className="absolute inset-x-5 bottom-6 flex items-end justify-between sm:inset-x-10 sm:bottom-9">
            <span className="font-mono text-[11px] text-muted">{site.tagline}</span>
            <span className="font-display text-6xl leading-none font-medium tracking-[-0.06em] tabular-nums sm:text-8xl">
              <motion.span>{pct}</motion.span>
            </span>
          </div>
          <motion.div className="absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-sel via-comp to-fig-coral" style={{ scaleX: progress }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
