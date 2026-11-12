"use client";

import { useEffect, useRef, useState } from "react";
import Media from "../ui/Media";
import { isVideo } from "@/lib/media";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { copy } from "@/lib/site";
import { plural } from "@/lib/format";
import { TLink } from "../Transition";
import { Arrow } from "../ui/Button";

/*
 * Portfolio jako „kinowy” pokaz kategorii sterowany przewijaniem:
 * 1) mała ramka rośnie do pełnego ekranu, przykrywając napis „Portfolio”,
 * 2) każda kolejna kategoria odsłania się od dołu na poprzedniej (która lekko się oddala i ciemnieje),
 * 3) nazwa kategorii i licznik przewijają się jak na tablicy.
 * Kliknięcie w kadr otwiera kategorię.
 */

export type ShowCategory = { id: string; slug: string; name: string; description: string; image: string; count: number };

const ease = [0.16, 1, 0.3, 1] as const;
const EXPAND = 0.8; // ile „ekranów” przewijania zajmuje rozrost ramki
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const pad = (n: number) => String(n).padStart(2, "0");
export const works = (n: number) => `${n} ${plural(n, "praca", "prace", "prac")}`;

// pozycja w pokazie: 0 … N-1 (ułamki = w trakcie przejścia)
const slideOf = (p: number, n: number) => Math.min(n - 1, Math.max(0, p * n - EXPAND));
const revealOf = (s: number, i: number) => (i === 0 ? 1 : smooth(clamp((s - (i - 1) - 0.2) / 0.6)));

// ekran pionowy: obszar na kartę (między licznikiem u góry a opisem u dołu)
const STAGE = { top: 136, bottom: 280, side: 20 };
function cardRect(w: number, h: number) {
  const sh = Math.max(120, h - STAGE.top - STAGE.bottom);
  const cw = Math.min(w - STAGE.side * 2, (sh * 4) / 3);
  const ch = cw * 0.75;
  const top = STAGE.top + (sh - ch) / 2;
  return { t: (top / h) * 100, b: ((h - top - ch) / h) * 100, x: ((w - cw) / 2 / w) * 100 };
}

