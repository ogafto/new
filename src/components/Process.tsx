"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { steps } from "@/lib/site";
import { Section } from "./ui/Line";

const ease = [0.76, 0, 0.24, 1] as const;

export default function Process() {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 75%", "end 55%"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [reached, setReached] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setReached(Math.min(steps.length, Math.floor(v * steps.length + 0.35))));

  return (
    <Section id="proces" index="03" label="Proces zamówienia">
      <div className="grid lg:grid-cols-4">
        <div className="border-line p-4 sm:p-6 lg:col-span-3 lg:border-r">
          <motion.h2
            className="display text-[clamp(3rem,8vw,7.5rem)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, ease }}
          >
            Od wiadomości
            <br />
            <span className="text-outline">do strony</span> w 10 dni
          </motion.h2>
        </div>
        <div className="flex items-end border-t border-line p-4 sm:p-6 lg:border-t-0">
          <p className="text-[17px] leading-relaxed text-muted">
            Bez stresu i technicznego żargonu. <span className="text-ink">Zawsze wiesz, na jakim etapie jesteśmy i ile to kosztuje.</span>
          </p>
        </div>
      </div>

      <div ref={track} className="relative grid border-t border-line lg:grid-cols-5">
        {/* linia postępu — pozioma na desktopie, pionowa na telefonie */}
        <motion.span className="absolute top-0 left-0 hidden h-[2px] w-full origin-left bg-accent lg:block" style={{ scaleX: scale }} aria-hidden />
        <motion.span className="absolute top-0 bottom-0 left-[27px] w-[2px] origin-top bg-accent sm:left-[35px] lg:hidden" style={{ scaleY: scale }} aria-hidden />

        {steps.map((s, i) => {
          const on = reached > i;
          return (
            <div key={s.title} className={`relative border-line py-8 pr-4 pl-14 sm:pr-6 sm:pl-16 lg:min-h-[380px] lg:p-6 lg:pt-12 ${i < steps.length - 1 ? "border-b lg:border-r lg:border-b-0" : ""}`}>
              {/* węzeł na linii */}
              <span
                className={`absolute top-9 left-[22px] size-3 border transition-colors duration-500 sm:left-[30px] lg:-top-[5px] lg:left-6 ${
                  on ? "border-accent bg-accent" : "border-line-strong bg-bg"
                }`}
                aria-hidden
              />
              <div className="flex items-baseline justify-between">
                <span className={`display text-[4.5rem] transition-colors duration-500 lg:text-[5.5rem] ${on ? "text-ink" : "text-outline [--stroke:var(--color-dim)]"}`}>0{i + 1}</span>
                <span className="label text-muted">{s.time}</span>
              </div>
              <h3 className="mt-6 font-display text-[22px] font-semibold tracking-[-0.01em] uppercase [font-stretch:85%] lg:mt-10">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
