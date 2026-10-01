"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useLenis } from "lenis/react";
import { steps } from "@/lib/site";

/*
 * Proces jako jedna „żywa” plansza: te same klocki przy przewijaniu zmieniają się
 * z rozmowy (dymki czatu) w moodboard, potem w projekt strony, a na końcu strona trafia do przeglądarki.
 * Każdy klocek ma pozycję i wygląd dla każdego etapu; motion animuje przejścia między nimi.
 */

const ease = [0.16, 1, 0.3, 1] as const;

type S = { l: number; t: number; w: number; h: number; r?: number; bg?: string; line?: string; g?: string; o?: number; text?: string; fg?: string; cls?: string };

const W = "rgba(255,255,255,0.06)";
const L = "rgba(255,255,255,0.1)";
const V = "#8b6cff";
const V2 = "#b4a2ff";
const INK = "#efedf5";
const HIDE: S = { l: 50, t: 50, w: 0, h: 0, o: 0 };
const G1 = "radial-gradient(circle at 30% 25%, #c9b8ff, transparent 55%), radial-gradient(circle at 80% 85%, #8b6cff, transparent 60%), linear-gradient(160deg,#2a2140,#141019)";
const G2 = "linear-gradient(135deg,#efe9ff,#b4a2ff 55%,#8b6cff)";

// [Rozmowa, Kierunek, Projekt] — Wdrożenie liczone z Projektu (strona „wkłada się” do przeglądarki)
const base: S[][] = [
  [
    { l: 6, t: 8, w: 62, h: 12, r: 18, bg: W, line: L, text: "Cześć! Potrzebuję strony dla palarni kawy.", fg: INK },
    { l: 38, t: 24, w: 56, h: 11, r: 18, bg: V, text: "Super. Kto dziś u Was kupuje?", fg: "#fff" },
    { l: 6, t: 39, w: 56, h: 11, r: 18, bg: W, line: L, text: "Stali klienci. Chcemy też online.", fg: INK },
    { l: 32, t: 54, w: 62, h: 11, r: 18, bg: V, text: "Zrobimy sklep z subskrypcją kawy.", fg: "#fff" },
    { l: 6, t: 76, w: 20, h: 10, r: 99, bg: "rgba(139,108,255,0.14)", line: "rgba(139,108,255,0.5)", text: "✓ Cel", fg: V2 },
    { l: 28, t: 76, w: 20, h: 10, r: 99, bg: "rgba(139,108,255,0.14)", line: "rgba(139,108,255,0.5)", text: "✓ Klient", fg: V2 },
    { l: 50, t: 76, w: 21, h: 10, r: 99, bg: "rgba(139,108,255,0.14)", line: "rgba(139,108,255,0.5)", text: "✓ Budżet", fg: V2 },
    { l: 73, t: 76, w: 21, h: 10, r: 99, bg: "rgba(139,108,255,0.14)", line: "rgba(139,108,255,0.5)", text: "✓ Termin", fg: V2 },
    HIDE,
    HIDE,
    HIDE,
    HIDE,
  ],
  [
    { l: 6, t: 7, w: 42, h: 54, r: 22, bg: "#141019", line: L, g: G1, text: "Aa", fg: INK, cls: "text-[clamp(2.4rem,6vw,4.4rem)] font-medium tracking-[-0.04em] !items-end p-[7%]" },
    { l: 52, t: 7, w: 42, h: 25, r: 22, bg: "#b4a2ff", g: G2 },
    { l: 52, t: 36, w: 20, h: 25, r: 22, bg: INK },
    { l: 74, t: 36, w: 20, h: 25, r: 22, bg: "#2a2140", line: L },
    { l: 6, t: 66, w: 15.6, h: 13, r: 14, bg: "#141019", line: L },
    { l: 23.6, t: 66, w: 15.6, h: 13, r: 14, bg: "#2a2140" },
    { l: 41.2, t: 66, w: 15.6, h: 13, r: 14, bg: V },
    { l: 58.8, t: 66, w: 15.6, h: 13, r: 14, bg: V2 },
    { l: 76.4, t: 66, w: 15.6, h: 13, r: 14, bg: INK },
    { l: 6, t: 84, w: 42, h: 9, r: 99, bg: "transparent", line: L, text: "Satoshi · 500", fg: "#9b98a8" },
    { l: 52, t: 84, w: 42, h: 9, r: 99, bg: "transparent", line: L, text: "ciemny · premium", fg: "#9b98a8" },
    HIDE,
  ],
  [
    { l: 6, t: 7, w: 88, h: 9, r: 12, bg: W, line: L },
    { l: 10, t: 26, w: 42, h: 7, r: 8, bg: INK },
    { l: 10, t: 36, w: 32, h: 7, r: 8, bg: V2 },
    { l: 10, t: 50, w: 17, h: 7.5, r: 99, bg: V },
    { l: 58, t: 23, w: 32, h: 34, r: 18, bg: "#2a2140", g: G1 },
    { l: 10, t: 66, w: 25.5, h: 24, r: 14, bg: W, line: L },
    { l: 37.25, t: 66, w: 25.5, h: 24, r: 14, bg: W, line: L },
    { l: 64.5, t: 66, w: 25.5, h: 24, r: 14, bg: W, line: L },
    { l: 9.5, t: 10.3, w: 9, h: 2.4, r: 4, bg: INK },
    { l: 62, t: 10.8, w: 7, h: 1.6, r: 4, bg: "rgba(255,255,255,0.4)" },
    { l: 72, t: 10.8, w: 7, h: 1.6, r: 4, bg: "rgba(255,255,255,0.4)" },
    { l: 82, t: 10.3, w: 9, h: 2.6, r: 99, bg: V },
  ],
];
// Wdrożenie: projekt zmniejszony do okna przeglądarki
const inBrowser = base[2].map((s) => ({ ...s, l: 7 + s.l * 0.6, t: 20 + s.t * 0.7, w: s.w * 0.6, h: s.h * 0.7, r: (s.r ?? 8) * 0.7 }));
const states = [...base, inBrowser];
const windowTitles = ["brief — rozmowa", "moodboard.fig", "strona-glowna.fig", "twojafirma.pl"];

