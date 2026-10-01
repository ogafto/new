"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { steps } from "@/lib/site";
import { DesignArt, DirectionArt, LaunchArt, TalkArt } from "./process/Illustrations";
import Button, { Magnetic } from "./ui/Button";

/*
 * Proces: świecąca wiązka biegnie w dół razem z przewijaniem. Gdy dociera do etapu,
 * węzeł się zapala, tekst wjeżdża, a karta z animowaną sceną obraca się do widza.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const arts = [TalkArt, DirectionArt, DesignArt, LaunchArt];

// Tytuł, którego litery „zapalają się” przy przewijaniu
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
  const opacity = useTransform(progress, [i / n - 0.1, i / n + 0.05], [0.18, 1]);
  return (
    <motion.span aria-hidden style={{ opacity }}>
      {c}
    </motion.span>
  );
}

// Karta z ilustracją: wjazd 3D przy przewijaniu + pochylanie i światło za kursorem
function ArtCard({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const Art = arts[i];
  const rx = useTransform(progress, [0, 1], [28, 0]);
  const y = useTransform(progress, [0, 1], [90, 0]);
  const op = useTransform(progress, [0, 0.6], [0, 1]);
  const sc = useTransform(progress, [0, 1], [0.9, 1]);
  const tx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ty = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const light = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, rgb(139 108 255 / 0.16), transparent 60%)`;
  return (
    <motion.div style={{ rotateX: rx, y, opacity: op, scale: sc, transformPerspective: 1200 }}>
      <motion.div
        style={{ rotateY: tx, rotateX: ty, transformPerspective: 1000 }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          tx.set((px - 0.5) * 10);
          ty.set(-(py - 0.5) * 8);
          mx.set(px * 100);
          my.set(py * 100);
        }}
        onPointerLeave={() => {
          tx.set(0);
          ty.set(0);
        }}
        className="edge group relative aspect-[4/3] overflow-hidden rounded-[28px] bg-surface shadow-[0_40px_100px_-40px_rgb(139_108_255/0.35)]"
      >
        <motion.div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: light }} />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgb(139_108_255/0.08),transparent_60%)]" />
        <div className="absolute inset-0 overflow-hidden rounded-[28px] [clip-path:inset(0_round_28px)]">
          <Art />
        </div>
        <span className="absolute top-4 right-5 z-20 text-[11.5px] text-dim tabular-nums">0{i + 1}</span>
      </motion.div>
    </motion.div>
  );
}

function Step({ i }: { i: number }) {
  const row = useRef<HTMLLIElement>(null);
  const s = steps[i];
  // 0 → 1, gdy etap wjeżdża na środek ekranu
  const { scrollYProgress: p } = useScroll({ target: row, offset: ["start 95%", "start 40%"] });
  const node = useTransform(p, [0.55, 0.8], [0, 1]);
  const nodeScale = useTransform(node, [0, 0.6, 1], [0.6, 1.25, 1]);
  const glow = useTransform(node, (v) => `0 0 ${v * 34}px rgb(139 108 255 / ${v * 0.75})`);
  const ring = useTransform(node, [0, 1], ["rgba(255,255,255,0.15)", "rgba(180,162,255,1)"]);
  const textY = useTransform(p, [0.3, 1], [50, 0]);
  const textOp = useTransform(p, [0.3, 0.9], [0, 1]);
  const flip = i % 2 === 1;

  return (
    <li ref={row} className="relative grid items-center gap-10 pb-28 pl-16 last:pb-0 md:grid-cols-2 md:gap-20 md:pl-0 lg:pb-40">
      {/* węzeł na wiązce */}
      <motion.span
        className="absolute top-2 left-[22px] z-10 grid size-11 -translate-x-1/2 place-items-center rounded-full border bg-bg text-[13px] tabular-nums md:top-1/2 md:left-1/2 md:-translate-y-1/2"
        style={{ scale: nodeScale, boxShadow: glow, borderColor: ring }}
      >
        <motion.span className="absolute inset-0 rounded-full bg-accent" style={{ opacity: node }} />
        <span className="relative">0{i + 1}</span>
      </motion.span>

      <motion.div style={{ y: textY, opacity: textOp }} className={flip ? "md:order-2 md:pl-6" : "md:pr-6 md:text-right"}>
        <p className="text-[14px] text-accent-2">Etap 0{i + 1}</p>
        <h3 className="h-display mt-3 text-[clamp(2.6rem,5vw,4.4rem)]">{s.title}</h3>
        <p className="mt-4 text-[19px] text-ink">{s.lead}</p>
        <p className={`mt-3 max-w-[460px] text-[16px] leading-relaxed text-muted ${flip ? "" : "md:ml-auto"}`}>{s.text}</p>
        <ul className={`mt-6 flex flex-wrap gap-2 ${flip ? "" : "md:justify-end"}`}>
          {s.points.map((pt, k) => (
            <motion.li
              key={pt}
              className="flex items-center gap-2 rounded-full border border-line-2 bg-white/[0.02] py-1.5 pr-3.5 pl-2 text-[13px] text-muted"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ delay: 0.2 + k * 0.1, duration: 0.6, ease }}
            >
              <span className="grid size-4 place-items-center rounded-full bg-accent/20 text-accent-2">
                <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden>
                  <path d="M2 5.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {pt}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <div className={flip ? "md:order-1" : ""}>
        <ArtCard i={i} progress={p} />
      </div>
    </li>
  );
}

