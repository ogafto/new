"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { steps } from "@/lib/site";
import { DesignArt, DirectionArt, LaunchArt, TalkArt } from "./process/Illustrations";
import Button, { Magnetic } from "./ui/Button";

/*
 * Proces: każdy etap ma inny kształt (kapsuła, koło, łuk, kadr kinowy) i inne wejście przy przewijaniu.
 * Etapy łączy świecąca, wijąca się ścieżka — jej czoło jest dokładnie na wysokości czytania.
 */

const ease = [0.16, 1, 0.3, 1] as const;

function FillText({ text, progress, className = "" }: { text: string; progress: MotionValue<number>; className?: string }) {
  const chars = text.split("");
  return (
    <span className={className} aria-label={text}>
      {chars.map((c, i) => (
        <Char key={i} c={c} i={i} n={chars.length} progress={progress} />
      ))}
    </span>
  );
}
function Char({ c, i, n, progress }: { c: string; i: number; n: number; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [i / n - 0.1, i / n + 0.05], [0.16, 1]);
  const y = useTransform(progress, [i / n - 0.1, i / n + 0.05], ["0.12em", "0em"]);
  return (
    <motion.span aria-hidden style={{ opacity, y }} className="inline-block whitespace-pre">
      {c}
    </motion.span>
  );
}

// Tytuł etapu: litery wskakują po kolei
function Title({ text }: { text: string }) {
  return (
    <motion.h3 className="h-display text-[clamp(2.8rem,5.4vw,5rem)]" initial="h" whileInView="s" viewport={{ once: true, margin: "-15%" }} transition={{ staggerChildren: 0.035 }} aria-label={text}>
      {text.split("").map((c, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{
              h: { y: "110%", rotate: 8 },
              s: { y: "0%", rotate: 0, transition: { duration: 0.9, ease } },
            }}
            aria-hidden
          >
            {c}
          </motion.span>
        </span>
      ))}
    </motion.h3>
  );
}

