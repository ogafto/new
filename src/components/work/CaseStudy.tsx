"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import { serviceName, type Project } from "@/lib/site";
import { useLoaded } from "../Providers";
import Button from "../ui/Button";
import { FadeUp } from "../ui/Reveal";
import { ProjectCard } from "./Work";

const ease = [0.16, 1, 0.3, 1] as const;

export default function CaseStudy({ p, next }: { p: Project; next: Project }) {
  const show = useLoaded();
  const router = useRouter();
  const hero = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const order = () => {
    try {
      sessionStorage.setItem("afto:service", p.category);
    } catch {}
    router.push("/#kontakt");
  };

  const meta = [
    ["Klient", p.client],
    ["Usługa", serviceName(p.category)],
    ["Rok", p.year],
    ["Zakres", p.scope.join(", ")],
  ];

  return (
    <main className="pt-36">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-10">
        <motion.p className="kicker" initial={{ opacity: 0 }} animate={show ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}>
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
        className="relative mx-auto mt-16 aspect-[4/3] max-w-[1400px] overflow-hidden px-0 sm:px-10 md:aspect-[16/9]"
        initial={{ opacity: 0, y: 40 }}
        animate={show ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.45, duration: 1.3, ease }}
      >
        <div className="relative size-full overflow-hidden sm:rounded-[28px]">
          <motion.img src={p.image} alt={`${p.name} — ${p.client}`} className="absolute inset-x-0 -top-[9%] h-[118%] w-full object-cover" style={{ y }} />
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${p.name} — zdjęcie ${i + 2}`} loading="lazy" className="w-full rounded-[24px] object-cover" />
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
