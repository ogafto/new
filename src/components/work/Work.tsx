"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { projects, serviceName, services, type Project, type ServiceId } from "@/lib/site";
import { FadeUp, Heading } from "../ui/Reveal";
import { Arrow } from "../ui/Button";

type Filter = "all" | ServiceId;
const ease = [0.16, 1, 0.3, 1] as const;
const PAGE = 7;

// Karta = zdjęcie. Podpis leży na zdjęciu, obraz lekko "płynie" przy przewijaniu.
export function ProjectCard({ p, wide = false, priority = false }: { p: Project; wide?: boolean; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <Link ref={ref} href={`/realizacje/${p.slug}`} className="group relative block overflow-hidden rounded-[24px] bg-surface" aria-label={`${p.name} — ${serviceName(p.category)}`}>
      <div className={`relative ${wide ? "aspect-[4/3] md:aspect-[21/9]" : "aspect-[4/3]"}`}>
        <motion.img
          src={p.image}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-x-0 -top-[7%] h-[114%] w-full object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]"
          style={{ y }}
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(7_7_10/0.85),rgb(7_7_10/0.15)_45%,transparent_70%)]" />
        <span className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/10 ring-inset" />

        <span className="absolute top-5 left-5 rounded-full bg-black/35 px-3 py-1.5 text-[13px] text-white/85 backdrop-blur-md">{serviceName(p.category)}</span>
        <span className="absolute top-5 right-5 grid size-11 scale-75 place-items-center rounded-full bg-white text-bg opacity-0 transition-all duration-500 ease-out-expo group-hover:scale-100 group-hover:opacity-100">
          <Arrow />
        </span>

        <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-6 sm:inset-x-8 sm:bottom-7">
          <span>
            <span className="h-display block text-[30px] text-white transition-transform duration-700 ease-out-expo group-hover:-translate-y-1 sm:text-[40px]">{p.name}</span>
            <span className="mt-1.5 block text-[14px] text-white/65">{p.client}</span>
          </span>
          <span className="text-[14px] text-white/55 tabular-nums">{p.year}</span>
        </span>
      </div>
    </Link>
  );
}

export default function Work() {
  const [filter, setFilter] = useState<Filter>("all");
  const [all, setAll] = useState(false);

  const list = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const visible = all ? list : list.slice(0, PAGE);
  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Wszystkie", count: projects.length },
    ...services.map((s) => ({ id: s.id, label: s.plural, count: projects.filter((p) => p.category === s.id).length })).filter((f) => f.count > 0),
  ];

  return (
    <section id="realizacje" className="relative mx-auto max-w-[1400px] px-5 py-32 sm:px-10 lg:py-40">
      <div className="mb-14 flex flex-col justify-between gap-10 lg:mb-20 lg:flex-row lg:items-end">
        <div>
          <FadeUp>
            <p className="kicker">Realizacje</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.4rem)]" lines={["Wybrane", <span key="2" className="text-muted">projekty</span>]} />
        </div>
        <FadeUp delay={0.1}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtruj realizacje">
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

      <ul className="grid gap-5 md:grid-cols-2 lg:gap-6">
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
              <span>Pokaż wszystkie — {list.length}</span>
              <span aria-hidden>Pokaż wszystkie — {list.length}</span>
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
