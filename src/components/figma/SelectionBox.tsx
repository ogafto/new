"use client";

import { motion } from "motion/react";

type Props = {
  children: React.ReactNode;
  label?: string;
  color?: string;
  show?: boolean;
  delay?: number;
  className?: string;
};

// Niebieska ramka zaznaczenia z uchwytami w rogach i etykietą wymiarów.
export default function SelectionBox({ children, label, color = "var(--color-sel)", show = true, delay = 0, className = "" }: Props) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-x-2 -inset-y-1 border sm:-inset-x-3"
        style={{ borderColor: color }}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
        transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {["-left-[4px] -top-[4px]", "-right-[4px] -top-[4px]", "-left-[4px] -bottom-[4px]", "-right-[4px] -bottom-[4px]"].map((p) => (
          <span key={p} className={`absolute ${p} size-[7px] border bg-white`} style={{ borderColor: color }} />
        ))}
        {label && (
          <span
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded px-1.5 py-px font-mono text-[10px] leading-4 font-normal tracking-normal whitespace-nowrap text-white not-italic sm:text-[11px]"
            style={{ background: color }}
          >
            {label}
          </span>
        )}
      </motion.span>
    </span>
  );
}
