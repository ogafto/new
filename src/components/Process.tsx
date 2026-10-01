"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { steps } from "@/lib/site";
import { FadeUp, Heading } from "./ui/Reveal";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 60%"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="proces" className="relative overflow-hidden py-32 lg:py-44">
      {/* siatka linii + światło */}
      <div className="line-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_40%,#000,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-10">
        <div className="mb-20 flex flex-col justify-between gap-8 lg:mb-28 lg:flex-row lg:items-end">
          <div>
            <FadeUp>
              <p className="kicker">Proces</p>
            </FadeUp>
            <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.6rem)]" lines={["Od pomysłu", <span key="2" className="text-muted">do premiery</span>]} />
          </div>
          <FadeUp delay={0.1} className="max-w-[380px]">
            <p className="text-[17px] leading-relaxed text-muted">Cztery etapy, jeden cel — strona, która wygląda tak dobrze, jak dobra jest Twoja marka.</p>
          </FadeUp>
        </div>

        <div ref={ref} className="relative">
          {/* linia postępu z impulsem światła */}
          <div className="absolute top-0 left-0 hidden h-px w-full bg-line lg:block" aria-hidden>
            <motion.div className="absolute inset-0 origin-left bg-gradient-to-r from-accent/40 to-accent" style={{ scaleX: fill }} />
            <span className="absolute -top-px h-[3px] w-40 animate-[pulse-run_4s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,#d6caff,transparent)] blur-[1px]" />
          </div>

          <ol className="grid lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.li
                key={s.title}
                className="relative border-t border-line py-10 lg:border-t-0 lg:border-l lg:px-8 lg:pt-14 lg:pb-4 lg:first:border-l-0 lg:first:pl-0"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 1, ease }}
              >
                <span className="absolute top-[-4px] left-0 hidden size-[7px] rounded-full bg-accent shadow-[0_0_12px_rgb(139_108_255)] lg:block lg:left-[-4px] lg:first:left-0" aria-hidden />
                <span className="h-display block text-[64px] text-dim/60 tabular-nums">0{i + 1}</span>
                <h3 className="mt-8 text-[22px] font-normal tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-muted">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
      <style>{`@keyframes pulse-run { 0% { left: -10%; opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { left: 100%; opacity: 0 } }`}</style>
    </section>
  );
}
