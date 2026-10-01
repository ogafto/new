"use client";

import { motion } from "motion/react";

type Props = {
  children: React.ReactNode;
  label?: string;
  labelPos?: "top" | "bottom";
  color?: string;
  show?: boolean;
  delay?: number;
  className?: string;
  labelClassName?: string;
};

export function Handles({ color = "var(--color-sel)" }: { color?: string }) {
  return (
    <>
      {["-left-[4px] -top-[4px]", "-right-[4px] -top-[4px]", "-left-[4px] -bottom-[4px]", "-right-[4px] -bottom-[4px]"].map((p) => (
        <span key={p} className={`absolute ${p} size-[7px] rounded-[1px] border bg-white`} style={{ borderColor: color }} />
      ))}
    </>
  );
}

// Niebieska ramka zaznaczenia z uchwytami w rogach i etykietą.
export default function SelectionBox({ children, label, labelPos = "bottom", color = "var(--color-sel)", show = true, delay = 0, className = "", labelClassName = "" }: Props) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-x-2 -inset-y-0.5 border sm:-inset-x-3"
        style={{ borderColor: color }}
        initial={{ opacity: 0, scale: 1.06 }}
        animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
        transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Handles color={color} />
        {label && (
          <span
            className={`absolute left-1/2 -translate-x-1/2 rounded-[4px] px-1.5 py-px font-mono text-[10px] leading-4 font-normal tracking-normal whitespace-nowrap text-white not-italic sm:text-[11px] ${
              labelPos === "top" ? "-top-6" : "-bottom-6"
            } ${labelClassName}`}
            style={{ background: color }}
          >
            {label}
          </span>
        )}
      </motion.span>
    </span>
  );
}
