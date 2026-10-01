"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { projects } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";
import MockSite from "./MockSite";
import { CursorIcon } from "./figma/Cursor";

function ProjectFrame({ p, i }: { p: (typeof projects)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 150, damping: 18 });
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const cx = useSpring(px, { stiffness: 300, damping: 30 });
  const cy = useSpring(py, { stiffness: 300, damping: 30 });

  return (
    <motion.article
      className={`group ${i % 2 === 1 ? "md:mt-24" : ""}`}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* etykieta ramki */}
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-muted">
        <span className="transition-colors group-hover:text-sel">
          # {p.name} <span className="opacity-50">/ Desktop</span>
        </span>
        <span>1440 × 900</span>
      </div>

      <div style={{ perspective: 1200 }}>
        <motion.div
          ref={ref}
          data-own-cursor
          className="relative [@media(pointer:fine)]:cursor-none"
          style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse" || !ref.current) return;
            const r = ref.current.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width);
            my.set((e.clientY - r.top) / r.height);
            px.set(e.clientX - r.left);
            py.set(e.clientY - r.top);
          }}
          onPointerLeave={() => {
            mx.set(0.5);
            my.set(0.5);
          }}
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-panel-2 ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[0_40px_80px_-30px_rgb(13_153_255/0.45)]">
            <MockSite theme={p.theme} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* zaznaczenie po najechaniu */}
          <div className="pointer-events-none absolute -inset-[3px] border-[1.5px] border-sel opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((pos) => (
              <span key={pos} className={`absolute ${pos} size-2 border border-sel bg-white`} />
            ))}
          </div>

          {/* własny kursor z etykietą */}
          <motion.div
            className="pointer-events-none absolute top-0 left-0 z-10 hidden opacity-0 transition-opacity group-hover:opacity-100 [@media(pointer:fine)]:block"
            style={{ x: cx, y: cy, translateZ: 40 }}
            aria-hidden
          >
            <CursorIcon color="var(--color-sel)" />
            <span className="ml-3 block rounded-full rounded-tl-sm bg-sel px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white">Zobacz projekt</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{p.name}</h3>
          <p className="mt-1 text-sm text-muted">{p.category}</p>
        </div>
        <span className="font-mono text-xs text-muted">{p.year}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {p.tags.map((t) => (
          <li key={t} className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-[11px] text-muted">
            {t}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

export default function Portfolio() {
  return (
    <section id="portfolio" className="relative mx-auto max-w-6xl px-5 py-28 sm:py-36">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeader
          index="01"
          frame="Portfolio"
          title={
            <>
              Projekty, które <span className="font-serif font-normal italic">przyciągają</span> wzrok.
            </>
          }
          lead="Każda strona zaczyna się w Figmie, a kończy jako szybki kod w Next.js. Zero szablonów — wszystko szyte na miarę."
        />
      </div>
      <div className="grid gap-x-10 gap-y-16 md:grid-cols-2">
        {projects.map((p, i) => (
          <ProjectFrame key={p.name} p={p} i={i} />
        ))}
      </div>
    </section>
  );
}
