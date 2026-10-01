"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Arrow } from "../ui/Button";

export function Submit({ children, pending: forced, className = "" }: { children: string; pending?: boolean; className?: string }) {
  const { pending: status } = useFormStatus();
  const pending = forced ?? status;
  return (
    <button
      type="submit"
      disabled={pending}
      className={`group relative flex h-[60px] w-full items-center justify-between overflow-hidden rounded-full bg-ink pr-2 pl-7 text-[16px] font-medium text-bg transition-opacity disabled:opacity-70 ${className}`}
    >
      <span className="absolute inset-0 bg-accent [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-700 ease-out-expo group-hover:[clip-path:inset(0_0_0_0)]" />
      <span className="relative transition-colors duration-500 group-hover:text-white">{pending ? "Chwileczkę…" : children}</span>
      <span className="relative grid size-11 place-items-center rounded-full bg-bg text-ink">
        {pending ? (
          <span className="size-4 animate-spin rounded-full border-[1.5px] border-ink/30 border-t-ink" />
        ) : (
          <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </span>
    </button>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "ok"; children?: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {children && (
        <motion.p
          role={tone === "error" ? "alert" : "status"}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <span
            className={`mt-1 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[14px] leading-relaxed ${
              tone === "error" ? "border-red-400/20 bg-red-400/[0.06] text-red-200" : "border-accent/30 bg-accent/[0.08] text-accent-2"
            }`}
          >
            <span className={`mt-[7px] size-1.5 shrink-0 rounded-full ${tone === "error" ? "bg-red-300" : "bg-accent-2"}`} />
            {children}
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export type SlotState = "idle" | "checking" | "ok" | "error";

/*
 * Pola na kod (zaproszenia / weryfikacyjny). Jedno ukryte pole przechwytuje pisanie i wklejanie,
 * a „sloty” tylko je pokazują — każdy znak wskakuje z animacją; stany: sprawdzanie, OK, błąd.
 */
export function Slots({
  length,
  split,
  value,
  onChange,
  onComplete,
  state = "idle",
  numeric = false,
  name,
  label,
}: {
  length: number;
  split?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  state?: SlotState;
  numeric?: boolean;
  name?: string;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focus, setFocus] = useState(false);
  const clean = (v: string) => (numeric ? v.replace(/\D/g, "") : v.toUpperCase().replace(/[^A-Z0-9]/g, "")).slice(0, length);
  return (
    <motion.div
      className="relative"
      animate={state === "error" ? { x: [0, -10, 9, -6, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => ref.current?.focus()}
    >
      <input
        ref={ref}
        name={name}
        value={value}
        aria-label={label}
        inputMode={numeric ? "numeric" : "text"}
        autoComplete={numeric ? "one-time-code" : "off"}
        autoCapitalize="characters"
        spellCheck={false}
        autoFocus
        disabled={state === "checking" || state === "ok"}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onChange={(e) => {
          const v = clean(e.target.value);
          onChange(v);
          if (v.length === length) onComplete?.(v);
        }}
        className="absolute inset-0 z-10 size-full cursor-text opacity-0"
      />
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {Array.from({ length }).map((_, i) => {
          const ch = value[i];
          const active = focus && i === Math.min(value.length, length - 1) && state === "idle";
          return (
            <div key={i} className="contents">
              {split && i === split && <span className="mx-0.5 h-px w-3 bg-line-2 sm:mx-1" />}
              <motion.div
                className={`relative grid aspect-[4/5] w-full max-w-[46px] place-items-center overflow-hidden rounded-xl border text-[22px] font-medium sm:rounded-2xl sm:text-[26px] ${
                  state === "error" ? "border-red-400/60 bg-red-400/[0.06]" : active ? "border-accent bg-accent/[0.08] shadow-[0_0_0_4px_rgb(139_108_255/0.15)]" : ch ? "border-white/25 bg-white/[0.04]" : "border-line-2 bg-white/[0.02]"
                }`}
                animate={state === "ok" ? { backgroundColor: "rgba(139,108,255,1)", borderColor: "rgba(180,162,255,1)", y: [0, -6, 0] } : {}}
                transition={{ delay: i * 0.05, duration: 0.45 }}
              >
                {state === "checking" && (
                  <motion.span className="absolute inset-0 bg-gradient-to-b from-accent/0 via-accent/25 to-accent/0" initial={{ y: "-100%" }} animate={{ y: "100%" }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.07 }} />
                )}
                <AnimatePresence mode="popLayout">
                  {ch && (
                    <motion.span key={ch + i} className={`relative ${state === "ok" ? "text-white" : ""}`} initial={{ scale: 0.3, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 26 }}>
                      {ch}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && !ch && <span className="absolute h-7 w-px animate-pulse bg-accent-2" />}
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Pasek kroków u góry karty
export function Steps({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="mb-8 grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
      {labels.map((l, i) => (
        <div key={l}>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" initial={false} animate={{ width: i < step ? "100%" : i === step ? "35%" : "0%" }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <p className={`mt-2 text-[11.5px] transition-colors duration-500 ${i <= step ? "text-ink" : "text-dim"}`}>{l}</p>
        </div>
      ))}
    </div>
  );
}

export function AuthTitle({ kicker, title, text, k }: { kicker: string; title: React.ReactNode; text?: React.ReactNode; k?: string }) {
  return (
    <div className="mb-8" key={k}>
      <motion.p className="text-[13px] text-accent-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        {kicker}
      </motion.p>
      <h1 className="h-display mt-3 overflow-hidden pb-[0.12em] text-[clamp(2.2rem,6vw,2.9rem)]">
        <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.05, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          {title}
        </motion.span>
      </h1>
      {text && (
        <motion.p className="mt-3 text-[15px] leading-relaxed text-muted" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Siła hasła: 4 segmenty
export function Strength({ value }: { value: string }) {
  const score = [value.length >= 8, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value) || value.length >= 14].filter(Boolean).length;
  const labels = ["Za krótkie", "Słabe", "Średnie", "Mocne", "Bardzo mocne"];
  const colors = ["bg-red-400", "bg-red-400", "bg-amber-300", "bg-emerald-400", "bg-emerald-400"];
  if (!value) return null;
  return (
    <div className="mt-2 flex items-center gap-3 px-1">
      <div className="grid flex-1 grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className={`h-full ${colors[score]}`} initial={false} animate={{ width: i < score ? "100%" : "0%" }} transition={{ duration: 0.4, delay: i * 0.05 }} />
          </div>
        ))}
      </div>
      <span className="w-[86px] text-right text-[11.5px] text-dim">{labels[value.length < 8 ? 0 : score]}</span>
    </div>
  );
}

// Sukces: rysujący się znaczek
export function Success({ title, text }: { title: string; text: string }) {
  return (
    <motion.div className="flex flex-col items-center py-6 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
      <div className="relative grid size-24 place-items-center">
        <motion.span className="absolute inset-0 rounded-full bg-accent/30 blur-2xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ duration: 1 }} />
        <svg viewBox="0 0 64 64" className="relative size-20" fill="none" aria-hidden>
          <motion.circle cx="32" cy="32" r="30" stroke="#8b6cff" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
          <motion.path d="M20 33l8 8 16-17" stroke="#b4a2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.5 }} />
        </svg>
      </div>
      <h2 className="h-display mt-6 text-[34px]">{title}</h2>
      <p className="mt-2 text-[15px] text-muted">{text}</p>
    </motion.div>
  );
}