function Copy({ i, align = "left" }: { i: number; align?: "left" | "right" }) {
  const s = steps[i];
  return (
    <div className={`flex flex-col ${align === "right" ? "md:items-end md:text-right" : ""}`}>
      <motion.p className="flex items-center gap-3 text-[14px] text-accent-2" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease }}>
        <span className="h-px w-8 bg-gradient-to-r from-accent to-transparent" />
        Etap 0{i + 1}
      </motion.p>
      <div className="mt-3">
        <Title text={s.title} />
      </div>
      <motion.p className="mt-4 text-[19px] text-ink" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.9, ease }}>
        {s.lead}
      </motion.p>
      <motion.p
        className="mt-3 max-w-[440px] text-[16px] leading-relaxed text-muted"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.9, ease }}
      >
        {s.text}
      </motion.p>
      <ul className={`mt-6 flex flex-wrap gap-2 ${align === "right" ? "md:justify-end" : ""}`}>
        {s.points.map((pt, k) => (
          <motion.li
            key={pt}
            className="flex items-center gap-2 rounded-full border border-line-2 bg-bg/40 py-1.5 pr-3.5 pl-2 text-[13px] text-muted backdrop-blur"
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{
              delay: 0.4 + k * 0.1,
              type: "spring",
              stiffness: 260,
              damping: 18,
            }}
          >
            <span className="grid size-4 place-items-center rounded-full bg-accent/25 text-accent-2">
              <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden>
                <motion.path
                  d="M2 5.2l2 2 4-4.4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + k * 0.1, duration: 0.4 }}
                />
              </svg>
            </span>
            {pt}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// Węzeł na ścieżce — zapala się, gdy dotrze do niego światło
function Node({ i, register, className }: { i: number; register: (i: number, el: HTMLSpanElement | null) => void; className: string }) {
  const own = useRef<HTMLSpanElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: own,
    offset: ["start 60%", "start 52%"],
  });
  const on = useSpring(scrollYProgress, { stiffness: 200, damping: 26 });
  const scale = useTransform(on, [0, 0.6, 1], [0.7, 1.3, 1]);
  const glow = useTransform(on, (v) => `0 0 ${v * 40}px rgb(139 108 255 / ${v * 0.8})`);
  const border = useTransform(on, [0, 1], ["rgba(255,255,255,0.15)", "rgba(200,188,255,1)"]);
  const ringOp = useTransform(on, [0.6, 1], [0, 1]);
  const ringScale = useTransform(on, [0.6, 1], [0.6, 1.25]);
  useEffect(() => register(i, own.current), [i, register]);
  return (
    <span ref={own} className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 ${className}`}>
      <motion.span className="relative grid size-12 place-items-center rounded-full border bg-bg text-[13px] tabular-nums" style={{ scale, boxShadow: glow, borderColor: border }}>
        <motion.span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-accent-2" style={{ opacity: on }} />
        <motion.span className="absolute -inset-3 rounded-full border border-accent/40" style={{ opacity: ringOp, scale: ringScale }} />
        <span className="relative">0{i + 1}</span>
      </motion.span>
    </span>
  );
}

// Przechylanie za kursorem
function useTilt() {
  const rx = useSpring(0, { stiffness: 140, damping: 18 });
  const ry = useSpring(0, { stiffness: 140, damping: 18 });
  const bind = {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      const r = e.currentTarget.getBoundingClientRect();
      ry.set(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
    },
    onPointerLeave: () => {
      rx.set(0);
      ry.set(0);
    },
  };
  return { rx, ry, bind };
}

// postęp wejścia kształtu (0 → 1), gdy wjeżdża na ekran
function useEnter() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 35%"],
  });
  return {
    ref,
    p: useSpring(scrollYProgress, { stiffness: 120, damping: 24 }),
  };
}

/* ---------- 1. Kapsuła: rozsuwa się od środka ---------- */
function Capsule({ children }: { children: React.ReactNode }) {
  const { ref, p } = useEnter();
  const clip = useTransform(p, (v) => `inset(0% ${48 - v * 48}% 0% ${48 - v * 48}% round 999px)`);
  const { rx, ry, bind } = useTilt();
  return (
    <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }} {...bind} className="relative">
      <motion.div style={{ clipPath: clip }} className="relative aspect-[2.1/1] w-full overflow-hidden rounded-full bg-surface shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_50%,rgb(139_108_255/0.12),transparent)]" />
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------- 2. Koło: rośnie jak soczewka, wokół krążą pierścienie ---------- */
function Circle({ children }: { children: React.ReactNode }) {
  const { ref, p } = useEnter();
  const clip = useTransform(p, (v) => `circle(${v * 50}% at 50% 50%)`);
  const rotate = useTransform(p, [0, 1], [-60, 0]);
  const counter = useTransform(rotate, (r) => -r * 2);
  const { rx, ry, bind } = useTilt();
  return (
    <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }} {...bind} className="relative mx-auto aspect-square w-full max-w-[520px]">
      <motion.span style={{ rotate }} className="absolute -inset-4 rounded-full border border-dashed border-white/10" aria-hidden />
      <motion.span style={{ rotate: counter }} className="absolute -inset-9 rounded-full border border-accent/15" aria-hidden>
        <span className="absolute top-1/2 -left-1 size-2 rounded-full bg-accent-2 shadow-[0_0_12px_#b4a2ff]" />
      </motion.span>
      <motion.div style={{ clipPath: clip }} className="absolute inset-0 overflow-hidden rounded-full bg-surface shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------- 3. Łuk: wyrasta od dołu ---------- */
function Arch({ children }: { children: React.ReactNode }) {
  const { ref, p } = useEnter();
  const clip = useTransform(p, (v) => `inset(${(1 - v) * 100}% 0% 0% 0% round 999px 999px 32px 32px)`);
  const { rx, ry, bind } = useTilt();
  return (
    <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }} {...bind} className="relative mx-auto w-full max-w-[440px]">
      <motion.div style={{ clipPath: clip }} className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-[32px] bg-surface shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_30%,rgb(139_108_255/0.14),transparent)]" />
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------- 4. Kadr kinowy: otwiera się jak przesłona ---------- */
function Cinema({ children }: { children: React.ReactNode }) {
  const { ref, p } = useEnter();
  const clip = useTransform(p, (v) => `inset(${(1 - v) * 40}% ${(1 - v) * 10}% ${(1 - v) * 40}% ${(1 - v) * 10}% round ${40 - v * 8}px)`);
  const scale = useTransform(p, [0, 1], [1.25, 1]);
  return (
    <motion.div ref={ref} style={{ clipPath: clip }} className="relative aspect-[4/5] w-full overflow-hidden rounded-[32px] bg-surface sm:aspect-[16/9] lg:aspect-[21/9]">
      <motion.div style={{ scale }} className="absolute inset-0">
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------- świecąca ścieżka między etapami ---------- */

function Beam({ track, nodes }: { track: React.RefObject<HTMLDivElement | null>; nodes: React.RefObject<(HTMLSpanElement | null)[]> }) {
  const [geo, setGeo] = useState({ d: "", w: 0, h: 0, len: 0 });
  const base = useRef<SVGPathElement>(null);
  const lit = useRef<SVGPathElement>(null);
  const glow = useRef<SVGPathElement>(null);
  const head = useRef<SVGGElement>(null);

  useEffect(() => {
    const measure = () => {
      const t = track.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      const pts = (nodes.current ?? [])
        .filter((n): n is HTMLSpanElement => !!n)
        .map((n) => {
          const b = n.getBoundingClientRect();
          return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top];
        });
      if (!pts.length) return;
      const all = [[pts[0][0], 0], ...pts];
      let d = `M${all[0][0]},${all[0][1]}`;
      for (let i = 1; i < all.length; i++) {
        const [x0, y0] = all[i - 1];
        const [x1, y1] = all[i];
        const dy = (y1 - y0) * 0.55;
        d += ` C${x0},${y0 + dy} ${x1},${y1 - dy} ${x1},${y1}`;
      }
      // długość liczona na tymczasowej ścieżce
      const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tmp.setAttribute("d", d);
      setGeo({ d, w: r.width, h: r.height, len: tmp.getTotalLength() });
    };
    const t0 = setTimeout(measure, 0);
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    const t1 = setTimeout(measure, 1200);
    return () => {
      ro.disconnect();
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [track, nodes]);

  // czoło światła = punkt ścieżki na wysokości linii czytania (55% ekranu)
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start 55%", "end 55%"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  const update = useCallback(
    (v: number) => {
      const el = base.current;
      if (!el || !geo.len) return;
      const y = v * geo.h;
      let lo = 0;
      let hi = geo.len;
      for (let k = 0; k < 22; k++) {
        const mid = (lo + hi) / 2;
        if (el.getPointAtLength(mid).y < y) lo = mid;
        else hi = mid;
      }
      const pt = el.getPointAtLength(lo);
      const off = String(geo.len - lo);
      lit.current?.setAttribute("stroke-dashoffset", off);
      glow.current?.setAttribute("stroke-dashoffset", off);
      head.current?.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
      head.current?.setAttribute("opacity", v > 0.003 && v < 0.997 ? "1" : "0");
    },
    [geo],
  );
  useMotionValueEvent(p, "change", update);
  useEffect(() => update(p.get()), [p, update]);

  if (!geo.d) return null;
  return (
    <svg className="pointer-events-none absolute top-0 left-0 z-10 overflow-visible" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} fill="none" aria-hidden>
      <defs>
        <linearGradient id="beam-g" x1="0" y1="0" x2="0" y2={geo.h} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b6cff" stopOpacity="0" />
          <stop offset="0.06" stopColor="#8b6cff" />
          <stop offset="0.6" stopColor="#b4a2ff" />
          <stop offset="1" stopColor="#efe9ff" />
        </linearGradient>
        <filter id="beam-blur" x="-50%" y="-5%" width="200%" height="110%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id="head-g">
          <stop offset="0" stopColor="#c9b8ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8b6cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path ref={base} d={geo.d} stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" strokeDasharray="2 7" strokeLinecap="round" />
      <path ref={glow} d={geo.d} stroke="url(#beam-g)" strokeWidth="8" strokeOpacity="0.5" filter="url(#beam-blur)" strokeDasharray={geo.len} strokeDashoffset={geo.len} />
      <path ref={lit} d={geo.d} stroke="url(#beam-g)" strokeWidth="2" strokeLinecap="round" strokeDasharray={geo.len} strokeDashoffset={geo.len} />
      <g ref={head} opacity="0">
        <circle r="26" fill="url(#head-g)" />
        <circle r="4.5" fill="#fff" />
      </g>
    </svg>
  );
}

export default function Process() {
  const head = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const register = useCallback((i: number, el: HTMLSpanElement | null) => {
    nodes.current[i] = el;
  }, []);
  const { scrollYProgress: hp } = useScroll({
    target: head,
    offset: ["start 85%", "end 45%"],
  });
  // światło w tle wędruje razem z czytaniem
  const { scrollYProgress: sp } = useScroll({
    target: track,
    offset: ["start end", "end start"],
  });
  const spot = useTransform(sp, (v) => `${v * 100}%`);
  const bg = useMotionTemplate`radial-gradient(45% 22% at 50% ${spot}, rgb(139 108 255 / 0.08), transparent)`;

  return (
    <section id="proces" aria-labelledby="proces-title" className="relative overflow-x-clip pt-32 pb-16 lg:pt-44 lg:pb-24">
      <div ref={head} className="relative mx-auto max-w-[1400px] px-5 text-center sm:px-10">
        <motion.p className="kicker justify-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          Proces
        </motion.p>
        <h2 id="proces-title" className="h-display mx-auto mt-7 max-w-[1100px] text-[clamp(3rem,8vw,7.6rem)]">
          <FillText text="Od pierwszej rozmowy" progress={hp} className="block" />
          <FillText text="do premiery." progress={hp} className="block text-accent-2" />
        </h2>
        <motion.p
          className="mx-auto mt-8 max-w-[520px] text-[17px] leading-relaxed text-muted"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
        >
          Cztery etapy, jasne zasady. Na każdym wiesz, co się dzieje i co będzie dalej — a postęp widzisz w swoim panelu.
        </motion.p>
      </div>

      <div ref={track} className="relative mx-auto mt-24 max-w-[1280px] px-5 sm:px-10 lg:mt-32">
        <motion.div className="pointer-events-none absolute -inset-x-[20vw] inset-y-0" style={{ background: bg }} aria-hidden />
        <Beam track={track} nodes={nodes} />

        {/* 01 — kapsuła z falami rozmowy */}
        <div className="relative grid items-center gap-10 pb-36 pl-14 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:pl-0 lg:pb-52">
          <Node i={0} register={register} className="top-6 left-[22px] md:top-1/2 md:left-[40%]" />
          <div className="relative z-20 md:pr-20">
            <Copy i={0} />
          </div>
          <Capsule>
            <TalkArt />
          </Capsule>
        </div>

        {/* 02 — koło z polem kierunków */}
        <div className="relative grid items-center gap-16 pb-36 pl-14 md:grid-cols-2 md:gap-24 md:pl-0 lg:pb-52">
          <Node i={1} register={register} className="top-6 left-[22px] md:top-1/2 md:left-1/2" />
          <div className="relative z-20 md:order-2 md:pl-12">
            <Copy i={1} />
          </div>
          <div className="px-6 md:order-1 md:px-10">
            <Circle>
              <DirectionArt />
            </Circle>
          </div>
        </div>

        {/* 03 — łuk z konstrukcją znaku */}
        <div className="relative grid items-center gap-12 pb-36 pl-14 md:grid-cols-[1.1fr_0.9fr] md:gap-20 md:pl-0 lg:pb-52">
          <Node i={2} register={register} className="top-6 left-[22px] md:top-[22%] md:left-[56%]" />
          <div className="relative z-20 md:pr-28">
            <Copy i={2} align="right" />
          </div>
          <Arch>
            <DesignArt />
          </Arch>
        </div>

        {/* 04 — kadr kinowy ze startem strony */}
        <div className="relative pl-14 md:pl-0">
          <Node i={3} register={register} className="top-6 left-[22px] md:-top-12 md:left-1/2" />
          <Cinema>
            <LaunchArt />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-bg/95 via-bg/55 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 sm:inset-x-10 sm:bottom-10 lg:max-w-[560px]">
              <Copy i={3} />
            </div>
          </Cinema>
        </div>
      </div>

      <motion.div
        className="mx-auto mt-24 flex max-w-[1280px] flex-col items-center gap-6 px-5 text-center lg:mt-32"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease }}
      >
        <p className="h-display text-[clamp(2rem,4vw,3.2rem)]">
          Pierwszy krok to <span className="text-accent-2">krótka rozmowa.</span>
        </p>
        <Magnetic>
          <Button href="#kontakt">Umów rozmowę</Button>
        </Magnetic>
      </motion.div>
    </section>
  );
}
