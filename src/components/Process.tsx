"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { steps } from "@/lib/site";
import { FadeUp, Heading } from "./ui/Reveal";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Process() {
  const track = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 80%", "end 60%"] });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [reached, setReached] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setReached(Math.min(steps.length, Math.floor(v * steps.length + 0.4))));

  return (
    <section id="proces" className="relative border-y border-line bg-surface/40">
      <div className="mx-auto max-w-[1320px] px-5 py-28 sm:px-8 lg:py-36">
        <div className="mb-16 flex flex-col justify-between gap-8 lg:mb-20 lg:flex-row lg:items-end">
          <div>
            <FadeUp>
              <p className="eyebrow">Proces zamówienia</p>
            </FadeUp>
            <Heading className="mt-6 text-[clamp(2.6rem,5.6vw,5.2rem)]" lines={["Od wiadomości", <span key="2" className="text-muted">do gotowej strony.</span>]} />
          </div>
          <FadeUp delay={0.15} className="lg:max-w-[400px]">
            <p className="text-[17px] leading-relaxed text-muted">
              Prosto i przejrzyście. <span className="text-ink">Zawsze wiesz, na jakim etapie jesteśmy, ile to kosztuje i kiedy będzie gotowe.</span>
            </p>
          </FadeUp>
        </div>

        <ol ref={track} className="relative grid gap-4 lg:grid-cols-5">
          {/* linia łącząca numery */}
          <span className="absolute top-[56px] right-[calc(20%-69px)] left-[56px] hidden h-px bg-line-2 lg:block" aria-hidden>
            <motion.span className="absolute inset-0 origin-left bg-accent" style={{ scaleX: progress }} />
          </span>
          <span className="absolute top-8 bottom-8 left-[51px] w-px bg-line-2 lg:hidden" aria-hidden>
            <motion.span className="absolute inset-0 origin-top bg-accent" style={{ scaleY: progress }} />
          </span>

          {steps.map((s, i) => {
            const on = reached > i;
            return (
              <motion.li
                key={s.title}
                className="relative flex gap-5 rounded-[24px] border border-line bg-bg p-6 lg:flex-col lg:gap-0 lg:p-7"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.9, ease }}
              >
                <span
                  className={`relative z-10 grid size-14 shrink-0 place-items-center rounded-full border font-display text-[18px] transition-all duration-500 ${
                    on ? "border-accent bg-accent text-white shadow-[0_8px_24px_-8px_rgb(74_99_255/0.9)]" : "border-line-2 bg-surface text-muted"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="lg:mt-10">
                  <p className="text-[13px] text-dim">{s.time}</p>
                  <h3 className="h-display mt-1.5 text-[22px] tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.text}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