export default function Process() {
  const head = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const { scrollYProgress: hp } = useScroll({ target: head, offset: ["start 85%", "end 45%"] });
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 60%", "end 60%"] });
  const beam = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const top = useTransform(beam, (v) => `${v * 100}%`);

  return (
    <section id="proces" aria-labelledby="proces-title" className="relative overflow-x-clip pt-32 pb-16 lg:pt-44 lg:pb-24">
      <div className="pointer-events-none absolute top-1/4 left-1/2 size-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.08),transparent)]" aria-hidden />

      <div ref={head} className="relative mx-auto max-w-[1400px] px-5 text-center sm:px-10">
        <motion.p className="kicker justify-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          Proces
        </motion.p>
        <h2 id="proces-title" className="h-display mx-auto mt-7 max-w-[1100px] text-[clamp(3rem,8vw,7.6rem)]">
          <FillText text="Od pierwszej rozmowy" progress={hp} className="block" />
          <FillText text="do premiery." progress={hp} className="block text-accent-2" />
        </h2>
        <motion.p className="mx-auto mt-8 max-w-[520px] text-[17px] leading-relaxed text-muted" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease }}>
          Cztery etapy, jasne zasady. Na każdym wiesz, co się dzieje i co będzie dalej — a postęp widzisz w swoim panelu.
        </motion.p>
      </div>

      <div className="relative mx-auto mt-28 max-w-[1240px] px-5 sm:px-10 lg:mt-36">
        <ol ref={track} className="relative">
          {/* wiązka: tor + świecące wypełnienie + „kometa” */}
          <span className="absolute top-0 bottom-0 left-[22px] w-px bg-line md:left-1/2" aria-hidden />
          <motion.span className="absolute top-0 left-[22px] w-px origin-top bg-gradient-to-b from-accent/0 via-accent to-accent-2 md:left-1/2" style={{ height: top }} aria-hidden />
          <motion.span className="absolute left-[22px] z-20 -translate-x-1/2 -translate-y-1/2 md:left-1/2" style={{ top }} aria-hidden>
            <span className="block size-2.5 rounded-full bg-white shadow-[0_0_14px_4px_rgb(180_162_255/0.9),0_0_40px_10px_rgb(139_108_255/0.5)]" />
          </motion.span>
          {steps.map((_, i) => (
            <Step key={i} i={i} />
          ))}
        </ol>

        <motion.div className="mt-24 flex flex-col items-center gap-6 text-center lg:mt-32" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1, ease }}>
          <p className="h-display text-[clamp(2rem,4vw,3.2rem)]">
            Pierwszy krok to <span className="text-accent-2">krótka rozmowa.</span>
          </p>
          <Magnetic>
            <Button href="#kontakt">Umów rozmowę</Button>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}
