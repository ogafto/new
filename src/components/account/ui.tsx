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

// Sześć pól na kod — wklejanie, strzałki, backspace; po wpisaniu wysyła formularz
export function OtpInput({ name = "code", invalid }: { name?: string; invalid?: boolean }) {
  const [v, setV] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const set = (next: string[], focus: number) => {
    setV(next);
    refs.current[Math.min(5, focus)]?.focus();
    if (next.every(Boolean)) setTimeout(() => refs.current[0]?.form?.requestSubmit(), 60);
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <input type="hidden" name={name} value={v.join("")} />
      {v.map((d, i) => (
        <motion.input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Cyfra ${i + 1}`}
          animate={invalid ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`h-16 w-full min-w-0 rounded-2xl border bg-white/[0.02] text-center text-[26px] font-medium outline-none transition-[border-color,box-shadow,background-color] duration-300 focus:border-accent focus:bg-accent/[0.05] focus:shadow-[0_0_0_4px_rgb(139_108_255/0.14)] ${
            d ? "border-white/30" : "border-line-2"
          } ${i === 3 ? "ml-2 sm:ml-4" : ""}`}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) return set(v.map((x, j) => (j === i ? "" : x)), i);
            const next = [...v];
            digits.split("").forEach((c, k) => {
              if (i + k < 6) next[i + k] = c;
            });
            set(next, i + digits.length);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !v[i] && i > 0) {
              e.preventDefault();
              set(v.map((x, j) => (j === i - 1 ? "" : x)), i - 1);
            }
            if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
