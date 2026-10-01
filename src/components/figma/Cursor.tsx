"use client";

import { motion } from "motion/react";

type Props = {
  name: string;
  color: string;
  path: { x: string[]; y: string[] };
  duration?: number;
  delay?: number;
  className?: string;
};

export function CursorIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" className="drop-shadow-md">
      <path d="M1.5 1.5L16 9.2L9.4 10.8L6.3 17.6L1.5 1.5Z" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// Kursor "współpracownika" wędrujący po płótnie.
export default function Cursor({ name, color, path, duration = 12, delay = 0, className = "" }: Props) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute top-0 left-0 z-20 ${className}`}
      initial={{ left: path.x[0], top: path.y[0], opacity: 0 }}
      animate={{ left: path.x, top: path.y, opacity: 1 }}
      transition={{
        left: { duration, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        top: { duration, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        opacity: { delay, duration: 0.4 },
      }}
    >
      <CursorIcon color={color} />
      <span
        className="mt-0.5 ml-3 block rounded-full rounded-tl-sm px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white shadow-lg"
        style={{ background: color }}
      >
        {name}
      </span>
    </motion.div>
  );
}
