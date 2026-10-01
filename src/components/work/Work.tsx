"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { projects, serviceName, type Project } from "@/lib/site";
import { TLink } from "../Transition";
import { FadeUp, Heading } from "../ui/Reveal";
import { Arrow } from "../ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;
const FEATURED = 6;
const list = projects.slice(0, FEATURED);

// Kafel = zdjęcie; podpis na zdjęciu, delikatna paralaksa w poziomie
function Tile({ p, i, progress, big }: { p: Project; i: number; progress: MotionValue<number>; big: boolean }) {
  const x = useTransform(progress, [0, 1], ["5%", "-5%"]);
  return (
    <TLink
      href={`/realizacje/${p.slug}`}
      label={p.name}
      className={`group relative block shrink-0 overflow-hidden rounded-[26px] bg-surface ${
        big ? "h-[66svh] w-[min(58vw,1040px)]" : "h-[52svh] w-[min(38vw,680px)] self-end"
      }`}
      aria-label={`${p.name} — ${serviceName(p.category)}`}
    >
      <motion.span className="absolute inset-y-0 -left-[6%] block w-[112%]" style={{ x }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt="" loading="lazy" className="size-full object-cover object-top transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]" />
      </motion.span>
      <span className="absolute inset-0 bg-[linear-gradient(to_top,rgb(7_7_10/0.94),rgb(7_7_10/0.55)_28%,transparent_58%)]" />
      <span className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-white/[0.08] ring-inset" />

      <span className="absolute top-5 left-6 text-[13px] text-white/60 tabular-nums">0{i + 1}</span>
      <span className="absolute top-5 right-5 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[12px] text-white/80 backdrop-blur-md">{serviceName(p.category)}</span>

      <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-6">
        <span>
          <span className={`h-display block text-white ${big ? "text-[clamp(2.4rem,4.4vw,4.6rem)]" : "text-[clamp(2rem,3vw,3rem)]"}`}>{p.name}</span>
          <span className="mt-2 block text-[15px] text-white/60">
            {p.client} · {p.year}
          </span>
        </span>
        <span className="grid size-14 shrink-0 translate-y-3 scale-75 place-items-center rounded-full bg-white text-bg opacity-0 transition-all duration-700 ease-out-expo group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
          <Arrow className="size-4" />
        </span>
      </span>
    </TLink>
  );
}

// Telefon / tablet: pionowa lista kafli
function MobileList() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 sm:px-10 lg:hidden">
      <ul className="grid gap-5 sm:grid-cols-2">
        {list.slice(0, 4).map((p, i) => (
          <motion.li key={p.slug} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: (i % 2) * 0.08, duration: 1, ease }}>
            <TLink href={`/realizacje/${p.slug}`} label={p.name} className="group relative block aspect-[4/5] overflow-hidden rounded-[22px] bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
              <span className="absolute inset-0 bg-[linear-gradient(to_top,rgb(7_7_10/0.85),transparent_55%)]" />
              <span className="absolute top-4 right-4 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[12px] text-white/80 backdrop-blur-md">{serviceName(p.category)}</span>
              <span className="absolute inset-x-5 bottom-5">
                <span className="h-display block text-[2.4rem] text-white">{p.name}</span>
                <span className="mt-1 block text-[14px] text-white/60">
                  {p.client} · {p.year}
                </span>
              </span>
            </TLink>
          </motion.li>
        ))}
      </ul>
      <div className="mt-10 flex justify-center">
        <TLink href="/realizacje" label="Realizacje" className="group btn btn-outline">
          <span className="roll">
            <span>Wszystkie realizacje — {projects.length}</span>
            <span aria-hidden>Wszystkie realizacje — {projects.length}</span>
          </span>
        </TLink>
      </div>
    </div>
  );
}

export default function Work() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [current, setCurrent] = useState(0);

  // przewijanie w pionie przesuwa pas kafli w poziomie
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setDist(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (v) => -v * dist);
  useMotionValueEvent(scrollYProgress, "change", (v) => setCurrent(Math.min(list.length - 1, Math.floor(v * list.length))));

  return (
    <section id="realizacje" className="relative py-32 lg:py-0">
      <div className="mx-auto mb-14 max-w-[1400px] px-5 sm:px-10 lg:hidden">
        <FadeUp>
          <p className="kicker">Realizacje</p>
        </FadeUp>
        <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.4rem)]" lines={["Wybrane", <span key="2" className="text-muted">realizacje</span>]} />
      </div>
      <MobileList />

      <div ref={wrap} className="relative hidden lg:block" style={{ height: `calc(100svh + ${dist}px)` }}>
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
          <motion.div ref={track} className="flex w-max items-stretch gap-6 px-10 pt-16" style={{ x }}>
            {/* wstęp */}
            <div className="flex w-[min(30vw,460px)] shrink-0 flex-col justify-between py-2 pr-6">
              <div>
                <FadeUp>
                  <p className="kicker">Realizacje</p>
                </FadeUp>
                <Heading className="mt-7 text-[clamp(3rem,5.4vw,6rem)]" lines={["Wybrane", <span key="2" className="text-muted">realizacje</span>]} />
              </div>
              <FadeUp delay={0.15}>
                <p className="max-w-[340px] text-[16px] leading-relaxed text-muted">Strony, sklepy i marki projektowane od zera. Przewiń, żeby zobaczyć więcej.</p>
                <motion.span className="mt-8 flex items-center gap-3 text-[13px] text-dim" animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
                  <span className="h-px w-10 bg-dim" />
                  Przewiń
                </motion.span>
              </FadeUp>
            </div>

            {list.map((p, i) => (
              <Tile key={p.slug} p={p} i={i} progress={scrollYProgress} big={i % 2 === 0} />
            ))}

            {/* wszystkie */}
            <TLink href="/realizacje" label="Realizacje" className="group edge relative flex w-[min(30vw,460px)] shrink-0 flex-col justify-between overflow-hidden rounded-[26px] bg-surface p-8">
              <span className="absolute -right-24 -bottom-24 size-[360px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.28),transparent)] transition-transform duration-1000 ease-out-expo group-hover:scale-125" />
              <span className="relative text-[14px] text-muted">{projects.length} projektów</span>
              <span className="relative">
                <span className="h-display block text-[clamp(2.6rem,4vw,4rem)]">
                  Wszystkie
                  <br />
                  <span className="text-muted transition-colors duration-500 group-hover:text-accent-2">realizacje</span>
                </span>
                <span className="mt-8 grid size-14 place-items-center rounded-full bg-white text-bg transition-transform duration-700 ease-out-expo group-hover:rotate-45">
                  <Arrow className="size-4" />
                </span>
              </span>
            </TLink>
          </motion.div>

          {/* postęp */}
          <div className="mx-auto mt-10 flex w-full max-w-[1400px] items-center gap-6 px-10">
            <span className="w-14 text-[13px] text-muted tabular-nums">
              0{current + 1} / 0{list.length}
            </span>
            <span className="relative h-px flex-1 bg-line">
              <motion.span className="absolute inset-0 origin-left bg-accent" style={{ scaleX: scrollYProgress }} />
            </span>
            <span className="w-40 truncate text-right text-[13px] text-muted">{list[current].name}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
