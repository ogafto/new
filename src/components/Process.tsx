"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { FadeUp, Heading } from "./ui/Reveal";
import { steps } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;
const draw = [0.65, 0, 0.35, 1] as const;

// Linia rysująca się przy pojawieniu
function P({ d, i = 0, className = "" }: { d: string; i?: number; className?: string }) {
  return (
    <motion.path
      d={d}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ pathLength: { delay: 0.1 + i * 0.12, duration: 1.1, ease: draw }, opacity: { delay: 0.1 + i * 0.12, duration: 0.2 } }}
    />
  );
}

function Glow({ cx, cy }: { cx: number; cy: number }) {
  return (
    <motion.g initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1, duration: 0.6, ease }} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r="10" fill="var(--color-accent)" opacity="0.25" style={{ filter: "blur(6px)" }} />
      <circle cx={cx} cy={cy} r="3.5" fill="var(--color-accent-2)" />
    </motion.g>
  );
}

// Animowane ikony etapów (line-art)
const icons = [
  // Brief — dymek rozmowy
  <g key="brief">
    <P d="M30 42h100a12 12 0 0 1 12 12v46a12 12 0 0 1-12 12H72l-24 20v-20H30a12 12 0 0 1-12-12V54a12 12 0 0 1 12-12z" />
    <P d="M42 64h76" i={1} />
    <P d="M42 78h56" i={2} />
    <P d="M42 92h36" i={3} />
    <motion.circle cx="126" cy="92" r="3" fill="var(--color-accent-2)" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.4, repeat: Infinity }} />
  </g>,
  // Kierunek — kompas z obracającą się igłą
  <g key="dir">
    <P d="M80 20a60 60 0 1 1 0 120a60 60 0 1 1 0-120z" />
    <P d="M80 32a48 48 0 1 1 0 96a48 48 0 1 1 0-96z" i={1} className="opacity-40" />
    {[0, 90, 180, 270].map((a, k) => (
      <g key={a} transform={`rotate(${a} 80 80)`}>
        <P d="M80 20v8" i={2 + k * 0.3} />
      </g>
    ))}
    <motion.g animate={{ rotate: [0, 28, -14, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "80px 80px" }}>
      <P d="M80 44l10 36-10 36-10-36z" i={3} />
      <P d="M70 80h20" i={4} />
    </motion.g>
    <Glow cx={80} cy={80} />
  </g>,
  // Projekt — krzywa Béziera z uchwytami (narzędzie pióro)
  <g key="pen">
    <P d="M22 118C50 30 110 130 138 42" />
    <P d="M22 118L46 66M138 42l-24 52" i={1} className="opacity-50" />
    {[
      [22, 118],
      [138, 42],
    ].map(([x, y], k) => (
      <motion.rect key={k} x={x - 5} y={y - 5} width="10" height="10" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.9 + k * 0.1, duration: 0.4 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
    ))}
    <motion.g animate={{ x: [0, 6, 0], y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <circle cx="46" cy="66" r="4" fill="var(--color-accent-2)" />
    </motion.g>
    <motion.g animate={{ x: [0, -5, 0], y: [0, 5, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
      <circle cx="114" cy="94" r="4" fill="var(--color-accent-2)" />
    </motion.g>
  </g>,
  // Wdrożenie — rakieta
  <motion.g key="launch" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
    <P d="M80 18c22 18 30 44 24 76H56c-6-32 2-58 24-76z" />
    <P d="M80 46a10 10 0 1 1 0 20a10 10 0 1 1 0-20z" i={1} />
    <P d="M56 80l-14 18v14l18-10M104 80l14 18v14l-18-10" i={2} />
    <motion.path
      d="M70 106c2 12 6 20 10 28c4-8 8-16 10-28"
      fill="none"
      stroke="var(--color-accent-2)"
      strokeWidth="1.5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0.4, 1, 0.4], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
    />
  </motion.g>,
];

function Card({ i, total, progress }: { i: number; total: number; progress: MotionValue<number> }) {
  const s = steps[i];
  const start = i / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - 1 - i) * 0.04]);
  const dim = useTransform(progress, [start, Math.min(1, start + 1 / total)], [0, i === total - 1 ? 0 : 0.55]);

  return (
    <div className="sticky top-24 h-[min(78vh,620px)] pb-6 sm:top-28" style={{ top: `calc(6rem + ${i * 18}px)` }}>
      <motion.article className="edge relative grid h-full origin-top overflow-hidden rounded-[28px] bg-surface lg:grid-cols-[1fr_1fr]" style={{ scale }}>
        <motion.div className="pointer-events-none absolute inset-0 z-10 rounded-[28px] bg-bg" style={{ opacity: dim }} aria-hidden />

        <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
          <div className="flex items-center justify-between text-[14px] text-dim">
            <span>
              Etap <span className="text-ink">{i + 1}</span> z {total}
            </span>
            <span className="h-px w-24 bg-line-2">
              <span className="block h-full bg-accent" style={{ width: `${((i + 1) / total) * 100}%` }} />
            </span>
          </div>
          <div>
            <svg viewBox="0 0 160 160" className="mb-6 size-24 overflow-visible text-ink/85 lg:hidden" aria-hidden>
              {icons[i]}
            </svg>
            <h3 className="h-display text-[clamp(2.6rem,5.5vw,5rem)]">{s.title}</h3>
            <p className="mt-5 max-w-[420px] text-[17px] leading-relaxed text-muted">{s.text}</p>
          </div>
        </div>

        <div className="relative hidden overflow-hidden border-l border-line lg:block">
          <div className="line-grid absolute inset-0 [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]" />
          <div className="absolute top-1/2 left-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.18),transparent)]" />
          <svg viewBox="0 0 160 160" className="absolute top-1/2 left-1/2 size-[min(70%,320px)] -translate-x-1/2 -translate-y-1/2 overflow-visible text-ink/85" aria-hidden>
            {icons[i]}
          </svg>
          <span className="absolute right-8 bottom-6 text-[120px] leading-none font-medium tracking-[-0.06em] text-white/[0.04]">0{i + 1}</span>
        </div>
      </motion.article>
    </div>
  );
}

export default function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section id="proces" className="relative mx-auto max-w-[1400px] px-5 pt-32 pb-20 sm:px-10 lg:pt-40">
      <div className="mb-14 flex flex-col justify-between gap-8 lg:mb-20 lg:flex-row lg:items-end">
        <div>
          <FadeUp>
            <p className="kicker">Proces</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.4rem)]" lines={["Od pomysłu", <span key="2" className="text-muted">do premiery</span>]} />
        </div>
        <FadeUp delay={0.1} className="max-w-[380px]">
          <p className="text-[17px] leading-relaxed text-muted">Cztery etapy, jeden cel — strona, która wygląda tak dobrze, jak dobra jest Twoja marka.</p>
        </FadeUp>
      </div>

      <div ref={ref} className="relative">
        {steps.map((_, i) => (
          <Card key={i} i={i} total={steps.length} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
