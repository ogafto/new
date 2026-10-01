"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { steps } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";

const colors = ["var(--color-fig-blue)", "var(--color-fig-purple)", "var(--color-fig-coral)", "var(--color-fig-green)", "var(--color-fig-yellow)"];

// Strzałka "noodle" jak połączenie w trybie Prototyp Figmy.
function Connector({ vertical }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <svg width="24" height="56" viewBox="0 0 24 56" className="mx-auto my-1 text-sel" aria-hidden>
        <circle cx="12" cy="4" r="4" fill="currentColor" />
        <motion.path
          d="M12 8 C 2 22, 22 34, 12 48"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8 }}
        />
        <path d="M6 46l6 8 6-8z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="96" height="40" viewBox="0 0 96 40" className="shrink-0 self-center text-sel" aria-hidden>
      <circle cx="5" cy="20" r="5" fill="currentColor" />
      <path d="M10 20 C 36 0, 60 40, 84 20" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4 4" className="[animation:dash_1s_linear_infinite]" />
      <path d="M82 13l10 7-10 7z" fill="currentColor" />
      <style>{`@keyframes dash{to{stroke-dashoffset:-16}}`}</style>
    </svg>
  );
}

function StepCard({ s, i, horizontal }: { s: (typeof steps)[number]; i: number; horizontal: boolean }) {
  return (
    <div className={horizontal ? "w-[380px] shrink-0" : "w-full"}>
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-muted">
        <span>
          # Krok {i + 1} <span className="opacity-50">/ {s.title}</span>
        </span>
        <span>{s.time}</span>
      </div>
      <div className={`group relative overflow-hidden rounded-2xl border border-line bg-panel p-6 transition-colors hover:border-sel sm:p-8 ${horizontal ? "h-[340px]" : ""}`}>
        <div
          className="absolute -top-16 -right-16 size-48 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
          style={{ background: colors[i] }}
        />
        <span className="font-display text-7xl leading-none font-semibold tracking-tighter text-white/10 sm:text-8xl">0{i + 1}</span>
        <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h3>
        <p className="mt-3 text-pretty text-muted">{s.text}</p>
        {i < steps.length - 1 && (
          <p className={`mt-5 inline-flex items-center gap-1.5 rounded-md bg-sel/10 px-2 py-1 font-mono text-[10px] text-sel ${horizontal ? "absolute bottom-6 left-8" : ""}`}>
            ⚡ Po kliknięciu → Krok {i + 2}
          </p>
        )}
        {i === steps.length - 1 && (
          <p className={`mt-5 inline-flex items-center gap-1.5 rounded-md bg-fig-green/10 px-2 py-1 font-mono text-[10px] text-fig-green ${horizontal ? "absolute bottom-6 left-8" : ""}`}>
            ✓ Strona online
          </p>
        )}
      </div>
    </div>
  );
}

export default function Process() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [horizontal, setHorizontal] = useState(false);
  const [distance, setDistance] = useState(0);
  const [current, setCurrent] = useState(0);

  // Przewijanie poziome tylko na dużych i wystarczająco wysokich ekranach.
  useLayoutEffect(() => {
    const check = () => setHorizontal(window.innerWidth >= 1024 && window.innerHeight >= 720);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useLayoutEffect(() => {
    const el = track.current;
    if (!horizontal || !el) return setDistance(0);
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [horizontal]);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  useMotionValueEvent(scrollYProgress, "change", (v) => setCurrent(Math.min(steps.length - 1, Math.floor(v * steps.length))));

  const pinned = horizontal && distance > 0;

  return (
    <section
      ref={section}
      id="proces"
      className="relative border-t border-line"
      style={pinned ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div className={pinned ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : "py-28 sm:py-36"}>
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeader
              index="02"
              frame="Proces"
              title={
                <>
                  Jak przebiega <span className="font-serif font-normal italic">zamówienie</span>?
                </>
              }
              lead="Pięć prostych kroków od pierwszej wiadomości do strony, która zarabia. Bez stresu i technicznego żargonu."
            />
            {pinned && (
              <div className="mb-16 hidden items-center gap-3 font-mono text-xs text-muted lg:flex">
                <span>
                  Krok <span className="text-ink">{current + 1}</span>/{steps.length}
                </span>
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= current ? "w-6 bg-sel" : "w-3 bg-white/15"}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <motion.div
          ref={track}
          style={pinned ? { x } : undefined}
          className={`flex px-5 ${horizontal ? "w-max flex-row items-stretch pr-20 pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]" : "flex-col"}`}
        >
          {steps.map((s, i) => (
            <div key={s.title} className={horizontal ? "flex flex-row" : "mx-auto flex w-full max-w-xl flex-col"}>
              <StepCard s={s} i={i} horizontal={horizontal} />
              {i < steps.length - 1 && (horizontal ? <div className="flex px-2"><Connector /></div> : <Connector vertical />)}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