// zdjęcia warstwy ładują się dopiero, gdy pokaz jest blisko niej (przy wielu kategoriach nie ściągamy wszystkiego naraz);
// raz wczytane zostają, żeby przewijanie w górę nie mrugało
function Layer({ c, i, n, progress, near }: { c: ShowCategory; i: number; n: number; progress: MotionValue<number>; near: boolean }) {
  const [on, setOn] = useState(near);
  useEffect(() => {
    if (!near || on) return;
    const t = setTimeout(() => setOn(true), 0);
    return () => clearTimeout(t);
  }, [near, on]);
  const reveal = useTransform(progress, (v) => revealOf(slideOf(v, n), i));
  const covered = useTransform(progress, (v) => (i < n - 1 ? revealOf(slideOf(v, n), i + 1) : 0));
  const clip = useTransform(reveal, (r) => `inset(${(1 - r) * 100}% 0% 0% 0%)`);
  // wejście: zdjęcie dojeżdża z dołu i z przybliżenia; przykrywane: oddala się i ciemnieje
  const y = useTransform(reveal, (r) => `${(1 - r) * 18}%`);
  const scale = useTransform([reveal, covered] as MotionValue<number>[], ([r, k]: number[]) => 1 + (1 - r) * 0.18 + k * 0.08);
  const shade = useTransform(covered, (k) => k * 0.65);
  // telefon: karta wjeżdża z dołu, przechylona w 3D, i prostuje się; przykryta — cofa się w głąb
  const cardY = useTransform([reveal, covered] as MotionValue<number>[], ([r, k]: number[]) => `${(1 - r) * 55 - k * 14}%`);
  const cardTilt = useTransform(reveal, (r) => (1 - r) * 28);
  const cardScale = useTransform([reveal, covered] as MotionValue<number>[], ([r, k]: number[]) => 0.9 + r * 0.1 - k * 0.1);
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath: clip, zIndex: i }}>
      {/* ekran poziomy: okładka na cały kadr */}
      <motion.div className="absolute inset-0 hidden landscape:block" style={{ y, scale }}>
        {on && <Media src={c.image} alt={`${c.name}: portfolio`} fill sizes="100vw" className="object-cover" loading={i === 0 ? "eager" : "lazy"} />}
      </motion.div>

      {/* ekran pionowy (telefon, tablet): okładka jako karta na rozmytym tle z niej samej */}
      <div className="absolute inset-0 overflow-hidden bg-bg landscape:hidden">
        {on && !isVideo(c.image) && <Media src={c.image} fill sizes="40vw" className="scale-125 object-cover opacity-45 blur-3xl saturate-150" />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(7_7_10/0.2),rgb(7_7_10/0.9)_85%)]" />
        <div className="absolute grid place-items-center [container-type:size] [perspective:1100px]" style={{ top: STAGE.top, bottom: STAGE.bottom, left: STAGE.side, right: STAGE.side }}>
          <motion.div
            className="relative aspect-[4/3] w-[min(100cqw,133.33cqh)] overflow-hidden rounded-[18px] ring-1 ring-white/15"
            style={{ y: cardY, rotateX: cardTilt, scale: cardScale, transformOrigin: "50% 100%", boxShadow: "0 40px 90px -30px rgb(139 108 255 / 0.45), 0 20px 40px -20px rgb(0 0 0 / 0.8)" }}
          >
            {on && <Media src={c.image} alt={`${c.name}: portfolio`} fill sizes="100vw" className="object-cover" loading={i === 0 ? "eager" : "lazy"} />}
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
        <motion.span key={k} className="block" initial={{ y: "105%" }} animate={{ y: "0%" }} exit={{ y: "-105%" }} transition={{ duration: 0.9, delay, ease }}>
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Showcase({ categories }: { categories: ShowCategory[] }) {
  const list = categories; // wszystkie kategorie: każda to jeden „ekran” przewijania
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
  const expand = useTransform(scrollYProgress, (v) => smooth(clamp((v * Math.max(N, 1)) / EXPAND)));
  const frame = useTransform([expand, narrow, boxT, boxB, boxX] as MotionValue<number>[], ([e, n, bt, bb, bx]: number[]) => {
    const [t, b, x] = n ? [bt, bb, bx] : [27, 27, 33];
    const [et, ex] = n ? [0, 0] : [1.2, 0.9];
    const r = n ? 18 * (1 - e) : 32 - e * 8;
    return `inset(${t * (1 - e) + et * e}% ${x * (1 - e) + ex * e}% ${b * (1 - e) + et * e}% ${x * (1 - e) + ex * e}% round ${r}px)`;
  });
  const wordScale = useTransform(expand, [0, 1], [1, 0.86]);
  const wordOpacity = useTransform(expand, [0, 0.7], [1, 0]);
  const ui = useTransform(scrollYProgress, (v) => clamp((v * Math.max(N, 1) - EXPAND * 0.7) / 0.3));

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const s = slideOf(v, N);
    let idx = 0;
    for (let i = 1; i < N; i++) if (revealOf(s, i) > 0.5) idx = i;
    setCurrent(idx);
  });

  // kliknięcie w pasek postępu → przewiń do kategorii
  const jump = (i: number) => {
    const el = wrap.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const v = (EXPAND + Math.max(0, i - 1) + (i ? 0.85 : 0)) / N;
    lenis?.scrollTo(el.offsetTop + total * v, { duration: 1.4 });
  };

  if (!N)
    return (
      <section id="portfolio" className="mx-auto grid min-h-[60svh] max-w-[1400px] place-items-center px-5 py-32 text-center sm:px-10">
        <div>
          <h2 className="h-display text-[clamp(3rem,10vw,8rem)]">{copy.work.label}</h2>
          <p className="mt-4 text-[17px] text-muted">Nowe prace już niedługo.</p>
        </div>
      </section>
    );

  const c = list[current];

  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="relative">
      <div ref={wrap} className="relative" style={{ height: `${(N + 1) * 100}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <motion.div className="absolute inset-0 bg-surface" style={{ clipPath: frame }}>
            {list.map((cat, i) => (
              <Layer key={cat.id} c={cat} i={i} n={N} progress={scrollYProgress} near={i >= current - 1 && i <= current + 2} />
            ))}

            {/* cały kadr prowadzi do kategorii */}
            <TLink href={`/portfolio/${c.slug}`} label={c.name} className="absolute inset-0 z-20" aria-label={`${copy.work.open}: ${c.name}`} tabIndex={-1} />

            <motion.div className="pointer-events-none absolute inset-0 z-30" style={{ opacity: ui }}>
              <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-bg/75 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[65%] bg-[linear-gradient(to_top,rgb(7_7_10/0.96),rgb(7_7_10/0.75)_30%,rgb(7_7_10/0.3)_65%,transparent)]" />

              {/* góra */}
              <div className="absolute inset-x-5 top-24 flex items-start justify-between sm:inset-x-10 sm:top-28">
                <p className="text-[13px] text-white/70">{copy.work.label}</p>
                <p className="flex items-baseline gap-1.5 text-[13px] text-white/70 tabular-nums">
                  <Roll k={current} className="text-white">
                    {pad(current + 1)}
                  </Roll>
                  / {pad(N)}
                </p>
              </div>

              {/* dół */}
              <div className="absolute inset-x-5 bottom-8 flex flex-col gap-6 sm:inset-x-10 sm:bottom-12 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <h3 className="h-display text-[clamp(3rem,9vw,9rem)] text-white">
                    <Roll k={`n-${current}`} className="pb-[0.12em] -mb-[0.12em]" delay={0.04}>
                      {c.name}
                    </Roll>
                  </h3>
                  {c.description && (
                    <Roll k={`d-${current}`} className="mt-3 max-w-xl text-[15px] text-white/60" delay={0.08}>
                      <span className="line-clamp-2">{c.description}</span>
                    </Roll>
                  )}
                </div>

                <div className="flex shrink-0 items-end gap-6 self-start md:self-auto">
                  <TLink href={`/portfolio/${c.slug}`} label={c.name} className="group pointer-events-auto flex shrink-0 items-center gap-4 rounded-full bg-white py-2 pr-2 pl-6 text-[15px] font-medium text-bg">
                    <span className="roll">
                      <span>{copy.work.open}</span>
                      <span aria-hidden>{copy.work.open}</span>
                    </span>
                    <span className="grid size-11 place-items-center rounded-full bg-accent text-white transition-transform duration-700 ease-out-expo group-hover:rotate-45">
                      <Arrow className="size-4" />
                    </span>
                  </TLink>
                </div>
              </div>

              {/* pasek postępu */}
              <div className={`pointer-events-auto absolute top-1/2 right-5 hidden -translate-y-1/2 flex-col sm:right-10 md:landscape:flex ${N > 14 ? "gap-0" : "gap-2"}`} role="tablist" aria-label="Kategorie">
                {list.map((cat, i) => (
                  <button key={cat.id} type="button" role="tab" aria-selected={i === current} aria-label={cat.name} onClick={() => jump(i)} className={`group flex items-center justify-end gap-3 ${N > 14 ? "py-[3px]" : "py-1"}`}>
                    <span className={`text-[12px] transition-all duration-500 ${i === current ? "text-white opacity-100" : "translate-x-2 text-white/50 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}>{cat.name}</span>
                    <span className={`block h-px transition-all duration-700 ease-out-expo ${i === current ? "w-10 bg-white" : "w-5 bg-white/35 group-hover:w-7 group-hover:bg-white/70"}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* napis nad ramką (odwrócone kolory) — znika, gdy ramka wypełnia ekran */}
          <motion.div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center mix-blend-difference" style={{ scale: wordScale, opacity: wordOpacity, y: wordShift }}>
            <h2 id="portfolio-title" className="h-display text-[clamp(4.5rem,21vw,22rem)] leading-[0.8] tracking-[-0.06em] text-white">
              {copy.work.label}
            </h2>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
