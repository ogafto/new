"use client";

import { useEffect, useRef, useState } from "react";
import { content } from "@/lib/content";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { serviceName, type Project } from "@/lib/site";
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
const EXPAND = 0.8; // ile „ekranów” przewijania zajmuje rozrost ramki
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (x: number) => x * x * (3 - 2 * x);

// pozycja w pokazie: 0 … N-1 (ułamki = w trakcie przejścia)
const slideOf = (p: number, n: number) => Math.min(n - 1, Math.max(0, p * n - EXPAND));
const revealOf = (s: number, i: number) => (i === 0 ? 1 : smooth(clamp((s - (i - 1) - 0.2) / 0.6)));

// kolor z palety projektu → tło pokazu na telefonie (najbardziej nasycony = poświata)
const rgb = (hex: string) => {
  let h = hex.replace("#", "").slice(0, 6);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h.padEnd(6, "0"), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function backdrop(palette: string[]) {
  const cols = palette.filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)).map(rgb);
  const sat = (c: number[]) => Math.max(...c) - Math.min(...c);
  const glow = [...cols].sort((a, b) => sat(b) - sat(a))[0] ?? [139, 108, 255];
  const base = cols[0] ?? [20, 18, 28];
  const second = cols.find((c) => c !== glow && sat(c) > 40) ?? glow;
  const a = (c: number[], o: number) => `rgb(${c.join(" ")} / ${o})`;
  return {
    glow: a(glow, 0.45),
    background: `radial-gradient(80% 42% at 50% 40%, ${a(glow, 0.32)}, transparent 72%), radial-gradient(70% 35% at 85% 95%, ${a(second, 0.16)}, transparent 70%), linear-gradient(180deg, ${a(base, 0.6)} 0%, rgb(7 7 10) 88%)`,
  };
}

// ekran pionowy: obszar na kartę projektu (między licznikiem u góry a opisem u dołu)
const STAGE = { top: 136, bottom: 280, side: 20 };
function cardRect(w: number, h: number) {
  const sh = Math.max(120, h - STAGE.top - STAGE.bottom);
  const cw = Math.min(w - STAGE.side * 2, (sh * 4) / 3);
  const ch = cw * 0.75;
  const top = STAGE.top + (sh - ch) / 2;
  return { t: (top / h) * 100, b: ((h - top - ch) / h) * 100, x: ((w - cw) / 2 / w) * 100 };
}

function Layer({ p, i, n, progress }: { p: Project; i: number; n: number; progress: MotionValue<number> }) {
  const reveal = useTransform(progress, (v) => revealOf(slideOf(v, n), i));
  const covered = useTransform(progress, (v) => (i < n - 1 ? revealOf(slideOf(v, n), i + 1) : 0));
  const clip = useTransform(reveal, (r) => `inset(${(1 - r) * 100}% 0% 0% 0%)`);
  // wejście: zdjęcie dojeżdża z dołu i z przybliżenia; przykrywane: oddala się i ciemnieje
  const y = useTransform(reveal, (r) => `${(1 - r) * 18}%`);
  const scale = useTransform([reveal, covered] as MotionValue<number>[], ([r, c]: number[]) => 1 + (1 - r) * 0.18 + c * 0.08);
  const shade = useTransform(covered, (c) => c * 0.65);
  // telefon: karta wjeżdża z dołu, przechylona w 3D, i prostuje się; przykryta — cofa się w głąb
  const cardY = useTransform([reveal, covered] as MotionValue<number>[], ([r, c]: number[]) => `${(1 - r) * 55 - c * 14}%`);
  const cardTilt = useTransform(reveal, (r) => (1 - r) * 28);
  const cardScale = useTransform([reveal, covered] as MotionValue<number>[], ([r, c]: number[]) => 0.9 + r * 0.1 - c * 0.1);
  const alt = `${p.name} — ${serviceName(p.category).toLowerCase()} dla: ${p.client}`;
  const bg = backdrop(p.palette);
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath: clip, zIndex: i }}>
      {/* ekran poziomy: zdjęcie na cały kadr */}
      <motion.div className="absolute inset-0 hidden landscape:block" style={{ y, scale }}>
        <Image src={p.image} alt={alt} fill sizes="100vw" className="object-cover object-top" loading={i === 0 ? "eager" : "lazy"} />
      </motion.div>

      {/* ekran pionowy (telefon, tablet): cały projekt jako karta na tle w kolorach marki */}
      <div className="absolute inset-0 landscape:hidden" style={{ background: bg.background }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:calc((100%-40px)/4)_100%] bg-[position:20px_0] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
        <div className="absolute grid place-items-center [container-type:size] [perspective:1100px]" style={{ top: STAGE.top, bottom: STAGE.bottom, left: STAGE.side, right: STAGE.side }}>
          <motion.div
            className="relative aspect-[4/3] w-[min(100cqw,133.33cqh)] overflow-hidden rounded-[18px] ring-1 ring-white/15"
            style={{ y: cardY, rotateX: cardTilt, scale: cardScale, transformOrigin: "50% 100%", boxShadow: `0 40px 90px -30px ${bg.glow}, 0 20px 40px -20px rgb(0 0 0 / 0.8)` }}
          >
            <Image src={p.image} alt="" fill sizes="100vw" className="object-cover object-top" loading={i === 0 ? "eager" : "lazy"} />
            <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(160deg,rgb(255_255_255/0.14),transparent_35%)]" />
          </motion.div>
        </div>
      </div>

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

