"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "motion/react";
import { extras, included, plans } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";
import { Handles } from "./figma/SelectionBox";
import Button from "./ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

function Count({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, {
      duration: 1.6,
      ease,
      onUpdate: (v) => ref.current && (ref.current.textContent = Math.round(v).toString()),
    });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref}>0</span>;
}

export function selectPlan(name: string) {
  window.dispatchEvent(new CustomEvent("afto:plan", { detail: name }));
}

function Check({ on }: { on?: boolean }) {
  return (
    <span className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full ${on ? "bg-sel" : "bg-white/[0.08]"}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M2.2 5.2l1.8 1.8 3.8-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function Pricing() {
  return (
    <section id="cennik" className="relative overflow-hidden py-32 sm:py-40">
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-sel/10 blur-[140px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-5">
        <SectionHeader
          index="04"
          label="Cennik"
          align="center"
          title="Premium wygląd."
          accent="Uczciwa cena."
          lead="Stała cena ustalona przed startem. Zero ukrytych kosztów — wiesz dokładnie, za co płacisz."
        />

        {/* duża cena z zaznaczeniem jak w Figmie */}
        <motion.div
          className="mx-auto mt-16 mb-20 flex w-fit flex-col items-center"
          initial={{ opacity: 0, scale: 0.92, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, ease }}
        >
          <span className="mb-4 font-mono text-[11px] tracking-wide text-muted uppercase">Strona internetowa już od</span>
          <div className="relative px-5 sm:px-8">
            <span className="text-silver font-display text-[clamp(5.5rem,18vw,10.5rem)] leading-[0.9] font-medium tracking-[-0.07em]">
              <Count value={200} />
            </span>
            <span className="text-accent ml-2 font-serif text-[clamp(2.5rem,7vw,4.5rem)] italic">zł</span>
            <motion.span
              className="pointer-events-none absolute -inset-y-2 inset-x-0 border border-fig-red"
              initial={{ opacity: 0, scale: 1.08 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.6, ease }}
            >
              <Handles color="var(--color-fig-red)" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-[4px] bg-fig-red px-1.5 py-px font-mono text-[10px] whitespace-nowrap text-white">
                stała cena · 0 ukrytych kosztów
              </span>
            </motion.span>
          </div>
        </motion.div>

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              className={`relative flex flex-col rounded-[28px] p-7 sm:p-8 ${
                p.featured
                  ? "beam hairline bg-[linear-gradient(180deg,rgb(13_153_255/0.12),rgb(13_153_255/0.02)_40%,rgb(255_255_255/0.02))] shadow-[0_40px_100px_-30px_rgb(13_153_255/0.45)] lg:-my-4 lg:py-12"
                  : "hairline surface"
              }`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 1, ease }}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sel px-3 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-[0_8px_24px_-6px_rgb(13_153_255/0.8)]">
                  Najczęściej wybierany
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-medium tracking-[-0.02em]">{p.name}</h3>
                <span className="font-mono text-[10px] text-comp">◆ {p.note}</span>
              </div>

              <p className="mt-8 flex items-baseline gap-2">
                <span className="text-sm text-muted">od</span>
                <span className="font-display text-6xl font-medium tracking-[-0.06em]">
                  <Count value={p.price} />
                </span>
                <span className="text-lg text-muted">zł</span>
              </p>
              <p className="mt-2 font-mono text-[11px] text-muted">Realizacja: {p.time}</p>

              <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

              <ul className="flex-1 space-y-3 text-[15px]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check on={p.featured} />
                    <span className={p.featured ? "text-ink" : "text-ink/85"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                to="kontakt"
                size="lg"
                variant={p.featured ? "primary" : "ghost"}
                arrow
                onClick={() => selectPlan(p.name)}
                className="mt-9 w-full justify-between pl-6"
              >
                {`Wybieram ${p.name}`}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 flex flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="font-mono text-[11px] text-dim uppercase">W każdym pakiecie</span>
            {included.map((x) => (
              <span key={x} className="flex items-center gap-2">
                <Check />
                {x}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {extras.map((e) => (
              <span key={e} className="rounded-full bg-white/[0.04] px-4 py-2 text-[13px] text-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                + {e}
              </span>
            ))}
          </div>
          <p className="text-xs text-dim">Ceny są cenami startowymi — ostateczna kwota zależy od zakresu projektu.</p>
        </motion.div>
      </div>
    </section>
  );
}
