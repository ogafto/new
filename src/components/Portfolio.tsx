"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { projects, site } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";
import { Handles } from "./figma/SelectionBox";
import MockSite from "./MockSite";
import Button from "./ui/Button";

type Project = (typeof projects)[number];

function Card({ p, i, progress, total }: { p: Project; i: number; progress: MotionValue<number>; total: number }) {
  const start = i / total;
  const targetScale = 1 - (total - 1 - i) * 0.045;
  const scale = useTransform(progress, [start, 1], [1, targetScale]);
  const dim = useTransform(progress, [start, Math.min(1, start + 1 / total)], [0, i === total - 1 ? 0 : 0.5]);

  return (
    <div className="sticky top-0 flex h-[100svh] items-center justify-center">
      <motion.article
        className="hairline surface relative w-full origin-top overflow-hidden rounded-[28px] bg-surface p-5 sm:p-8 lg:p-10"
        style={{ scale, top: `calc(-6vh + ${i * 22}px)` }}
      >
        {/* poświata w kolorze projektu */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 size-[480px] rounded-full opacity-[0.18] blur-[100px]"
          style={{ background: p.accent }}
          aria-hidden
        />
        <motion.div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-black" style={{ opacity: dim }} aria-hidden />

        <div className="relative grid gap-8 lg:grid-cols-[0.85fr_1.6fr] lg:gap-12">
          <div className="flex flex-col">
            <div className="flex items-center justify-between font-mono text-[11px] text-muted">
              <span>
                <span className="text-ink">0{i + 1}</span> / 0{total}
              </span>
              <span>{p.year}</span>
            </div>
            <h3 className="mt-6 font-display text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:mt-auto">{p.name}</h3>
            <p className="mt-2 text-sm text-muted">{p.category}</p>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-pretty text-muted">{p.description}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <li key={t} className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-[11px] text-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 hidden lg:block">
              <Button to="kontakt" variant="ghost" arrow>
                Chcę podobną stronę
              </Button>
            </div>
          </div>

          {/* okno przeglądarki z makietą */}
          <div>
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-muted">
              <span>
                # {p.name} <span className="text-dim">/ Desktop</span>
              </span>
              <span>1440 × 900</span>
            </div>
            <div className="group/mock relative">
              <div className="overflow-hidden rounded-xl bg-[#18181b] shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_40px_80px_-30px_rgb(0_0_0/0.8)]">
                <div className="flex h-8 items-center gap-3 border-b border-white/[0.06] px-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-2 rounded-full bg-white/15" />
                    ))}
                  </div>
                  <span className="mx-auto flex h-5 max-w-[60%] flex-1 items-center justify-center truncate rounded-md bg-white/[0.05] px-2 font-mono text-[10px] text-muted">
                    {p.slug}.{site.domain}
                  </span>
                </div>
                <div className="@container relative aspect-[16/10] overflow-hidden">
                  <MockSite theme={p.theme} />
                </div>
              </div>
              <div className="pointer-events-none absolute -inset-[3px] border-[1.5px] border-sel opacity-0 transition-opacity duration-300 group-hover/mock:opacity-100">
                <Handles />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-[4px] bg-sel px-1.5 py-px font-mono text-[10px] text-white">
                  Najedź, by przewinąć ↓
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

export default function Portfolio() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });

  return (
    <section id="portfolio" className="relative mx-auto max-w-6xl px-4 pt-32 sm:px-5 sm:pt-40">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SectionHeader
          index="01"
          label="Portfolio"
          title="Projekty, od których trudno"
          accent="oderwać wzrok."
          lead="Każda strona zaczyna się w Figmie, a kończy jako szybki kod w Next.js. Zero gotowych szablonów — wszystko szyte na miarę."
        />
        <p className="shrink-0 font-mono text-[11px] text-muted md:mb-3">
          <span className="text-ink">0{projects.length}</span> wybrane realizacje ↓
        </p>
      </div>

      <div ref={container} className="relative mt-4">
        {projects.map((p, i) => (
          <Card key={p.slug} p={p} i={i} progress={scrollYProgress} total={projects.length} />
        ))}
      </div>
    </section>
  );
}
