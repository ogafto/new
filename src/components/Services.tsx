"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "motion/react";
import SectionHeader from "./figma/SectionHeader";
import SpotlightCard from "./ui/SpotlightCard";
import { FadeUp } from "./ui/Reveal";

function CardText({ title, text, tag }: { title: string; text: string; tag: string }) {
  return (
    <div className="relative">
      <p className="mb-3 font-mono text-[11px] text-dim">{tag}</p>
      <h3 className="font-display text-xl font-medium tracking-[-0.03em] sm:text-2xl">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-pretty text-muted">{text}</p>
    </div>
  );
}

/* ---------- Wizualizacje ---------- */

function FigmaVisual() {
  const swatches = ["#0d99ff", "#9747ff", "#ff7262", "#0acf83", "#ffcd29", "#ededef"];
  return (
    <div className="relative grid h-full grid-cols-[1fr_1.1fr] gap-3">
      <div className="space-y-3">
        <div className="rounded-xl bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <p className="mb-2 font-mono text-[10px] text-dim">Kolory</p>
          <div className="grid grid-cols-6 gap-1.5">
            {swatches.map((c, i) => (
              <motion.span
                key={c}
                className="aspect-square rounded-md ring-1 ring-white/10"
                style={{ background: c }}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.06, type: "spring", stiffness: 300, damping: 18 }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between rounded-xl bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <span className="font-display text-5xl leading-none font-medium tracking-[-0.06em]">Aa</span>
          <span className="text-right font-mono text-[10px] leading-relaxed text-dim">
            Geist
            <br />
            Medium · 64
          </span>
        </div>
      </div>
      <div className="relative rounded-xl border border-dashed border-comp/50 p-3">
        <span className="absolute -top-2.5 left-3 bg-surface px-1.5 font-mono text-[10px] text-comp">◆ Przycisk</span>
        <div className="flex h-full flex-col justify-center gap-2.5">
          {[
            ["Primary", "bg-white text-black"],
            ["Blue", "bg-sel text-white"],
            ["Ghost", "bg-white/[0.06] text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]"],
          ].map(([n, c], i) => (
            <motion.div
              key={n}
              className={`relative flex h-8 items-center justify-center rounded-full text-[11px] font-medium ${c}`}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
            >
              {n}
              {i === 1 && (
                <span className="absolute -inset-[3px] border border-sel">
                  <span className="absolute -right-8 top-1/2 -translate-y-1/2 rounded-[3px] bg-[#f24e8e] px-1 font-mono text-[9px] text-white">16</span>
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CubeVisual() {
  const faces = [
    "rotateY(0deg)",
    "rotateY(90deg)",
    "rotateY(180deg)",
    "rotateY(-90deg)",
    "rotateX(90deg)",
    "rotateX(-90deg)",
  ];
  return (
    <div className="grid h-full place-items-center [perspective:600px]">
      <div className="relative size-24 [transform-style:preserve-3d] [animation:cube_14s_linear_infinite]">
        {faces.map((f, i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-2xl border border-white/20 backdrop-blur-sm"
            style={{
              transform: `${f} translateZ(48px)`,
              background: `linear-gradient(135deg, ${["#36b5ff55", "#9b6bff55", "#ff7a6b55", "#0acf8355", "#ffcd2955", "#ffffff22"][i]}, transparent)`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes cube{to{transform:rotateX(360deg) rotateY(720deg)}}`}</style>
    </div>
  );
}

const code = [
  [["text-fig-purple", "export default "], ["text-sel", "function "], ["text-ink", "Strona"], ["text-muted", "() {"]],
  [["text-muted", "  return "], ["text-fig-coral", "<Hero "], ["text-fig-green", "efekt"], ["text-muted", "="], ["text-fig-yellow", '"wow" '], ["text-fig-coral", "/>"]],
  [["text-muted", "}"]],
];

function CodeVisual() {
  return (
    <div className="h-full rounded-xl bg-black/40 p-4 font-mono text-[12px] leading-6 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <div className="mb-3 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2 rounded-full bg-white/15" />
        ))}
      </div>
      {code.map((line, i) => (
        <motion.p
          key={i}
          className="whitespace-nowrap"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.25 }}
        >
          <span className="mr-3 text-dim">{i + 1}</span>
          {line.map(([c, t], j) => (
            <span key={j} className={c}>
              {t}
            </span>
          ))}
          {i === code.length - 1 && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-sel" />}
        </motion.p>
      ))}
    </div>
  );
}

function DevicesVisual() {
  return (
    <div className="flex h-full items-end justify-center gap-3">
      {[
        ["w-[46%] aspect-[16/10]", "Desktop"],
        ["w-[24%] aspect-[3/4]", "Tablet"],
        ["w-[14%] aspect-[9/19]", "Mobile"],
      ].map(([c, n], i) => (
        <motion.div
          key={n}
          className={`${c} relative rounded-lg bg-white/[0.03] p-1.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.12, duration: 0.7 }}
        >
          <div className="h-[22%] rounded-[3px] bg-gradient-to-r from-sel/60 to-comp/60" />
          <div className="mt-1 h-[6%] w-3/4 rounded-full bg-white/15" />
          <div className="mt-1 h-[6%] w-1/2 rounded-full bg-white/10" />
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-dim">{n}</span>
        </motion.div>
      ))}
    </div>
  );
}

function Gauge() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, 100, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView]);
  const r = 42;
  const len = 2 * Math.PI * r;
  return (
    <div ref={ref} className="flex h-full items-center justify-center gap-6">
      <div className="relative size-28">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#0acf83"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - v / 100)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-3xl font-medium tracking-tight text-fig-green tabular-nums">{v}</span>
      </div>
      <ul className="space-y-2 font-mono text-[11px] text-muted">
        {["Wydajność", "SEO", "Dostępność"].map((l) => (
          <li key={l} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-fig-green" />
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Services() {
  return (
    <section id="uslugi" className="relative mx-auto max-w-6xl px-4 py-32 sm:px-5 sm:py-40">
      <SectionHeader
        index="03"
        label="Usługi"
        align="center"
        title="Wszystko, czego potrzebuje"
        accent="Twoja marka."
        lead="Od pierwszego szkicu w Figmie po stronę, która ładuje się w mgnieniu oka. Jedna osoba, pełna odpowiedzialność."
        className="mb-16"
      />

      <div className="grid gap-4 lg:grid-cols-6">
        <FadeUp className="lg:col-span-4">
          <SpotlightCard className="flex h-full flex-col gap-8 rounded-3xl p-6 sm:p-8 md:flex-row md:items-end">
            <CardText tag="01 — Design" title="Projekt UI/UX w Figmie" text="Widzisz każdy piksel swojej strony, zanim powstanie kod. Spójny system kolorów, typografii i komponentów." />
            <div className="h-56 w-full shrink-0 md:w-[52%]">
              <FigmaVisual />
            </div>
          </SpotlightCard>
        </FadeUp>
        <FadeUp className="lg:col-span-2" delay={0.1}>
          <SpotlightCard className="flex h-full flex-col justify-between gap-8 rounded-3xl p-6 sm:p-8">
            <div className="h-40">
              <CubeVisual />
            </div>
            <CardText tag="02 — Motion" title="Animacje 3D i WebGL" text="Ruch, który przyciąga uwagę i prowadzi wzrok prosto do przycisku „Kup”." />
          </SpotlightCard>
        </FadeUp>
        <FadeUp className="lg:col-span-2">
          <SpotlightCard className="flex h-full flex-col justify-between gap-8 rounded-3xl p-6 sm:p-8">
            <div className="h-40">
              <CodeVisual />
            </div>
            <CardText tag="03 — Kod" title="Next.js i React" text="Nowoczesny, szybki kod — ten sam, którego używają największe marki." />
          </SpotlightCard>
        </FadeUp>
        <FadeUp className="lg:col-span-2" delay={0.1}>
          <SpotlightCard className="flex h-full flex-col justify-between gap-8 rounded-3xl p-6 sm:p-8">
            <div className="h-40 pb-5">
              <DevicesVisual />
            </div>
            <CardText tag="04 — Responsywność" title="Idealna na każdym ekranie" text="Większość klientów wejdzie z telefonu. Projektuję mobile-first." />
          </SpotlightCard>
        </FadeUp>
        <FadeUp className="lg:col-span-2" delay={0.2}>
          <SpotlightCard className="flex h-full flex-col justify-between gap-8 rounded-3xl p-6 sm:p-8">
            <div className="h-40">
              <Gauge />
            </div>
            <CardText tag="05 — SEO" title="Szybkość i widoczność w Google" text="Optymalizuję pod wynik 90+ w Google Lighthouse, żeby klienci Cię znaleźli." />
          </SpotlightCard>
        </FadeUp>
      </div>
    </section>
  );
}
