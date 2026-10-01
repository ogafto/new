"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Option = { value: string; label: string; meta?: string };

// Lista wyboru w stylu pól formularza (pływająca etykieta, rozwijana karta)
export default function Select({ name, label, options, value, onChange, required, invalid }: { name: string; label: string; options: Option[]; value: string; onChange: (v: string) => void; required?: boolean; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    addEventListener("mousedown", close);
    return () => removeEventListener("mousedown", close);
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${open ? "z-30" : ""}`}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setHi(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) return setOpen(true);
            setHi((h) => (h + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
          }
          if ((e.key === "Enter" || e.key === " ") && open) {
            e.preventDefault();
            pick(options[hi].value);
          }
        }}
        className={`relative flex h-[60px] w-full items-end justify-between rounded-2xl border bg-white/[0.02] px-4 pb-2.5 text-left text-[16px] outline-none transition-[border-color,background-color,box-shadow] duration-300 hover:border-white/25 focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_rgb(139_108_255/0.12)] ${
          invalid ? "border-red-400/60" : open ? "border-accent bg-accent/[0.04] shadow-[0_0_0_4px_rgb(139_108_255/0.12)]" : "border-line-2"
        }`}
      >
        <span
          className={`pointer-events-none absolute left-[17px] transition-all duration-300 ease-out-expo ${current || open ? "top-[10px] text-[11.5px]" : "top-1/2 -translate-y-1/2 text-[15px]"} ${open ? "text-accent-2" : "text-dim"}`}
        >
          {label}
          {required && <span className="text-accent"> *</span>}
        </span>
        <span className="truncate text-ink">{current ? current.label : " "}</span>
        <motion.svg viewBox="0 0 12 12" className="mb-1 size-3 shrink-0 text-muted" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            data-lenis-prevent
            className="edge absolute top-[calc(100%+8px)] right-0 left-0 max-h-[300px] overflow-y-auto rounded-2xl bg-surface-2 p-1.5 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.9)]"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {options.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl px-3.5 py-3 text-left text-[15px] transition-colors ${i === hi ? "bg-white/[0.06] text-ink" : "text-muted"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`grid size-4 place-items-center rounded-full border ${o.value === value ? "border-accent bg-accent" : "border-line-2"}`}>
                      {o.value === value && (
                        <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden>
                          <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {o.label}
                  </span>
                  {o.meta && <span className="text-[13px] text-dim">{o.meta}</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
