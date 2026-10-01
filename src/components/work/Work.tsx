"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { projects, serviceName, type Project } from "@/lib/site";
import { TLink } from "../Transition";
import { Arrow } from "../ui/Button";

/*
 * Portfolio jako „kinowy” pokaz sterowany przewijaniem:
 * 1) mała ramka rośnie do pełnego ekranu, przykrywając napis „Portfolio”,
 * 2) każdy kolejny projekt odsłania się od dołu na poprzednim (który lekko się oddala i ciemnieje),
 * 3) nazwa projektu i licznik przewijają się jak na tablicy.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const FEATURED = 6;
const list = projects.slice(0, FEATURED);
const N = list.length;
const EXPAND = 0.8; // ile „ekranów” przewijania zajmuje rozrost ramki
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (x: number) => x * x * (3 - 2 * x);

// pozycja w pokazie: 0 … N-1 (ułamki = w trakcie przejścia)
const slideOf = (p: number) => Math.min(N - 1, Math.max(0, p * N - EXPAND));
const revealOf = (s: number, i: number) => (i === 0 ? 1 : smooth(clamp((s - (i - 1) - 0.2) / 0.6)));

function Layer({ p, i, progress }: { p: Project; i: number; progress: MotionValue<number> }) {
  const reveal = useTransform(progress, (v) => revealOf(slideOf(v), i));
  const covered = useTransform(progress, (v) => (i < N - 1 ? revealOf(slideOf(v), i + 1) : 0));
  const clip = useTransform(reveal, (r) => `inset(${(1 - r) * 100}% 0% 0% 0%)`);
  // wejście: zdjęcie dojeżdża z dołu i z przybliżenia; przykrywane: oddala się i ciemnieje
  const y = useTransform(reveal, (r) => `${(1 - r) * 18}%`);
  const scale = useTransform([reveal, covered] as MotionValue<number>[], ([r, c]: number[]) => 1 + (1 - r) * 0.18 + c * 0.08);
  const shade = useTransform(covered, (c) => c * 0.65);
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath: clip, zIndex: i }}>
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image src={p.image} alt={`${p.name} — ${serviceName(p.category).toLowerCase()} dla: ${p.client}`} fill sizes="100vw" className="object-cover object-top" priority={i === 0} />
      </motion.div>
      <motion.div className="absolute inset-0 bg-bg" style={{ opacity: shade }} />
    </motion.div>
  );
}

function Roll({ k, children, className = "", delay = 0 }: { k: string | number; children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={k}
          className="block"
          initial={{ y: "105%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-105%" }}
          transition={{ duration: 0.9, delay, ease }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Work() {
  const wrap = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [current, setCurrent] = useState(0);
  const narrow = useMotionValue(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => narrow.set(mq.matches ? 1 : 0);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [narrow]);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const expand = useTransform(scrollYProgress, (v) => smooth(clamp((v * N) / EXPAND)));
  const frame = useTransform([expand, narrow] as MotionValue<number>[], ([e, n]: number[]) => {
    const [t, x] = n ? [30, 12] : [27, 33];
    const r = 32 - e * 8;
    return `inset(${t * (1 - e) + 1.2 * e}% ${x * (1 - e) + 0.9 * e}% ${t * (1 - e) + 1.2 * e}% ${x * (1 - e) + 0.9 * e}% round ${r}px)`;
  });
  const wordScale = useTransform(expand, [0, 1], [1, 0.86]);
  const wordOpacity = useTransform(expand, [0, 0.7], [1, 0]);
  const ui = useTransform(scrollYProgress, (v) => clamp((v * N - EXPAND * 0.7) / 0.3));

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const s = slideOf(v);
    let idx = 0;
    for (let i = 1; i < N; i++) if (revealOf(s, i) > 0.5) idx = i;
    setCurrent(idx);
  });

  // kliknięcie w pasek postępu → przewiń do projektu
  const jump = (i: number) => {
    const el = wrap.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const v = (EXPAND + Math.max(0, i - 1) + (i ? 0.85 : 0)) / N;
    lenis?.scrollTo(el.offsetTop + total * v, { duration: 1.4 });
  };

  const p = list[current];

  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="relative">
      <div ref={wrap} className="relative" style={{ height: `${(N + 1) * 100}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">

          <motion.div className="absolute inset-0 bg-surface" style={{ clipPath: frame }}>
            {list.map((proj, i) => (
              <Layer key={proj.slug} p={proj} i={i} progress={scrollYProgress} />
            ))}

            {/* cały kadr prowadzi do projektu */}
            <TLink href={`/portfolio/${p.slug}`} label={p.name} className="absolute inset-0 z-20" aria-label={`Zobacz projekt ${p.name}`} tabIndex={-1} />

            <motion.div className="pointer-events-none absolute inset-0 z-30" style={{ opacity: ui }}>
              <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-bg/75 to-transparent" />
              {/* stopniowe rozmycie pod nazwą projektu — czytelnie na każdym zdjęciu */}
              <div className="absolute inset-x-0 bottom-0 h-[50%] backdrop-blur-2xl [mask-image:linear-gradient(to_top,#000_35%,transparent)]" />
              <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-bg/90 via-bg/45 to-transparent" />

              {/* góra */}
              <div className="absolute inset-x-5 top-24 flex items-start justify-between sm:inset-x-10 sm:top-28">
                <p className="text-[13px] text-white/70">Portfolio</p>
                <p className="flex items-baseline gap-1.5 text-[13px] text-white/70 tabular-nums">
                  <Roll k={current} className="text-white">
                    0{current + 1}
                  </Roll>
                  / 0{N}
                </p>
              </div>

              {/* dół */}
              <div className="absolute inset-x-5 bottom-8 flex flex-col gap-6 sm:inset-x-10 sm:bottom-12 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <Roll k={`c-${current}`} className="text-[14px] text-accent-2">
                    {serviceName(p.category)}
                  </Roll>
                  <h3 className="h-display mt-3 text-[clamp(3rem,9vw,9rem)] text-white">
                    <Roll k={`n-${current}`} className="pb-[0.12em] -mb-[0.12em]" delay={0.04}>
                      {p.name}
                    </Roll>
                  </h3>
                  <Roll k={`m-${current}`} className="mt-3 text-[15px] text-white/60" delay={0.08}>
                    {p.client} · {p.year}
                  </Roll>
                </div>

                <TLink
                  href={`/portfolio/${p.slug}`}
                  label={p.name}
                  className="group pointer-events-auto flex shrink-0 items-center gap-4 self-start rounded-full bg-white py-2 pr-2 pl-6 text-[15px] font-medium text-bg md:self-auto"
                >
                  <span className="roll">
                    <span>Zobacz projekt</span>
                    <span aria-hidden>Zobacz projekt</span>
                  </span>
                  <span className="grid size-11 place-items-center rounded-full bg-accent text-white transition-transform duration-700 ease-out-expo group-hover:rotate-45">
                    <Arrow className="size-4" />
                  </span>
                </TLink>
              </div>

              {/* pasek postępu */}
              <div className="pointer-events-auto absolute top-1/2 right-5 hidden -translate-y-1/2 flex-col gap-2 sm:right-10 md:flex" role="tablist" aria-label="Projekty">
                {list.map((proj, i) => (
                  <button
                    key={proj.slug}
                    type="button"
                    role="tab"
                    aria-selected={i === current}
                    aria-label={proj.name}
                    onClick={() => jump(i)}
                    className="group flex items-center justify-end gap-3 py-1"
                  >
                    <span className={`text-[12px] transition-all duration-500 ${i === current ? "text-white opacity-100" : "translate-x-2 text-white/50 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}>{proj.name}</span>
                    <span className={`block h-px transition-all duration-700 ease-out-expo ${i === current ? "w-10 bg-white" : "w-5 bg-white/35 group-hover:w-7 group-hover:bg-white/70"}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* napis nad ramką (odwrócone kolory) — znika, gdy ramka wypełnia ekran */}
          <motion.div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center mix-blend-difference" style={{ scale: wordScale, opacity: wordOpacity }}>
            <h2 id="portfolio-title" className="h-display text-[clamp(4.5rem,21vw,22rem)] leading-[0.8] tracking-[-0.06em] text-white">
              Portfolio
            </h2>
            <p className="mt-6 text-[14px] text-white/70">Wybrane projekty · 0{N}</p>
          </motion.div>
        </div>
      </div>

      {/* całe portfolio */}
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 px-5 pt-16 pb-8 sm:flex-row sm:items-center sm:px-10">
        <p className="max-w-md text-[17px] leading-relaxed text-muted">Strony, sklepy, identyfikacje i projekty UI/UX — każdy zaprojektowany od zera, pod konkretny cel.</p>
        <TLink href="/portfolio" label="Portfolio" className="group flex items-center gap-4 text-[clamp(1.4rem,2.4vw,2rem)] tracking-[-0.02em]">
          <span className="link-u">Całe portfolio</span>
          <span className="text-[14px] text-dim">{projects.length}</span>
          <span className="grid size-12 place-items-center rounded-full border border-line-2 transition-all duration-700 ease-out-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-ink group-hover:text-bg">
            <Arrow className="size-4" />
          </span>
        </TLink>
      </div>
    </section>
  );
}
