"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { projects, serviceName, services, type Project, type ServiceId } from "@/lib/site";
import { FadeUp, Heading } from "../ui/Reveal";
import ProjectDrawer from "./ProjectDrawer";

type Filter = "all" | ServiceId;
const ease = [0.16, 1, 0.3, 1] as const;
const PAGE = 6;

// Kółko "Zobacz" podążające za kursorem
function CursorBubble({ show }: { show: boolean }) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 });
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
        className="-translate-x-1/2 -translate-y-1/2 grid size-[92px] place-items-center rounded-full bg-accent text-[14px] font-medium text-white"
        initial={false}
        animate={{ scale: show ? 1 : 0 }}
        transition={{ duration: 0.4, ease }}
      >
        Zobacz
      </motion.div>
    </motion.div>
  );
}

// Układ redakcyjny: duży / mały na zmianę
const layout = ["lg:col-span-7", "lg:col-span-5 lg:mt-32", "lg:col-span-5", "lg:col-span-7 lg:mt-32"];

function Card({ p, i, onOpen, onHover }: { p: Project; i: number; onOpen: () => void; onHover: (v: boolean) => void }) {
  return (
    <motion.li layout className={layout[i % 4]} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease }}>
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHover(true)}
        onPointerLeave={() => onHover(false)}
        className="group block w-full text-left [@media(pointer:fine)]:cursor-none"
      >
        <motion.div
          className="edge relative aspect-[4/3] overflow-hidden rounded-[22px] bg-surface"
          initial={{ clipPath: "inset(18% 0 0 0 round 22px)", opacity: 0 }}
          whileInView={{ clipPath: "inset(0% 0 0 0 round 22px)", opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.3, ease }}
        >
          <motion.img
            src={p.image}
            alt={`${p.name} — ${p.client}`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.045]"
            initial={{ scale: 1.15 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease }}
          />
          {/* smuga światła */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_35%,rgb(180_162_255/0.22)_50%,transparent_65%)] transition-transform duration-[1.3s] ease-out-expo group-hover:translate-x-full" />
        </motion.div>

        <div className="relative mt-5 flex items-baseline justify-between gap-6 pt-4">
          <span className="absolute top-0 left-0 h-px w-full bg-line" />
          <span className="absolute top-0 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-out-expo group-hover:scale-x-100" />
          <span className="flex items-baseline gap-4">
            <span className="text-[13px] text-dim tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="h-display text-[28px] tracking-[-0.03em] lg:text-[34px]">{p.name}</span>
          </span>
          <span className="text-right text-[14px] text-muted">
            {serviceName(p.category)} <span className="text-dim">· {p.year}</span>
          </span>
        </div>
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
    <section id="realizacje" className="relative mx-auto max-w-[1400px] px-5 py-32 sm:px-10 lg:py-44">
      <div className="mb-16 flex flex-col justify-between gap-10 lg:mb-24 lg:flex-row lg:items-end">
        <div>
          <FadeUp>
            <p className="kicker">Realizacje</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.6rem)]" lines={["Wybrane", <span key="2" className="text-muted">projekty</span>]} />
        </div>
        <FadeUp delay={0.1}>
          <div className="flex flex-wrap gap-x-7 gap-y-3" role="group" aria-label="Filtruj realizacje">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  setAll(false);
                }}
                aria-pressed={filter === f.id}
                className={`relative pb-2 text-[15px] transition-colors ${filter === f.id ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {f.label}
                <sup className="ml-1 text-[11px] text-dim">{f.count}</sup>
                {filter === f.id && <motion.span layoutId="work-filter" className="absolute inset-x-0 bottom-0 h-px bg-accent" />}
              </button>
            ))}
          </div>
        </FadeUp>
      </div>

      <ul className="grid gap-x-10 gap-y-20 lg:grid-cols-12 lg:gap-y-28">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <Card key={`${filter}-${p.slug}`} p={p} i={i} onOpen={() => setOpen(i)} onHover={setHover} />
          ))}
        </AnimatePresence>
      </ul>

      {list.length > PAGE && !all && (
        <div className="mt-24 flex justify-center">
          <button type="button" onClick={() => setAll(true)} className="group btn btn-outline">
            <span className="roll">
              <span>Pokaż wszystkie — {list.length}</span>
              <span aria-hidden>Pokaż wszystkie — {list.length}</span>
            </span>
          </button>
        </div>
      )}

      <CursorBubble show={hover && open === null} />
      <ProjectDrawer list={list} index={open} onClose={close} onNav={setOpen} />
    </section>
  );
}
