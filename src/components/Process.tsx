"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { content } from "@/lib/content";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { steps } from "@/lib/site";
import { DesignArt, DirectionArt, LaunchArt, TalkArt } from "./process/Illustrations";
import Button, { Magnetic } from "./ui/Button";

/*
 * Proces: każdy etap ma inny kształt (kapsuła, koło, łuk, kadr kinowy) i inne wejście przy przewijaniu.
 * Etapy łączy świecąca, wijąca się ścieżka — jej czoło jest dokładnie na wysokości czytania.
 */

const ease = [0.16, 1, 0.3, 1] as const;

function FillText({ text, progress, className = "" }: { text: string; progress: MotionValue<number>; className?: string }) {
  // litery zapalają się po kolei, ale słowa nie łamią się w środku
  const n = text.length;
  let i = 0;
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, w, arr) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {word.split("").map((c) => {
            const k = i++;
            return <Char key={k} c={c} i={k} n={n} progress={progress} />;
          })}
          {w < arr.length - 1 && (() => {
            i++;
            return <span className="inline-block w-[0.26em]" />;
          })()}
        </span>
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
  // litery wskakują po kolei, ale słowa nigdy nie łamią się w środku
  let i = 0;
  return (
    <motion.h3 className="h-display text-[clamp(2.6rem,5.4vw,5rem)]" initial="h" whileInView="s" viewport={{ once: true, margin: "-15%" }} transition={{ staggerChildren: 0.035 }} aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {word.split("").map((c) => (
            <span key={i++} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span className="inline-block" variants={{ h: { y: "110%", rotate: 8 }, s: { y: "0%", rotate: 0, transition: { duration: 0.9, ease } } }} aria-hidden>
                {c}
              </motion.span>
            </span>
          ))}
          {w < text.split(" ").length - 1 && <span className="inline-block w-[0.25em]" />}
        </span>
      ))}
    </motion.h3>
  );
}

