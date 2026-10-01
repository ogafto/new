"use client";

import { useEffect, useId, useRef } from "react";
import { animate, motion, useMotionValue, useSpring } from "motion/react";

const ALMOND = "M4 50 C 26 13, 74 13, 96 50 C 74 87, 26 87, 4 50 Z";

// Litera "O" narysowana jako oko, które śledzi kursor i co jakiś czas mruga.
export default function Eye() {
  const ref = useRef<SVGSVGElement>(null);
  const clip = useId();
  const x = useSpring(0, { stiffness: 220, damping: 22 });
  const y = useSpring(0, { stiffness: 220, damping: 22 });
  const lid = useMotionValue(1);

  useEffect(() => {
    const look = (cx: number, cy: number) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const dx = cx - (r.left + r.width / 2);
      const dy = cy - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 260);
      x.set((dx / d) * 18 * k);
      y.set((dy / d) * 11 * k);
    };
    const onMove = (e: PointerEvent) => look(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove);

    // na ekranach dotykowych oko samo się rozgląda
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const wander = touch
      ? setInterval(() => {
          x.set((Math.random() - 0.5) * 32);
          y.set((Math.random() - 0.5) * 18);
        }, 1600)
      : undefined;

    const blink = setInterval(() => {
      animate(lid, [1, 0.06, 1], { duration: 0.26, times: [0, 0.45, 1] });
    }, 4200);

    return () => {
      window.removeEventListener("pointermove", onMove);
      clearInterval(blink);
      if (wander) clearInterval(wander);
    };
  }, [x, y, lid]);

  return (
    <svg ref={ref} viewBox="0 0 100 100" className="inline-block h-[0.78em] w-[0.92em] align-baseline" role="img" aria-label="O">
      <defs>
        <clipPath id={clip}>
          <path d={ALMOND} />
        </clipPath>
      </defs>
      <motion.g style={{ scaleY: lid, transformOrigin: "50px 50px" }}>
        <path d={ALMOND} fill="none" stroke="currentColor" strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
        <g clipPath={`url(#${clip})`}>
          <motion.g style={{ x, y }}>
            <circle cx="50" cy="50" r="23" fill="none" stroke="currentColor" strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
            <circle cx="50" cy="50" r="10" fill="var(--color-accent)" />
            <circle cx="45" cy="45" r="2.6" fill="#0a0a0a" />
          </motion.g>
        </g>
      </motion.g>
    </svg>
  );
}
