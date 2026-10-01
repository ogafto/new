"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "motion/react";

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className} aria-hidden>
      <path d="M3.5 10.5l7-7M4.5 3.5h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Delikatne "przyciąganie" przez kursor
export function Magnetic({ children, strength = 0.22 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 16 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 16 });
  return (
    <motion.div
      ref={ref}
      className="inline-flex"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

type Props = {
  children: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "outline";
  className?: string;
  disabled?: boolean;
};

export default function Button({ children, href, onClick, type = "button", variant = "primary", className = "", disabled }: Props) {
  const cls = `group btn btn-${variant} ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`;
  const inner = (
    <>
      <span className="roll">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
      {variant === "primary" && (
        <span className="dot">
          <Arrow />
          <Arrow />
        </span>
      )}
    </>
  );
  if (href?.startsWith("/"))
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}