export default function Work({ projects }: { projects: Project[] }) {
  const featured = projects.filter((p) => (p as { featured?: boolean }).featured !== false);
  const list = (featured.length ? featured : projects).slice(0, FEATURED);
  const N = list.length;
  const wrap = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [current, setCurrent] = useState(0);
  const narrow = useMotionValue(0);
  const boxT = useMotionValue(30);
  const boxB = useMotionValue(30);
  const boxX = useMotionValue(12);
  const wordShift = useMotionValue(0);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const on = () => {
      narrow.set(mq.matches ? 1 : 0);
      const r = cardRect(window.innerWidth, window.innerHeight);
      boxT.set(r.t);
      boxB.set(r.b);
      boxX.set(r.x);
      // napis „Portfolio” na środku karty, nie ekranu
      wordShift.set(mq.matches ? ((r.t + (100 - r.t - r.b) / 2 - 50) / 100) * window.innerHeight : 0);
    };
    on();
    mq.addEventListener("change", on);
    window.addEventListener("resize", on);
    return () => {
      mq.removeEventListener("change", on);
      window.removeEventListener("resize", on);
    };
  }, [narrow, boxT, boxB, boxX, wordShift]);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const expand = useTransform(scrollYProgress, (v) => smooth(clamp((v * N) / EXPAND)));
  const frame = useTransform([expand, narrow, boxT, boxB, boxX] as MotionValue<number>[], ([e, n, bt, bb, bx]: number[]) => {
    const [t, b, x] = n ? [bt, bb, bx] : [27, 27, 33];
    const [et, ex] = n ? [0, 0] : [1.2, 0.9];
    const r = n ? 18 * (1 - e) : 32 - e * 8;
    return `inset(${t * (1 - e) + et * e}% ${x * (1 - e) + ex * e}% ${b * (1 - e) + et * e}% ${x * (1 - e) + ex * e}% round ${r}px)`;
  });
  const wordScale = useTransform(expand, [0, 1], [1, 0.86]);
  const wordOpacity = useTransform(expand, [0, 0.7], [1, 0]);
  const ui = useTransform(scrollYProgress, (v) => clamp((v * N - EXPAND * 0.7) / 0.3));

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const s = slideOf(v, N);
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
              <Layer key={proj.slug} p={proj} i={i} n={N} progress={scrollYProgress} />
            ))}

            {/* cały kadr prowadzi do projektu */}
            <TLink href={`/portfolio/${p.slug}`} label={p.name} className="absolute inset-0 z-20" aria-label={`Zobacz projekt ${p.name}`} tabIndex={-1} />

            <motion.div className="pointer-events-none absolute inset-0 z-30" style={{ opacity: ui }}>
              <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-bg/75 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[65%] bg-[linear-gradient(to_top,rgb(7_7_10/0.96),rgb(7_7_10/0.75)_30%,rgb(7_7_10/0.3)_65%,transparent)]" />

              {/* góra */}
              <div className="absolute inset-x-5 top-24 flex items-start justify-between sm:inset-x-10 sm:top-28">
                <p className="text-[13px] text-white/70">{content().texts.work.label}</p>
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
                    <span>{content().texts.work.view}</span>
                    <span aria-hidden>{content().texts.work.view}</span>
                  </span>
                  <span className="grid size-11 place-items-center rounded-full bg-accent text-white transition-transform duration-700 ease-out-expo group-hover:rotate-45">
                    <Arrow className="size-4" />
                  </span>
                </TLink>
              </div>

              {/* pasek postępu */}
              <div className="pointer-events-auto absolute top-1/2 right-5 hidden -translate-y-1/2 flex-col gap-2 sm:right-10 md:landscape:flex" role="tablist" aria-label="Projekty">
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
          <motion.div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center mix-blend-difference" style={{ scale: wordScale, opacity: wordOpacity, y: wordShift }}>
            <h2 id="portfolio-title" className="h-display text-[clamp(4.5rem,21vw,22rem)] leading-[0.8] tracking-[-0.06em] text-white">
              {content().texts.work.label}
            </h2>
            <p className="mt-6 hidden text-[14px] text-white/70 landscape:block">Wybrane projekty · 0{N}</p>
          </motion.div>
        </div>
      </div>

      {/* całe portfolio */}
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 px-5 pt-16 pb-8 sm:flex-row sm:items-center sm:px-10">
        <p className="max-w-md text-[17px] leading-relaxed text-muted">{content().texts.work.text}</p>
        <TLink href="/portfolio" label="Portfolio" className="group flex items-center gap-4 text-[clamp(1.4rem,2.4vw,2rem)] tracking-[-0.02em]">
          <span className="link-u">{content().texts.work.more}</span>
          <span className="text-[14px] text-dim">{projects.length}</span>
          <span className="grid size-12 place-items-center rounded-full border border-line-2 transition-all duration-700 ease-out-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-ink group-hover:text-bg">
            <Arrow className="size-4" />
          </span>
        </TLink>
      </div>
    </section>
  );
}
