"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "motion/react";
import { extras, plans } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";
import ScrollLink from "./figma/ScrollLink";

function Price({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => ref.current && (ref.current.textContent = Math.round(v).toLocaleString("pl-PL")),
    });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref}>0</span>;
}

function SelectionCorners() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 border border-fig-red"
      initial={{ opacity: 0, scale: 1.1 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((p) => (
        <span key={p} className={`absolute ${p} size-2 border border-fig-red bg-white`} />
      ))}
    </motion.span>
  );
}

function Diamond({ className = "" }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className={className} aria-hidden>
      <path d="M6 0l2.5 2.5L6 5 3.5 2.5zM6 7l2.5 2.5L6 12 3.5 9.5zM2.5 3.5L5 6 2.5 8.5 0 6zM9.5 3.5L12 6 9.5 8.5 7 6z" fill="currentColor" />
    </svg>
  );
}

export default function Services() {
  return (
    <section id="uslugi" className="relative mx-auto max-w-6xl px-5 py-28 sm:py-36">
      <SectionHeader
        index="03"
        frame="Usługi i ceny"
        align="center"
        title={
          <>
            Efekt wow <span className="font-serif font-normal italic">nie musi</span> kosztować fortuny.
          </>
        }
        lead="Przejrzyste pakiety, stała cena i zero ukrytych kosztów. Wybierz start, resztę dopasujemy razem."
      />

      {/* Duża cena z linijkami pomiaru jak w Figmie (Alt + hover) */}
      <motion.div
        className="relative mx-auto mb-20 flex w-fit flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="mb-2 font-mono text-xs text-muted">strona internetowa już od</span>
        <div className="relative px-6">
          <span className="font-display text-[clamp(5rem,20vw,11rem)] leading-none font-semibold tracking-[-0.06em]">
            <Price value={200} />
            <span className="ml-2 font-serif text-[0.45em] font-normal tracking-normal text-fig-coral italic">zł</span>
          </span>
          <SelectionCorners />
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded bg-fig-red px-1.5 py-px font-mono text-[10px] whitespace-nowrap text-white">
            stała cena · 0 ukrytych kosztów
          </span>
        </div>
      </motion.div>

      {/* Zestaw komponentów — fioletowa przerywana ramka */}
      <div className="relative rounded-3xl border border-dashed border-comp/60 p-3 sm:p-5">
        <span className="absolute -top-3 left-6 flex items-center gap-1.5 bg-canvas px-2 font-mono text-[11px] text-comp">
          <Diamond /> Pakiety
        </span>
        <div className="grid gap-3 sm:gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              className={`group relative flex flex-col rounded-2xl border p-6 transition-colors sm:p-8 ${
                p.featured ? "border-sel bg-gradient-to-b from-sel/15 to-panel" : "border-line bg-panel hover:border-white/20"
              }`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
            >
              {p.featured && (
                <span className="absolute -top-3 right-6 rounded-full bg-sel px-3 py-1 text-[11px] font-medium text-white">
                  Najczęściej wybierany
                </span>
              )}
              <div className="flex items-center gap-2 font-mono text-[11px] text-comp">
                <Diamond /> Pakiet={p.name}
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{p.name}</h3>
              <p className="text-sm text-muted">{p.note}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-sm text-muted">od</span>
                <span className="font-display text-5xl font-semibold tracking-tighter">
                  <Price value={p.price} />
                </span>
                <span className="text-lg text-muted">zł</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted">⏱ realizacja {p.time}</p>
              <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-6 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded ${p.featured ? "bg-sel" : "bg-white/10"}`}>
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                        <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <ScrollLink
                to="kontakt"
                className={`mt-8 block rounded-xl py-3.5 text-center text-sm font-medium transition-transform active:scale-95 ${
                  p.featured ? "bg-sel text-white hover:brightness-110" : "bg-white/[0.06] hover:bg-white/10"
                }`}
              >
                Wybieram {p.name}
              </ScrollLink>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="mb-4 font-mono text-xs text-muted">Dodatkowo realizuję</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {extras.map((e, i) => (
            <motion.li
              key={e}
              className="rounded-full border border-line bg-panel px-4 py-2 text-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              {e}
            </motion.li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-muted/70">Podane ceny są cenami startowymi — ostateczna kwota zależy od zakresu projektu.</p>
      </div>
    </section>
  );
}
