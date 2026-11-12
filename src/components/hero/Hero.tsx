"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Media from "../ui/Media";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useLoaded } from "../Providers";
import { useCovering } from "../Transition";
import { copy } from "@/lib/site";
import Button, { Magnetic } from "../ui/Button";
import DiscordButton from "../ui/Discord";
import { TLink } from "../Transition";

type Recent = { id: string; slug: string; name: string; image: string; category: string };

const LogoScene = dynamic(() => import("./LogoScene"), { ssr: false });
const ease = [0.16, 1, 0.3, 1] as const;

function Line({ children, i, show }: { children: React.ReactNode; i: number; show: boolean }) {
  return (
    <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
      <motion.span className="block" initial={{ y: "110%" }} animate={show ? { y: "0%" } : {}} transition={{ delay: 0.35 + i * 0.1, duration: 1.3, ease }}>
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero({ recent }: { recent: Recent[] }) {
  const show = useLoaded();
  // po przejściu z podstrony scena 3D startuje dopiero, gdy kurtyna zjedzie (bez szarpania animacji)
  const covering = useCovering();
  const [scene, setScene] = useState(!covering);
  useEffect(() => {
    if (scene || covering) return;
    const t = setTimeout(() => setScene(true), 950);
    return () => clearTimeout(t);
  }, [scene, covering]);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "120px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const hero = copy.hero;

  return (
    <section ref={ref} id="start" className="relative h-[100svh] min-h-[680px] overflow-hidden">
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={show && scene ? { opacity: 1 } : {}} transition={{ duration: 1.6 }} aria-hidden>
        {scene && <LogoScene ready={show} active={inView} />}
      </motion.div>
      {/* przyciemnienie pod tekstem */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-bg)_2%,transparent_45%),linear-gradient(to_right,rgb(7_7_10/0.7),transparent_55%)]" aria-hidden />

      <motion.div style={{ y, opacity: fade }} className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-12 sm:px-10 sm:pb-16">
        <h1 className="h-display text-[clamp(3.1rem,8.2vw,8.6rem)]">
          <Line i={0} show={show}>
            {hero.line1}
          </Line>
          <Line i={1} show={show}>
            {hero.line2}
          </Line>
          <Line i={2} show={show}>
            <span className="text-accent-2">{hero.accent}</span>
          </Line>
        </h1>

        <div className="mt-10 flex flex-col justify-between gap-10 border-t border-line pt-8 lg:flex-row lg:items-end">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={show ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8, duration: 1, ease }}>
            <p className="max-w-[440px] text-[17px] leading-relaxed text-muted">
              {hero.text}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <DiscordButton>{hero.cta}</DiscordButton>
              </Magnetic>
              <Magnetic>
                <Button href="#portfolio" variant="outline">
                  {hero.secondary}
                </Button>
              </Magnetic>
            </div>
          </motion.div>

          {/* ostatnie projekty — miniatury rozsuwają się po najechaniu, każda otwiera swoją kategorię */}
          {recent.length > 0 && (
            <motion.div className="group hidden items-center gap-5 md:flex" initial={{ opacity: 0, y: 16 }} animate={show ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1, duration: 1, ease }}>
              <a href="#portfolio" className="text-right text-[14px] leading-snug text-muted transition-colors group-hover:text-ink">
                {(() => {
                  const [a, ...b] = hero.recent.split(" ");
                  return (
                    <>
                      {a}
                      <br />
                      {b.join(" ")}
                    </>
                  );
                })()}
              </a>
              <span className="flex">
                {recent.map((p, i) => (
                  <TLink
                    key={p.id}
                    href={`/portfolio/${p.category}#praca-${p.slug}`}
                    label={p.name}
                    aria-label={p.name}
                    className="relative -ml-8 block h-[78px] w-[104px] overflow-hidden rounded-[12px] bg-surface ring-1 ring-white/15 transition-all duration-700 ease-out-expo first:ml-0 group-hover:-ml-1 hover:!-translate-y-1.5 hover:ring-white/40"
                    style={{ zIndex: 4 - i, transform: `rotate(${(i - 1.5) * 3}deg)` }}
                  >
                    <Media src={p.image} fill sizes="104px" className="object-cover" />
                  </TLink>
                ))}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
