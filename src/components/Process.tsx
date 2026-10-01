"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
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
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ pathLength: { delay: 0.1 + i * 0.12, duration: 1.1, ease: draw }, opacity: { delay: 0.1 + i * 0.12, duration: 0.2 } }}
    />
  );
}

function Glow({ cx, cy }: { cx: number; cy: number }) {
  return (
    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, duration: 0.6, ease }} style={{ transformOrigin: `${cx}px ${cy}px` }}>
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
      <motion.rect key={k} x={x - 5} y={y - 5} width="10" height="10" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 + k * 0.1, duration: 0.4 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
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

export default function Process() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(steps.length - 1, Math.floor(v * steps.length))));

  return (
    <section ref={ref} id="proces" className="relative h-[360vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="line-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(55%_55%_at_70%_50%,#000,transparent)]" aria-hidden />
        <div className="pointer-events-none absolute top-1/2 right-[10%] size-[620px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.14),transparent)]" aria-hidden />

        <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 pt-24 pb-10 sm:px-10">
          <div className="flex items-baseline justify-between">
            <p className="kicker">Proces</p>
            <p className="text-[14px] text-dim tabular-nums">
              <span className="text-ink">0{step + 1}</span> / 0{steps.length}
            </p>
          </div>

          <div className="mt-10 grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="order-2 lg:order-1">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.6, ease }}>
                  <h2 className="h-display text-[clamp(3rem,8vw,7.5rem)]">{steps[step].title}</h2>
                  <p className="mt-6 max-w-[460px] text-[18px] leading-relaxed text-muted">{steps[step].text}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="order-1 flex justify-center lg:order-2">
              <div className="relative aspect-square w-[min(68vw,360px)] text-ink/80">
                <svg viewBox="0 0 160 160" className="absolute inset-0 size-full overflow-visible" aria-hidden>
                  <AnimatePresence mode="wait">
                    <motion.g key={step} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.35 }} style={{ transformOrigin: "80px 80px" }}>
                      {icons[step]}
                    </motion.g>
                  </AnimatePresence>
                </svg>
              </div>
            </div>
          </div>

          {/* postęp etapów */}
          <ol className="mt-10 grid grid-cols-4 gap-3">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="relative block h-px overflow-hidden bg-line-2">
                  <motion.span className="absolute inset-0 origin-left bg-accent" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.7, ease }} />
                </span>
                <span className={`mt-3 block text-[13px] transition-colors duration-500 ${i === step ? "text-ink" : "text-dim"}`}>
                  0{i + 1} <span className="hidden sm:inline">— {s.title}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
