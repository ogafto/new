"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ServiceId } from "@/lib/site";
import { usePageTransition } from "../Transition";
import { Arrow, Magnetic } from "../ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

// „Wyceń projekt” — zaznacza usługę w formularzu na stronie głównej
export function OrderButton({ service, label = "Wyceń projekt" }: { service?: ServiceId; label?: string }) {
  const go = usePageTransition();
  return (
    <Magnetic>
      <button
        type="button"
        onClick={() => {
          try {
            if (service) sessionStorage.setItem("afto:service", service);
          } catch {}
          go("/#kontakt", "Kontakt");
        }}
        className="group btn btn-primary"
      >
        <span className="roll">
          <span>{label}</span>
          <span aria-hidden>{label}</span>
        </span>
        <span className="dot">
          <Arrow />
          <Arrow />
        </span>
      </button>
    </Magnetic>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="border-t border-line">
      {items.map((f, i) => {
        const on = open === i;
        return (
          <li key={f.q} className="border-b border-line">
            <h3>
              <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] tracking-[-0.01em] sm:text-[19px]">
                <span className={`transition-colors duration-300 ${on ? "text-ink" : "text-muted group-hover:text-ink"}`}>{f.q}</span>
                <span className={`relative grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${on ? "border-accent bg-accent text-white" : "border-line-2 text-muted"}`}>
                  <span className="absolute h-px w-3 bg-current" />
                  <span className={`absolute h-3 w-px bg-current transition-transform duration-500 ease-out-expo ${on ? "scale-y-0" : ""}`} />
                </span>
              </button>
            </h3>
            {/* odpowiedź zawsze w HTML (dla Google), zwinięta wizualnie */}
            <AnimatePresence initial={false}>
              <motion.div initial={false} animate={{ height: on ? "auto" : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                <p className="max-w-[640px] pb-7 text-[16px] leading-relaxed text-muted">{f.a}</p>
              </motion.div>
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
