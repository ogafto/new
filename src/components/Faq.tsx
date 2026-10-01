"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { faq } from "@/lib/site";
import { FadeUp, Heading } from "./ui/Reveal";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative mx-auto max-w-[1400px] px-5 py-28 sm:px-10 lg:py-36">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <FadeUp>
            <p className="kicker">FAQ</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.6rem,5vw,4.8rem)]" lines={["Częste", <span key="2" className="text-muted">pytania</span>]} />
        </div>

        <ul className="border-t border-line">
          {faq.map((f, i) => {
            const on = open === i;
            return (
              <motion.li
                key={f.q}
                className="border-b border-line"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04, duration: 1, ease }}
              >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(on ? null : i)}
                      aria-expanded={on}
                      aria-controls={`faq-${i}`}
                      className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[18px] tracking-[-0.01em] sm:text-[20px]"
                    >
                      <span className={`transition-colors duration-300 ${on ? "text-ink" : "text-muted group-hover:text-ink"}`}>{f.q}</span>
                      <span className={`relative grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${on ? "border-accent bg-accent text-white" : "border-line-2 text-muted"}`}>
                        <span className="absolute h-px w-3 bg-current" />
                        <span className={`absolute h-3 w-px bg-current transition-transform duration-500 ease-out-expo ${on ? "scale-y-0" : ""}`} />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.55, ease }} className="overflow-hidden">
                        <p className="max-w-[640px] pb-7 text-[16px] leading-relaxed text-muted">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
