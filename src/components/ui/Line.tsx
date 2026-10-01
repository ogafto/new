"use client";

import { motion } from "motion/react";

const ease = [0.76, 0, 0.24, 1] as const;

// Znacznik "+" na przecięciu linii
export function Cross({ className = "" }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" className={`pointer-events-none absolute z-10 text-line-strong ${className}`} aria-hidden>
      <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// Pozioma linia rysowana od lewej przy wejściu w widok
export function LineX({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute left-0 h-px w-full origin-left bg-line ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 1.2, ease }}
    />
  );
}

// Sekcja zamknięta liniami, z krzyżykami na krawędziach kontenera
export function Section({
  id,
  index,
  label,
  children,
  className = "",
}: {
  id?: string;
  index?: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative ${className}`}>
      <LineX className="top-0" />
      <Cross className="-top-[5px] -left-[6px]" />
      <Cross className="-top-[5px] -right-[6px]" />
      {label && (
        <div className="relative flex h-11 items-center justify-between px-4 sm:px-6">
          <span className="label text-muted">
            <span className="text-accent">{index}</span> / {label}
          </span>
          <span className="label hidden text-dim sm:block">afto.works</span>
          <LineX className="bottom-0" delay={0.15} />
        </div>
      )}
      {children}
    </section>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4 12L12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

// Przycisk: tekst | komórka ze strzałką
export function LineButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "accent",
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "accent" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  const cls = `btn-line btn-${variant} ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`;
  const inner = (
    <>
      <span className="t flex-1">{children}</span>
      <span className="a">
        <Arrow />
        <Arrow />
      </span>
    </>
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