function Copy({ i, align = "left" }: { i: number; align?: "left" | "right" }) {
  const s = steps[i];
  return (
    <div className={`flex flex-col ${align === "right" ? "lg:items-end lg:text-right" : ""}`}>
      <motion.p className="flex items-center gap-3 text-[14px] text-accent-2" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease }}>
        <span className="size-1.5 rounded-full bg-accent-2 shadow-[0_0_10px_#8b6cff]" />
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
      <ul className={`mt-6 flex flex-wrap gap-2 ${align === "right" ? "lg:justify-end" : ""}`}>
        {s.points.map((pt, k) => (
          <motion.li
            key={pt}
            className="flex items-center gap-2 rounded-full border border-line-2 bg-bg/60 py-1.5 pr-3.5 pl-2 text-[13px] text-muted"
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

/* ---------- scena bez ramki: każda wjeżdża inaczej ---------- */
function Open({ children, enter = "up", className = "aspect-square max-w-[520px]" }: { children: React.ReactNode; enter?: "up" | "left" | "zoom" | "right"; className?: string }) {
  const { ref, p } = useEnter();
  const y = useTransform(p, [0, 1], [enter === "up" ? 70 : 0, 0]);
  const x = useTransform(p, [0, 1], [enter === "left" ? -60 : enter === "right" ? 60 : 0, 0]);
  const scale = useTransform(p, [0, 1], [enter === "zoom" ? 0.85 : 1, 1]);
  const opacity = useTransform(p, [0, 0.5], [0, 1]);
  const { rx, ry, bind } = useTilt();
  return (
    <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, x, y, scale, opacity, transformPerspective: 1100 }} {...bind} className={`relative mx-auto w-full will-change-transform ${className}`}>
      {children}
    </motion.div>
  );
}

/* ---------- świecąca ścieżka między etapami ---------- */

function Beam({ track, nodes }: { track: React.RefObject<HTMLDivElement | null>; nodes: React.RefObject<(HTMLSpanElement | null)[]> }) {
  const [geo, setGeo] = useState<{ d: string; w: number; h: number; len: number; lut?: Float32Array }>({ d: "", w: 0, h: 0, len: 0 });
  const base = useRef<SVGPathElement>(null);
  const lit = useRef<SVGPathElement>(null);
  const glow = useRef<SVGPathElement>(null);
  const head = useRef<SVGGElement>(null);
  const grad = useRef<SVGLinearGradientElement>(null);

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
      // długość liczona na tymczasowej ścieżce + tablica punktów (y rośnie wzdłuż ścieżki),
      // żeby przy przewijaniu nie wołać getPointAtLength ~20 razy na klatkę
      const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tmp.setAttribute("d", d);
      const len = tmp.getTotalLength();
      const n = Math.max(64, Math.min(1200, Math.round(len / 4)));
      const lut = new Float32Array((n + 1) * 3);
      for (let k = 0; k <= n; k++) {
        const l = (k / n) * len;
        const pt = tmp.getPointAtLength(l);
        lut[k * 3] = l;
        lut[k * 3 + 1] = pt.x;
        lut[k * 3 + 2] = pt.y;
      }
      setGeo({ d, w: r.width, h: r.height, len, lut });
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
      const { lut, len } = geo;
      if (!lut || !len) return;
      // pierwszy punkt ścieżki na wysokości y (wyszukiwanie binarne w tablicy) + interpolacja liniowa
      const y = v * geo.h;
      const n = lut.length / 3 - 1;
      let lo = 0;
      let hi = n;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (lut[mid * 3 + 2] < y) lo = mid + 1;
        else hi = mid;
      }
      const b = Math.max(1, lo);
      const a = b - 1;
      const ya = lut[a * 3 + 2];
      const yb = lut[b * 3 + 2];
      const f = yb > ya ? Math.min(1, Math.max(0, (y - ya) / (yb - ya))) : 0;
      const at = lut[a * 3] + (lut[b * 3] - lut[a * 3]) * f;
      const pt = { x: lut[a * 3 + 1] + (lut[b * 3 + 1] - lut[a * 3 + 1]) * f, y: ya + (yb - ya) * f };
      const off = String(len - at);
      lit.current?.setAttribute("stroke-dashoffset", off);
      glow.current?.setAttribute("stroke-dashoffset", off);
      head.current?.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
      grad.current?.setAttribute("y1", String(pt.y - 650));
      grad.current?.setAttribute("y2", String(pt.y));
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
        {/* „ogon komety”: gradient przesuwa się razem z czołem światła */}
        <linearGradient ref={grad} id="beam-g" x1="0" y1="0" x2="0" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b4a2ff" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#8b6cff" stopOpacity="0.55" />
          <stop offset="0.88" stopColor="#c9b8ff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="head-g">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.4" stopColor="#c9b8ff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#8b6cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path ref={base} d={geo.d} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="1.5 8" strokeLinecap="round" />
      <path ref={glow} d={geo.d} stroke="url(#beam-g)" strokeWidth="7" strokeOpacity="0.12" strokeLinecap="round" strokeDasharray={geo.len} strokeDashoffset={geo.len} />
      <path ref={lit} d={geo.d} stroke="url(#beam-g)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray={geo.len} strokeDashoffset={geo.len} />
      <g ref={head} opacity="0">
        <circle r="30" fill="url(#head-g)" />
        <circle r="5.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <circle r="3" fill="#fff" />
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
  return (
    <section id="proces" aria-labelledby="proces-title" className="relative overflow-x-clip pt-32 pb-16 lg:pt-44 lg:pb-24">
      <div ref={head} className="relative mx-auto max-w-[1400px] px-5 text-center sm:px-10">
        <motion.p className="kicker justify-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          {content().texts.process.kicker}
        </motion.p>
        <h2 id="proces-title" className="h-display mx-auto mt-7 max-w-[1100px] text-[clamp(2.6rem,6.2vw,5.8rem)]">
          <FillText text={content().texts.process.title} progress={hp} className="block" />
          <FillText text={content().texts.process.accent} progress={hp} className="block text-accent-2" />
        </h2>
        <motion.p
          className="mx-auto mt-8 max-w-[520px] text-[17px] leading-relaxed text-muted"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
        >
          {content().texts.process.text}
        </motion.p>
      </div>

      <div ref={track} className="relative mx-auto mt-24 max-w-[1280px] px-5 sm:px-10 lg:mt-32">
        <Beam track={track} nodes={nodes} />

        {/* 01 — rozmowa: dymki czatu */}
        <div className="relative grid items-center gap-10 pb-36 pl-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:pl-0 lg:pb-48">
          <Node i={0} register={register} className="top-6 left-[22px] lg:top-1/2 lg:left-[42%]" />
          <div className="relative z-20 lg:pr-20">
            <Copy i={0} />
          </div>
          <Open enter="right" className="aspect-[5/4] max-w-[600px] lg:pl-8">
            <TalkArt />
          </Open>
        </div>

        {/* 02 — kierunek: kursor wybiera kolory i font */}
        <div className="relative grid items-center gap-12 pb-36 pl-14 lg:grid-cols-2 lg:gap-24 lg:pl-0 lg:pb-48">
          <Node i={1} register={register} className="top-6 left-[22px] lg:top-1/2 lg:left-1/2" />
          <div className="relative z-20 lg:order-2 lg:pl-12">
            <Copy i={1} />
          </div>
          <div className="lg:order-1">
            <Open enter="zoom" className="aspect-[5/4] max-w-[560px]">
              <DirectionArt />
            </Open>
          </div>
        </div>

        {/* 03 — projekt: konstrukcja znaku */}
        <div className="relative grid items-center gap-12 pb-36 pl-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pl-0 lg:pb-48">
          <Node i={2} register={register} className="top-6 left-[22px] lg:top-[22%] lg:left-[56%]" />
          <div className="relative z-20 lg:pr-28">
            <Copy i={2} align="right" />
          </div>
          <Open>
            <DesignArt />
          </Open>
        </div>

        {/* 04 — wdrożenie: kursor klika „Opublikuj” */}
        <div className="relative grid items-center gap-12 pl-14 lg:grid-cols-2 lg:gap-24 lg:pl-0">
          <Node i={3} register={register} className="top-6 left-[22px] lg:top-1/2 lg:left-1/2" />
          <div className="relative z-20 lg:order-2 lg:pl-12">
            <Copy i={3} />
          </div>
          <div className="lg:order-1">
            <Open enter="left" className="aspect-[4/5] max-w-[560px] sm:aspect-[5/4]">
              <LaunchArt />
            </Open>
          </div>
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
          {content().texts.process.ctaText} <span className="text-accent-2">{content().texts.process.ctaAccent}</span>
        </p>
        <Magnetic>
          <Button href="#kontakt">{content().texts.process.ctaButton}</Button>
        </Magnetic>
      </motion.div>
    </section>
  );
}
