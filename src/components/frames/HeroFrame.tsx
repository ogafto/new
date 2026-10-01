"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { site } from "@/lib/site";
import { useCanvas } from "../canvas/CanvasProvider";

const MIN = 62;
const MAX = 125;
const ease = [0.16, 1, 0.3, 1] as const;

// Słowo w ramce zaznaczenia — uchwyt zmienia szerokość kroju (oś wdth fontu Archivo).
function StretchWord() {
  const { revealed, mode } = useCanvas();
  const wdth = useMotionValue(MIN);
  const stretch = useTransform(wdth, (v) => `${v}%`);
  const [value, setValue] = useState(MIN);
  const [hint, setHint] = useState(false);
  const drag = useRef<{ x: number; w: number } | null>(null);

  useMotionValueEvent(wdth, "change", (v) => setValue(Math.round(v)));

  useEffect(() => {
    if (!revealed) return;
    const delay = mode === "canvas" ? 3.4 : 0.8;
    const c = animate(wdth, 100, { delay, duration: 1.6, ease: [0.65, 0, 0.35, 1], onComplete: () => setHint(true) });
    return () => c.stop();
  }, [revealed, mode, wdth]);

  const set = (v: number) => wdth.set(Math.max(MIN, Math.min(MAX, v)));

  return (
    <span className="relative inline-block select-none">
      <motion.span className="relative inline-block" style={{ fontStretch: stretch }}>
        obojętnie.
      </motion.span>
      <span aria-hidden className="pointer-events-none absolute -inset-x-[0.12em] -inset-y-[0.02em] border-[1.5px] border-sel">
        {["-left-[5px] -top-[5px]", "-right-[5px] -top-[5px]", "-left-[5px] -bottom-[5px]", "-right-[5px] -bottom-[5px]"].map((p) => (
          <span key={p} className={`absolute ${p} size-[9px] border-[1.5px] border-sel bg-white`} />
        ))}
        <span className="absolute top-full left-1/2 mt-3 -translate-x-1/2 rounded-[4px] bg-sel px-2 py-0.5 font-ui text-[12px] leading-5 font-medium tracking-normal whitespace-nowrap text-white lg:text-[14px]">
          Szerokość {value}
        </span>
      </span>
      <button
        type="button"
        role="slider"
        aria-label="Szerokość kroju"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
        className="absolute top-1/2 -right-[0.12em] z-10 h-[46%] w-[14px] translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border-[1.5px] border-sel bg-white focus-visible:ring-4 focus-visible:ring-sel/30 focus-visible:outline-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, w: wdth.get() };
          setHint(false);
        }}
        onPointerMove={(e) => drag.current && set(drag.current.w + (e.clientX - drag.current.x) * 0.2)}
        onPointerUp={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") set(wdth.get() + 4);
          if (e.key === "ArrowLeft") set(wdth.get() - 4);
        }}
      >
        <AnimatePresence>
          {hint && (
            <motion.span
              className="pointer-events-none absolute top-1/2 left-full ml-4 -translate-y-1/2 rounded-md bg-[#1e1e1e] px-2.5 py-1.5 font-ui text-[12px] leading-none font-medium tracking-normal whitespace-nowrap text-white lg:text-[14px]"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              Złap i rozciągnij ↔
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </span>
  );
}

export default function HeroFrame() {
  const { goToId, revealed, mode } = useCanvas();
  const d = mode === "canvas" ? 2.6 : 0.3;
  const reveal = (i: number) => ({
    initial: { y: "105%" },
    animate: revealed ? { y: "0%" } : {},
    transition: { delay: d + i * 0.09, duration: 1.1, ease },
  });

  return (
    <div className="flex min-h-[640px] flex-col justify-between gap-12 p-6 sm:p-10 lg:h-full lg:p-14">
      <header className="flex items-start justify-between font-ui text-[13px] lg:text-[15px]">
        <p>
          <span className="font-display text-[17px] font-semibold tracking-[-0.02em] lg:text-[20px]">{site.brand}</span>
          <span className="fg-55"> — {site.role.toLowerCase()}</span>
        </p>
        <p className="fg-55 hidden text-right sm:block">
          Portfolio 2026
          <br />
          {site.location}
        </p>
      </header>

      <h1 className="font-display text-[clamp(2.6rem,11vw,4.2rem)] leading-[0.92] font-semibold tracking-[-0.045em] lg:text-[110px]">
        <span className="block overflow-hidden pb-[0.06em]">
          <motion.span className="block" {...reveal(0)}>
            Strony, których
          </motion.span>
        </span>
        <span className="block overflow-hidden pb-[0.06em]">
          <motion.span className="block" {...reveal(1)}>
            nie da się przewinąć
          </motion.span>
        </span>
        <motion.span
          className="mt-1 block"
          initial={{ opacity: 0 }}
          animate={revealed ? { opacity: 1 } : {}}
          transition={{ delay: d + 0.3, duration: 0.6 }}
        >
          <StretchWord />
        </motion.span>
      </h1>

      <motion.div
        className="grid gap-8 lg:grid-cols-12 lg:items-end"
        initial={{ opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d + 0.5, duration: 1, ease }}
      >
        <p className="fg-70 max-w-md text-[17px] leading-relaxed lg:col-span-5 lg:text-[20px]">
          Jestem grafikiem komputerowym i projektantem stron. Łączę design z kodem — projektuję w Figmie, buduję w Next.js
          i pilnuję, żeby strona nie tylko wyglądała, ale też sprzedawała.
        </p>
        <ul className="fg-55 flex flex-wrap gap-x-5 gap-y-1 font-ui text-[14px] lg:col-span-3 lg:col-start-7 lg:block lg:space-y-1.5 lg:text-[15px]">
          <li>Strony internetowe</li>
          <li>Projekty UI/UX</li>
          <li>Identyfikacja wizualna</li>
          <li>Grafika & social media</li>
        </ul>
        <div className="flex flex-wrap items-center gap-5 lg:col-span-3 lg:justify-end">
          <button type="button" onClick={() => goToId("projekt-ziarno")} className="pill pill-solid">
            Zobacz realizacje <span className="arr">↓</span>
          </button>
          <button type="button" onClick={() => goToId("kontakt")} className="link-u pb-0.5 text-[17px] font-medium">
            Napisz do mnie
          </button>
        </div>
      </motion.div>
    </div>
  );
}
