"use client";

import { useState } from "react";
import Image from "next/image";
import { TLink } from "../Transition";
import { AnimatePresence, motion } from "motion/react";
import { serviceName, services, type Project, type ServiceId } from "@/lib/site";
import { FadeUp, Heading } from "../ui/Reveal";
import { Arrow } from "../ui/Button";

type Filter = "all" | ServiceId;
const ease = [0.16, 1, 0.3, 1] as const;
const PAGE = 12;

// Karta projektu: duże zdjęcie + podpis pod spodem
export function ProjectCard({ p, wide = false }: { p: Project; wide?: boolean }) {
  return (
    <TLink href={`/portfolio/${p.slug}`} label={p.name} className="group block" aria-label={`${p.name}, ${serviceName(p.category)}`}>
      <div className={`relative overflow-hidden rounded-[20px] bg-surface ${wide ? "aspect-[4/3] md:aspect-[2/1]" : "aspect-[4/3]"}`}>
        <Image
          src={p.image}
          alt={`${p.name}, ${serviceName(p.category).toLowerCase()} dla: ${p.client}`}
          fill
          sizes={wide ? "(min-width: 768px) 90vw, 100vw" : "(min-width: 768px) 45vw, 100vw"}
          className="object-cover object-top transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.035]"
        />
        <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-white/[0.08] ring-inset" />
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <h3 className="flex items-center gap-2 text-[22px] font-medium tracking-[-0.02em] sm:text-[26px]">
            {p.name}
            <Arrow className="size-4 -translate-x-2 opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100" />
          </h3>
          <p className="mt-1 text-[15px] text-muted">{p.client}</p>
        </div>
        <p className="pt-1.5 text-right text-[14px] text-muted">
          {serviceName(p.category)}
          <span className="block text-dim">{p.year}</span>
        </p>
      </div>
    </TLink>
  );
}

export default function AllWork({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [all, setAll] = useState(false);

  const list = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const visible = all ? list : list.slice(0, PAGE);
  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Wszystkie", count: projects.length },
    ...services.map((s) => ({ id: s.id as Filter, label: s.plural, count: projects.filter((p) => p.category === s.id).length })).filter((f) => f.count > 0),
  ];

  return (
    <section className="relative mx-auto max-w-[1400px] px-5 pt-40 pb-32 sm:px-10">
      <div className="mb-14 flex flex-col justify-between gap-10 lg:mb-20 lg:flex-row lg:items-end">
        <div>
          <FadeUp>
            <p className="kicker">Portfolio</p>
          </FadeUp>
          <Heading as="h1" className="mt-7 text-[clamp(2.8rem,6.5vw,6.4rem)]" lines={["Portfolio", <span key="2" className="text-muted">wszystkie projekty</span>]} />
        </div>
        <FadeUp delay={0.1}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtruj projekty">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  setAll(false);
                }}
                aria-pressed={filter === f.id}
                className={`relative h-10 rounded-full px-4 text-[14px] transition-colors duration-300 ${filter === f.id ? "text-bg" : "text-muted hover:text-ink"}`}
              >
                {filter === f.id ? (
                  <motion.span layoutId="work-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                ) : (
                  <span className="absolute inset-0 rounded-full border border-line-2" />
                )}
                <span className="relative">
                  {f.label} <span className="opacity-50">{f.count}</span>
                </span>
              </button>
            ))}
          </div>
        </FadeUp>
      </div>

      <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:gap-x-8 lg:gap-y-20">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => {
            const wide = i === 0 && filter === "all";
            return (
              <motion.li
                key={`${filter}-${p.slug}`}
                layout
                className={wide ? "md:col-span-2" : ""}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: (i % 2) * 0.08, duration: 1.1, ease }}
              >
                <ProjectCard p={p} wide={wide} />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {list.length > PAGE && !all && (
        <div className="mt-16 flex justify-center">
          <button type="button" onClick={() => setAll(true)} className="group btn btn-outline">
            <span className="roll">
              <span>Pokaż wszystkie ({list.length})</span>
              <span aria-hidden>Pokaż wszystkie ({list.length})</span>
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
