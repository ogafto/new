"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { projects, serviceName, services, type Project, type ServiceId } from "@/lib/site";
import { FadeUp, Heading } from "../ui/Reveal";
import { Arrow } from "../ui/Button";
import Tile from "./Tile";
import ProjectDrawer from "./ProjectDrawer";

type Filter = "all" | ServiceId;
const ease = [0.16, 1, 0.3, 1] as const;
const PAGE = 7;

// Kółko "Zobacz" podążające za kursorem nad realizacjami
function CursorBubble({ show }: { show: boolean }) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 350, damping: 30, mass: 0.5 });
  useEffect(() => {
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);
  return (
    <motion.div className="pointer-events-none fixed top-0 left-0 z-40 hidden [@media(pointer:fine)]:block" style={{ x: sx, y: sy }} aria-hidden>
      <motion.div
        className="-translate-x-1/2 -translate-y-1/2 grid size-24 place-items-center rounded-full bg-accent text-[14px] font-medium text-white shadow-[0_10px_30px_-8px_rgb(74_99_255/0.8)]"
        initial={false}
        animate={{ scale: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ duration: 0.35, ease }}
      >
        Zobacz
      </motion.div>
    </motion.div>
  );
}

function Card({ p, i, big, onOpen, onHover }: { p: Project; i: number; big: boolean; onOpen: () => void; onHover: (v: boolean) => void }) {
  return (
    <motion.li
      layout
      className={big ? "md:col-span-2" : ""}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: (i % 2) * 0.08, duration: 1, ease }}
    >
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHover(true)}
        onPointerLeave={() => onHover(false)}
        className="group/tile group block w-full text-left [@media(pointer:fine)]:cursor-none"
      >
        <Tile p={p} className={`w-full ${big ? "aspect-[4/3] md:aspect-[21/10]" : "aspect-[4/3]"}`} />
        <span className="mt-5 flex items-start justify-between gap-6 px-1">
          <span>
            <span className="h-display block text-[28px] lg:text-[34px]">{p.name}</span>
            <span className="mt-1.5 block text-[15px] text-muted">
              {serviceName(p.category)} · {p.client} · {p.year}
            </span>
          </span>
          <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-full border border-line-2 text-ink transition-all duration-500 ease-out-expo group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent">
            <Arrow />
          </span>
        </span>
      </button>
    </motion.li>
  );
}

export default function Work() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState(false);
  const [all, setAll] = useState(false);

  const list = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const visible = all ? list : list.slice(0, PAGE);
  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Wszystkie", count: projects.length },
    ...services.map((s) => ({ id: s.id, label: s.plural, count: projects.filter((p) => p.category === s.id).length })).filter((f) => f.count > 0),
  ];
  const close = useCallback(() => setOpen(null), []);

  return (
    <section id="realizacje" className="mx-auto max-w-[1320px] px-5 py-28 sm:px-8 lg:py-36">
      <div className="mb-14 flex flex-col justify-between gap-10 lg:mb-20 lg:flex-row lg:items-end">
        <div>
          <FadeUp>
            <p className="eyebrow">Realizacje</p>
          </FadeUp>
          <Heading className="mt-6 text-[clamp(2.6rem,5.6vw,5.2rem)]" lines={["Projekty, które", <span key="2" className="text-muted">pracują na wynik.</span>]} />
        </div>
        <FadeUp delay={0.15} className="lg:max-w-[440px]">
          <p className="text-[17px] leading-relaxed text-muted">Każdy projekt zaczyna się od celu biznesowego. Wygląd jest narzędziem — nie ozdobą.</p>
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtruj realizacje">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  setAll(false);
                }}
                aria-pressed={filter === f.id}
                className={`relative h-10 rounded-full px-4 text-[14px] transition-colors ${filter === f.id ? "text-bg" : "text-muted hover:text-ink"}`}
              >
                {filter === f.id && <motion.span layoutId="work-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                {filter !== f.id && <span className="absolute inset-0 rounded-full border border-line-2" />}
                <span className="relative">
                  {f.label} <span className="opacity-50">{f.count}</span>
                </span>
              </button>
            ))}
          </div>
        </FadeUp>
      </div>

      <ul className="grid gap-x-6 gap-y-16 md:grid-cols-2 lg:gap-x-8 lg:gap-y-20">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <Card key={`${filter}-${p.slug}`} p={p} i={i} big={i === 0 && filter === "all"} onOpen={() => setOpen(i)} onHover={setHover} />
          ))}
        </AnimatePresence>
      </ul>

      {list.length > PAGE && !all && (
        <div className="mt-16 flex justify-center">
          <button type="button" onClick={() => setAll(true)} className="btn btn-ghost">
            Pokaż wszystkie ({list.length})
          </button>
        </div>
      )}

      <CursorBubble show={hover && open === null} />
      <ProjectDrawer list={list} index={open} onClose={close} onNav={setOpen} />
    </section>
  );
}
