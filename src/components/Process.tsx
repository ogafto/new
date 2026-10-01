"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationFrame, useInView, useMotionValue } from "motion/react";
import { steps } from "@/lib/site";
import { FadeUp, Heading } from "./ui/Reveal";
import { DesignScene, DirectionScene, LaunchScene, TalkScene } from "./process/Scenes";

const ease = [0.16, 1, 0.3, 1] as const;
const DURATION = 7.5; // sekundy na etap
const scenes = [TalkScene, DirectionScene, DesignScene, LaunchScene];
const windowTitles = ["Rozmowa · brief", "Moodboard · kierunek", "Figma · projekt", "Wdrożenie · publikacja"];

export default function Process() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px -20% 0px" });
  const progress = useMotionValue(0);

  // automatyczne przełączanie etapów, gdy sekcja jest widoczna
  useAnimationFrame((_, delta) => {
    if (!inView || paused) return;
    const next = progress.get() + Math.min(delta, 50) / 1000 / DURATION;
    if (next >= 1) {
      progress.set(0);
      setActive((a) => (a + 1) % steps.length);
    } else progress.set(next);
  });

  const select = (i: number) => {
    progress.set(0);
    setActive(i);
  };

  const Scene = scenes[active];
  const step = steps[active];

  return (
    <section id="proces" className="relative overflow-clip py-32 lg:py-40">
      <div className="pointer-events-none absolute top-1/3 right-[-10%] size-[700px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.1),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-10">
        <div className="mb-14 flex flex-col justify-between gap-8 lg:mb-20 lg:flex-row lg:items-end">
          <div>
            <FadeUp>
              <p className="kicker">Proces</p>
            </FadeUp>
            <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.4rem)]" lines={["Od rozmowy", <span key="2" className="text-muted">do premiery</span>]} />
          </div>
          <FadeUp delay={0.1}>
            <p className="max-w-[380px] text-[17px] leading-relaxed text-muted">Cztery etapy. Na każdym wiesz, co się dzieje, co widzisz i co będzie dalej.</p>
          </FadeUp>
        </div>

        <div ref={ref} className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          {/* lista etapów (desktop) */}
          <ol className="hidden flex-col lg:flex">
            {steps.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.title} className="border-t border-line last:border-b">
                  <button type="button" onClick={() => select(i)} aria-expanded={on} className="group relative w-full py-6 text-left">
                    <span className="flex items-baseline gap-5">
                      <span className={`w-7 text-[13px] tabular-nums transition-colors duration-500 ${on ? "text-accent-2" : "text-dim"}`}>0{i + 1}</span>
                      <span className={`text-[28px] font-medium tracking-[-0.03em] transition-colors duration-500 ${on ? "text-ink" : "text-dim group-hover:text-muted"}`}>{s.title}</span>
                    </span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.6, ease }} className="overflow-hidden">
                          <div className="pt-4 pl-12">
                            <p className="text-[16px] text-ink">{s.lead}</p>
                            <p className="mt-2 max-w-[440px] text-[15px] leading-relaxed text-muted">{s.text}</p>
                            <ul className="mt-5 flex flex-wrap gap-2">
                              {s.points.map((p, k) => (
                                <motion.li
                                  key={p}
                                  className="rounded-full border border-line-2 px-3 py-1 text-[13px] text-muted"
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 + k * 0.06, duration: 0.5, ease }}
                                >
                                  {p}
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* pasek postępu etapu */}
                    {on && (
                      <span className="absolute inset-x-0 -top-px h-px">
                        <motion.span className="block h-full origin-left bg-accent" style={{ scaleX: progress }} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* przełącznik (mobile) */}
          <div className="grid grid-cols-4 gap-1 rounded-full border border-line p-1 lg:hidden" role="tablist">
            {steps.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => select(i)}
                className={`relative h-10 overflow-hidden rounded-full text-[12.5px] transition-colors sm:text-[14px] ${i === active ? "text-ink" : "text-dim"}`}
              >
                {i === active && (
                  <motion.span layoutId="process-tab" className="absolute inset-0 overflow-hidden rounded-full bg-white/[0.07]" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
                    <motion.span className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent" style={{ scaleX: progress }} />
                  </motion.span>
                )}
                <span className="relative">{s.title}</span>
              </button>
            ))}
          </div>

          {/* okno z animacją etapu */}
          <motion.div
            className="edge relative overflow-hidden rounded-[28px] bg-surface"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.1, ease }}
            onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
            onPointerLeave={() => setPaused(false)}
          >
            <div className="pointer-events-none absolute -top-32 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" aria-hidden />
            <div className="relative flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="flex gap-1.5">
                {[0, 1, 2].map((k) => (
                  <span key={k} className="size-2.5 rounded-full bg-white/10" />
                ))}
              </span>
              <AnimatePresence mode="wait">
                <motion.span key={active} className="text-[12.5px] text-muted" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                  {windowTitles[active]}
                </motion.span>
              </AnimatePresence>
              <span className="text-[12px] text-dim tabular-nums">
                0{active + 1} / 0{steps.length}
              </span>
            </div>
            <div className="relative h-[420px] sm:h-[460px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  className="absolute inset-0"
                  initial={{ opacity: 0, filter: "blur(8px)", scale: 0.98 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
                  transition={{ duration: 0.5, ease }}
                >
                  <Scene />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* opis (mobile) */}
          <AnimatePresence mode="wait">
            <motion.div key={active} className="lg:hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <p className="text-[18px] text-ink">{step.lead}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {step.points.map((p) => (
                  <li key={p} className="rounded-full border border-line-2 px-3 py-1 text-[13px] text-muted">
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
