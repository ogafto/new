"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { projects, serviceName, type Project } from "@/lib/site";
import Tile from "../work/Tile";

function Card({ p }: { p: Project }) {
  return (
    <div className="pb-4">
      <Tile p={p} compact className="aspect-[4/3] w-full" />
      <p className="mt-2 flex justify-between px-1 text-[12px] text-muted">
        <span className="text-ink/90">{p.name}</span>
        <span>{serviceName(p.category)}</span>
      </p>
    </div>
  );
}

// Ściana realizacji w perspektywie: kolumny przewijają się w przeciwnych kierunkach.
export function ShowcaseWall() {
  const rx = useSpring(useMotionValue(14), { stiffness: 60, damping: 20 });
  const ry = useSpring(useMotionValue(-16), { stiffness: 60, damping: 20 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      ry.set(-16 + nx * 8);
      rx.set(14 - ny * 6);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [rx, ry]);

  const a = projects.filter((_, i) => i % 2 === 0);
  const b = projects.filter((_, i) => i % 2 === 1);
  const col = (list: Project[], anim: string) => (
    <div className="flex-1 overflow-hidden [&:hover>div]:[animation-play-state:paused]">
      <div className={anim}>
        {[...list, ...list].map((p, i) => (
          <Card key={`${p.slug}-${i}`} p={p} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative h-full [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent),linear-gradient(to_right,transparent,#000_14%)]" style={{ perspective: 1600 }}>
      <motion.div className="absolute inset-[-6%] flex gap-4" style={{ rotateX: rx, rotateY: ry, rotateZ: 6, transformStyle: "preserve-3d" }}>
        {col(a, "animate-marquee-y")}
        {col(b, "animate-marquee-y-rev")}
        {col([...a].reverse(), "animate-marquee-y")}
      </motion.div>
    </div>
  );
}

// Wersja mobilna: dwa rzędy przesuwające się w poziomie
export function ShowcaseRows() {
  const row = (list: Project[], anim: string) => (
    <div className="overflow-hidden">
      <div className={`flex w-max gap-3 ${anim}`}>
        {[...list, ...list].map((p, i) => (
          <div key={`${p.slug}-${i}`} className="w-[220px] shrink-0">
            <Tile p={p} compact className="aspect-[4/3] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-3 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
      {row(projects, "animate-marquee-x")}
      {row([...projects].reverse(), "animate-marquee-x-rev")}
    </div>
  );
}
