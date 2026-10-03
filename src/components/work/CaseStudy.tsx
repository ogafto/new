"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { serviceName, type Project } from "@/lib/site";
import { useLoaded } from "../Providers";
import Button from "../ui/Button";
import { FadeUp } from "../ui/Reveal";
import { ProjectCard } from "./AllWork";
import { TLink, usePageTransition } from "../Transition";

const ease = [0.16, 1, 0.3, 1] as const;

export default function CaseStudy({ p, next }: { p: Project; next: Project }) {
  const show = useLoaded();
  const go = usePageTransition();
  const hero = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const order = () => {
    try {
      sessionStorage.setItem("afto:service", p.category);
    } catch {}
    go("/#kontakt", "Kontakt");
  };

  const meta = [
    ["Klient", p.client],
    ["Usługa", serviceName(p.category)],
    ["Rok", p.year],
    ["Zakres", p.scope.join(", ")],
  ];

  return (
    <main className="pt-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-10">
        <motion.div className="flex items-center justify-between gap-6" initial={{ opacity: 0.001, y: -8 }} animate={show ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease }}>
          <TLink href="/#portfolio" label="Strona główna" className="group inline-flex items-center gap-3 rounded-full border border-line-2 py-2 pr-5 pl-2 text-[14px] text-muted transition-colors duration-500 hover:border-white/30 hover:text-ink">
            <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-white/[0.06] transition-colors duration-500 group-hover:bg-accent group-hover:text-white">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-0.5" aria-hidden>
                <path d="M11 7H3M6.5 3.5L3 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Wróć na stronę główną
          </TLink>
          <TLink href="/portfolio" label="Portfolio" className="link-u hidden text-[14px] text-muted hover:text-ink sm:block">
            Całe portfolio
          </TLink>
        </motion.div>
        <motion.p className="kicker mt-14" initial={{ opacity: 0 }} animate={show ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}>
          {serviceName(p.category)}
        </motion.p>
        <h1 className="h-display mt-7 overflow-hidden pb-[0.1em] text-[clamp(3.4rem,11vw,10rem)]">
          <motion.span className="block" initial={{ y: "105%" }} animate={show ? { y: 0 } : {}} transition={{ delay: 0.1, duration: 1.2, ease }}>
            {p.name}
          </motion.span>
        </h1>

        <motion.dl
          className="mt-12 grid grid-cols-2 gap-y-6 border-t border-line pt-6 text-[15px] lg:grid-cols-4"
          initial={{ opacity: 0, y: 16 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 1, ease }}
        >
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[13px] text-dim">{k}</dt>
              <dd className="mt-1.5">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      <motion.div
        ref={hero}
        className="relative mx-auto mt-12 max-w-[1400px] px-5 sm:mt-16 sm:px-10"
        initial={{ clipPath: "inset(14% 8% 0% 8% round 28px)", y: 40 }}
        animate={show ? { clipPath: "inset(0% 0% 0% 0% round 0px)", y: 0 } : {}}
        transition={{ delay: 0.3, duration: 1.3, ease }}
      >
        {/* telefon: całe zdjęcie 4:3 bez przycinania; od sm: szerszy kadr z paralaksą */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] ring-1 ring-white/10 sm:rounded-[28px] md:aspect-[16/9]">
          <motion.div className="absolute inset-0 max-sm:!transform-none sm:inset-x-0 sm:-top-[9%] sm:h-[118%]" style={{ y }}>
            <Image src={p.image} alt={`${p.name} — ${serviceName(p.category).toLowerCase()} dla: ${p.client}`} fill preload sizes="(min-width: 1400px) 1320px, 100vw" className="object-cover" />
          </motion.div>
        </div>
      </motion.div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 sm:px-10 lg:grid-cols-[1fr_1.4fr] lg:py-32">
        <FadeUp>
          <p className="kicker">O projekcie</p>
        </FadeUp>
        <div>
          <FadeUp>
            <p className="text-[clamp(1.5rem,2.6vw,2.2rem)] leading-[1.3] font-normal tracking-[-0.02em]">{p.description}</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="mt-12 flex gap-3">
              {p.palette.map((c) => (
                <div key={c}>
                  <span className="block size-16 rounded-2xl ring-1 ring-white/10" style={{ background: c }} />
                  <span className="mt-2 block text-[12px] text-dim">{c}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>

      {p.gallery && p.gallery.length > 0 && (
        <div className="mx-auto grid max-w-[1400px] gap-5 px-5 pb-24 sm:px-10 md:grid-cols-2">
          {p.gallery.map((src, i) => (
            <FadeUp key={src} delay={(i % 2) * 0.08} className={i % 3 === 0 ? "md:col-span-2" : ""}>
              <Image src={src} alt={`${p.name} — ${p.client}, zdjęcie ${i + 2}`} width={1600} height={1200} sizes="(min-width: 768px) 50vw, 100vw" className="h-auto w-full rounded-[24px] object-cover" />
            </FadeUp>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-5 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-6 border-y border-line py-10 sm:flex-row sm:items-center">
          <p className="h-display text-[clamp(1.8rem,3.5vw,3rem)]">Chcesz coś podobnego?</p>
          <Button onClick={order}>Zamów podobny projekt</Button>
        </div>

        <div className="py-24">
          <p className="kicker mb-8">Następny projekt</p>
          <ProjectCard p={next} wide />
        </div>
      </div>
    </main>
  );
}