function Block({ i, step }: { i: number; step: number }) {
  const s = states[step][i];
  return (
    <motion.div
      className="absolute overflow-hidden"
      initial={false}
      animate={{
        left: `${s.l}%`,
        top: `${s.t}%`,
        width: `${s.w}%`,
        height: `${s.h}%`,
        borderRadius: s.r ?? 10,
        backgroundColor: s.bg ?? "rgba(0,0,0,0)",
        boxShadow: `inset 0 0 0 1px ${s.line ?? "rgba(255,255,255,0)"}`,
        opacity: s.o ?? 1,
      }}
      transition={{ duration: 1.1, delay: i * 0.035, ease }}
    >
      <motion.div className="absolute inset-0" style={{ backgroundImage: s.g }} initial={false} animate={{ opacity: s.g ? 1 : 0 }} transition={{ duration: 0.8 }} />
      <AnimatePresence mode="wait" initial={false}>
        {s.text && (
          <motion.span
            key={`${step}-${s.text}`}
            className={`absolute inset-0 flex items-center leading-tight ${s.cls ?? "px-[6%] text-[11px] sm:text-[13px]"}`}
            style={{ color: s.fg }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, delay: 0.35 + i * 0.03 }}
          >
            {s.text}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stage({ step }: { step: number }) {
  return (
    <div className="edge relative aspect-[5/4] w-full overflow-hidden rounded-[28px] bg-surface">
      {/* światło zmieniające się z etapem */}
      <motion.div
        className="pointer-events-none absolute -inset-1/4"
        animate={{ background: `radial-gradient(40% 40% at ${[30, 70, 40, 60][step]}% ${[20, 30, 70, 40][step]}%, rgb(139 108 255 / ${[0.16, 0.22, 0.14, 0.2][step]}), transparent)` }}
        transition={{ duration: 1.4 }}
      />
      <div className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]" />

      {/* okno przeglądarki (tylko przy wdrożeniu) */}
      <AnimatePresence>
        {step === 3 && (
          <motion.div
            className="absolute top-[10%] left-[4%] h-[84%] w-[66%] rounded-[18px] border border-line-2 bg-bg/70 backdrop-blur"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.9, ease }}
          >
            <div className="flex items-center gap-2 border-b border-line px-[4%] py-[2.4%]">
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="ml-2 flex flex-1 items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-muted sm:text-[11px]">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                twojafirma.pl
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0">
        {states[0].map((_, i) => (
          <Block key={i} i={i} step={step} />
        ))}
      </div>

      {/* telefon + wyniki (wdrożenie) */}
      <AnimatePresence>
        {step === 3 && (
          <>
            <motion.div
              key="phone"
              className="absolute top-[18%] right-[5%] h-[64%] w-[21%] overflow-hidden rounded-[16px] border border-line-2 bg-bg p-[1.2%]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.9, delay: 0.5, ease }}
            >
              <span className="block h-[38%] rounded-[11px]" style={{ backgroundImage: G1 }} />
              <span className="mt-[14%] block h-[5%] w-4/5 rounded bg-ink/90" />
              <span className="mt-[6%] block h-[5%] w-3/5 rounded bg-accent-2" />
              <span className="mt-[12%] block h-[8%] w-1/2 rounded-full bg-accent" />
              <span className="mt-[12%] block h-[14%] rounded-[8px] bg-white/[0.06]" />
            </motion.div>
            <motion.div
              key="score"
              className="absolute right-[5%] bottom-[5%] flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 py-1 pr-3 pl-1 text-[10.5px] text-emerald-200 sm:text-[12px]"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 1, ease }}
            >
              <span className="grid size-6 place-items-center rounded-full bg-emerald-400/20 text-[10px] font-medium sm:size-7">100</span>
              Wydajność
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* kursor „pracującego” projektanta */}
      <motion.div
        className="pointer-events-none absolute z-10"
        animate={{ left: ["78%", "30%", "22%", "48%"][step], top: ["60%", "36%", "52%", "86%"][step] }}
        transition={{ duration: 1.3, ease }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        <span className="ml-3 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">afto</span>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-[4%] pb-[3%] text-[11px] text-dim">
        <AnimatePresence mode="wait">
          {step < 3 && (
            <motion.span key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }}>
              {windowTitles[step]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Process() {
  const wrap = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(steps.length - 1, Math.floor(v * steps.length * 0.999))));

  const jump = (i: number) => {
    const el = wrap.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    lenis?.scrollTo(el.offsetTop + total * ((i + 0.5) / steps.length), { duration: 1.2 });
  };

  const s = steps[step];

  return (
    <section id="proces" aria-labelledby="proces-title" className="relative">
      <div ref={wrap} className="relative" style={{ height: `${100 + (steps.length - 1) * 85}svh` }}>
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="pointer-events-none absolute top-1/2 left-[60%] size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.08),transparent)]" aria-hidden />

          <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-6 px-5 pt-16 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:pt-0">
            <div>
              <p className="kicker">Proces</p>
              <h2 id="proces-title" className="sr-only">
                Jak wygląda współpraca — od rozmowy do publikacji
              </h2>

              <div className="mt-5 flex items-end gap-4 lg:mt-10">
                <span className="h-display relative block overflow-hidden text-[clamp(4.5rem,11vw,10rem)] leading-[0.85] text-accent-2 tabular-nums">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={step} className="block" initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "-100%" }} transition={{ duration: 0.9, ease }}>
                      0{step + 1}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="mb-[0.6em] text-[14px] text-dim">/ 0{steps.length}</span>
              </div>

              <div className="relative mt-4 min-h-[150px] lg:mt-8 lg:min-h-[260px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={step} initial={{ opacity: 0, y: 18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(6px)" }} transition={{ duration: 0.55, ease }}>
                    <h3 className="h-display text-[clamp(2.2rem,4.4vw,4rem)]">{s.title}</h3>
                    <p className="mt-3 text-[17px] text-ink lg:mt-4 lg:text-[19px]">{s.lead}</p>
                    <p className="mt-3 hidden max-w-[460px] text-[15.5px] leading-relaxed text-muted sm:block">{s.text}</p>
                    <ul className="mt-5 hidden flex-wrap gap-2 lg:flex">
                      {s.points.map((p) => (
                        <li key={p} className="rounded-full border border-line-2 px-3 py-1 text-[13px] text-muted">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* etapy: klik przewija do etapu, pasek pokazuje postęp przewijania */}
              <div className="mt-4 lg:mt-10">
                <div className="grid grid-cols-4 gap-3">
                  {steps.map((st, i) => (
                    <button key={st.title} type="button" onClick={() => jump(i)} className="group text-left" aria-current={i === step ? "step" : undefined}>
                      <span className={`block text-[12px] transition-colors duration-500 sm:text-[13px] ${i === step ? "text-ink" : "text-dim group-hover:text-muted"}`}>{st.title}</span>
                    </button>
                  ))}
                </div>
                <div className="relative mt-3 h-px bg-line">
                  <motion.span className="absolute inset-0 origin-left bg-accent" style={{ scaleX: bar }} />
                </div>
              </div>
            </div>

            <Stage step={step} />
          </div>
        </div>
      </div>
    </section>
  );
}
