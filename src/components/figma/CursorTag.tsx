"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

// Etykieta "Ty" podążająca za kursorem — jak w trybie multiplayer w Figmie.
export default function CursorTag() {
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(!(e.target as Element | null)?.closest?.("[data-own-cursor]"));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[90] [@media(pointer:coarse)]:hidden"
      style={{ x: sx, y: sy }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
    >
      <span className="ml-4 mt-5 block rounded-full rounded-tl-sm bg-sel px-2 py-0.5 text-[11px] font-medium text-white shadow-lg">
        Ty
      </span>
    </motion.div>
  );
}
