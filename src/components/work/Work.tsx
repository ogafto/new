"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { projects, serviceName, services, type Project, type ServiceId } from "@/lib/site";
import { LineX, Section } from "../ui/Line";
import ProjectThumb from "./ProjectThumb";
import ProjectDrawer from "./ProjectDrawer";

type Filter = "all" | ServiceId;
const ease = [0.76, 0, 0.24, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

// Podgląd pracy podążający za kursorem (tylko widok listy, tylko mysz)
function HoverPreview({ p }: { p: Project | null }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const t = setTimeout(() => setFine(mq.matches), 0);
    const move = (e: PointerEvent) => {
      x.set(e.clientX + 28);
      y.set(e.clientY - 130);
    };
    window.addEventListener("pointermove", move);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointermove", move);
    };
  }, [x, y]);

  if (!fine) return null;
  return (
    <motion.div className="pointer-events-none fixed top-0 left-0 z-40 hidden lg:block" style={{ x: sx, y: sy }} aria-hidden>
      <AnimatePresence>
        {p && (
          <motion.div
            key={p.slug}
            className="absolute w-[420px] border border-line-strong bg-bg p-2"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            exit={{ clipPath: "inset(0 0 0 100%)" }}
            transition={{ duration: 0.45, ease }}
          >
            <ProjectThumb p={p} className="aspect-[16/10] w-full" />
            <p className="label flex justify-between px-1 pt-2 text-muted">
              <span>{p.client}</span>
              <span className="text-accent">Otwórz ↗</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Work() {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [hover, setHover] = useState<Project | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const list = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Wszystkie", count: projects.length },
    ...services.map((s) => ({ id: s.id, label: s.plural, count: projects.filter((p) => p.category === s.id).length })),
  ];
  const close = useCallback(() => setOpen(null), []);

  return (
    <Section id="prace" index="02" label="Prace">
      <div className="grid lg:grid-cols-4">
        <div className="border-line p-4 sm:p-6 lg:col-span-2 lg:border-r">
          <motion.h2
            className="display text-[clamp(3.2rem,9vw,8.5rem)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, ease }}
          >
            Wybrane
            <br />
            <span className="text-outline">realizacje</span>
          </motion.h2>
        </div>
        <div className="flex flex-col justify-between gap-8 border-t border-line p-4 sm:p-6 lg:col-span-2 lg:border-t-0">
          <p className="max-w-md text-[17px] leading-relaxed text-muted">
            Strony, sklepy, identyfikacje i projekty UI. <span className="text-ink">Najedź, żeby podejrzeć — kliknij, żeby zobaczyć szczegóły.</span>
          </p>
          <p className="display text-right text-[clamp(4rem,8vw,7rem)] text-dim">{pad(list.length)}</p>
        </div>
      </div>

      {/* filtry + widok */}
      <div className="relative flex items-stretch">
        <LineX className="top-0" />
        <div className="flex flex-1 overflow-x-auto [scrollbar-width:none]">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              disabled={f.count === 0}
              aria-pressed={filter === f.id}
              className={`label relative flex h-12 shrink-0 items-center gap-2 border-r border-line px-4 transition-colors disabled:opacity-30 sm:px-6 ${
                filter === f.id ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
              <sup className={filter === f.id ? "text-accent" : "text-dim"}>{pad(f.count)}</sup>
              {filter === f.id && <motion.span layoutId="filter" className="absolute inset-x-0 bottom-0 h-px bg-accent" />}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex">
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`label flex h-12 items-center gap-2 border-l border-line px-5 transition-colors ${view === v ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
            >
              {v === "list" ? "Lista" : "Siatka"}
            </button>
          ))}
        </div>
        <LineX className="bottom-0" />
      </div>

      <div onPointerLeave={() => setHover(null)}>
        {view === "list" ? (
          <ul key={filter}>
            {list.map((p, i) => (
              <motion.li
                key={p.slug}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.05, duration: 0.7, ease }}
              >
                <button
                  type="button"
                  onPointerEnter={() => setHover(p)}
                  onFocus={() => setHover(p)}
                  onClick={() => setOpen(i)}
                  className="group grid w-full grid-cols-[1fr_96px] items-center gap-4 border-b border-line px-4 py-5 text-left transition-colors hover:bg-white/[0.02] sm:px-6 lg:grid-cols-[72px_1fr_260px_100px_56px] lg:py-7"
                >
                  <span className="label hidden text-dim transition-colors group-hover:text-accent lg:block">{pad(i + 1)}</span>
                  <span className="min-w-0">
                    <span className="display block truncate text-[clamp(2.4rem,6vw,5.2rem)] transition-[transform,color] duration-500 ease-out-expo group-hover:translate-x-3 group-hover:text-transparent group-hover:[-webkit-text-stroke:1px_var(--color-accent)]">
                      {p.name}
                    </span>
                    <span className="label mt-2 block text-muted lg:hidden">
                      {serviceName(p.category)} · {p.year}
                    </span>
                  </span>
                  <span className="hidden text-[15px] text-muted lg:block">{serviceName(p.category)}</span>
                  <span className="label hidden text-muted lg:block">{p.year}</span>
                  <span className="hidden size-10 place-items-center border border-line text-muted transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-bg lg:grid">↗</span>
                  <span className="group/mock lg:hidden">
                    <ProjectThumb p={p} className="aspect-[16/10] w-24 border border-line" />
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        ) : (
          <ul key={`g-${filter}`} className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <motion.li
                key={p.slug}
                className="bg-bg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              >
                <button type="button" onClick={() => setOpen(i)} className="group/mock group block w-full p-4 text-left sm:p-5">
                  <ProjectThumb p={p} className="aspect-[16/10] w-full" />
                  <span className="mt-4 flex items-end justify-between gap-4">
                    <span className="display text-[2.4rem] transition-colors group-hover:text-transparent group-hover:[-webkit-text-stroke:1px_var(--color-accent)]">
                      {p.name}
                    </span>
                    <span className="label shrink-0 pb-1 text-muted">{p.year}</span>
                  </span>
                  <span className="label mt-1 block text-muted">{serviceName(p.category)}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <HoverPreview p={view === "list" && open === null ? hover : null} />
      <ProjectDrawer list={list} index={open} onClose={close} onNav={setOpen} />
    </Section>
  );
}
