"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { steps } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";
import SpotlightCard from "./ui/SpotlightCard";

const colors = ["#36b5ff", "#9b6bff", "#ff7a6b", "#0acf83", "#ffcd29"];

const icons: Record<(typeof steps)[number]["icon"], React.ReactNode> = {
  chat: <path d="M4 5h12v8H9l-4 3v-3H4z" />,
  receipt: <path d="M5 3h10v14l-2-1.5L11 17l-2-1.5L7 17l-2-1.5zM8 7h4M8 10h4" />,
  pen: <path d="M4 16l1.5-4.5L13 4l3 3-7.5 7.5zM11.5 5.5l3 3" />,
  code: <path d="M7 6l-4 4 4 4M13 6l4 4-4 4M11 4l-2 12" />,
  rocket: <path d="M10 3c3 2 4.5 5 4 9l-2 2H8l-2-2c-.5-4 1-7 4-9zM8 14l-2 3M12 14l2 3M10 8.5v.01" />,
};

function StepCard({ s, i, horizontal }: { s: (typeof steps)[number]; i: number; horizontal: boolean }) {
  return (
    <SpotlightCard className={`rounded-3xl p-6 sm:p-8 ${horizontal ? "h-[360px] w-[400px] shrink-0" : "w-full"}`}>
      <div
        className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full opacity-15 blur-3xl"
        style={{ background: colors[i] }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span
            className="grid size-11 place-items-center rounded-xl shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]"
            style={{ background: `linear-gradient(180deg, ${colors[i]}, ${colors[i]}99)` }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {icons[s.icon]}
            </svg>
          </span>
          <span className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-[11px] text-muted">{s.time}</span>
        </div>

        <h3 className="mt-8 font-display text-2xl font-medium tracking-[-0.03em] sm:text-[28px]">{s.title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted">{s.text}</p>

        <div className={`flex items-end justify-between ${horizontal ? "mt-auto" : "mt-6"}`}>
          <span className={`rounded-md px-2 py-1 font-mono text-[10px] ${i < steps.length - 1 ? "bg-sel/10 text-sel" : "bg-fig-green/10 text-fig-green"}`}>
            {i < steps.length - 1 ? `⚡ Po kliknięciu → Krok ${i + 2}` : "✓ Strona online"}
          </span>
          <span className="font-display text-6xl leading-none font-medium tracking-[-0.06em] text-white/[0.06] sm:text-7xl">0{i + 1}</span>
        </div>
      </div>
    </SpotlightCard>
  );
}

// Połączenie jak w trybie Prototyp w Figmie.
function Noodle() {
  return (
    <svg width="88" height="40" viewBox="0 0 88 40" className="shrink-0 self-center text-sel" aria-hidden>
      <circle cx="5" cy="20" r="4" fill="currentColor" />
      <path d="M9 20 C 34 2, 54 38, 78 20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 4" className="[animation:dash_1s_linear_infinite]" />
      <path d="M76 14l9 6-9 6z" fill="currentColor" />
      <style>{`@keyframes dash{to{stroke-dashoffset:-14}}`}</style>
    </svg>
  );
}

export default function Process() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const timeline = useRef<HTMLDivElement>(null);
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

  const { scrollYProgress: lineProgress } = useScroll({ target: timeline, offset: ["start 70%", "end 60%"] });

  const pinned = horizontal && distance > 0;

  return (
    <section ref={section} id="proces" className="relative" style={pinned ? { height: `calc(100vh + ${distance}px)` } : undefined}>
      <div className={pinned ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : "py-32 sm:py-40"}>
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className={`flex flex-col justify-between gap-8 lg:flex-row lg:items-end ${pinned ? "mb-12" : "mb-14"}`}>
            <SectionHeader
              index="02"
              label="Proces"
              title="Od pomysłu do strony w"
              accent="7 dni."
              lead="Pięć prostych kroków. Bez stresu, bez technicznego żargonu — zawsze wiesz, na jakim etapie jesteśmy."
            />
            {pinned && (
              <div className="mb-3 hidden items-center gap-4 lg:flex">
                <span className="font-mono text-[11px] text-muted">
                  Krok <span className="text-ink">0{current + 1}</span> / 0{steps.length}
                </span>
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all duration-500 ease-out-expo ${i <= current ? "w-8 bg-sel" : "w-4 bg-white/12"}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {horizontal ? (
          <motion.div
            ref={track}
            style={pinned ? { x } : undefined}
            className="flex w-max flex-row items-stretch pr-20 pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]"
          >
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-row">
                <StepCard s={s} i={i} horizontal />
                {i < steps.length - 1 && (
                  <div className="flex px-2">
                    <Noodle />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <div ref={timeline} className="relative mx-auto max-w-xl px-5">
            {/* oś czasu wypełniana przy przewijaniu */}
            <div className="absolute top-2 bottom-2 left-[37px] w-px bg-white/[0.08]" aria-hidden>
              <motion.div className="h-full w-full origin-top bg-gradient-to-b from-sel via-comp to-fig-green" style={{ scaleY: lineProgress }} />
            </div>
            <ol className="space-y-5">
              {steps.map((s, i) => (
                <motion.li
                  key={s.title}
                  className="relative pl-12"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="absolute top-8 left-[11px] grid size-[13px] place-items-center rounded-full bg-canvas ring-1 ring-white/20" aria-hidden>
                    <span className="size-[5px] rounded-full" style={{ background: colors[i] }} />
                  </span>
                  <StepCard s={s} i={i} horizontal={false} />
                </motion.li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
