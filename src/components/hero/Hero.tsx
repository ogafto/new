"use client";

import { motion } from "motion/react";
import { site } from "@/lib/site";
import { useLoaded } from "../Providers";
import Button, { Magnetic } from "../ui/Button";
import { ShowcaseRows, ShowcaseWall } from "./Showcase";

const ease = [0.16, 1, 0.3, 1] as const;

const trust = ["Odpowiedź w 24 godziny", "Stała cena — bez niespodzianek", "Widzisz projekt przed realizacją"];

function Line({ children, i, show }: { children: React.ReactNode; i: number; show: boolean }) {
  return (
    <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
      <motion.span className="block" initial={{ y: "108%" }} animate={show ? { y: "0%" } : {}} transition={{ delay: 0.1 + i * 0.09, duration: 1.2, ease }}>
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const show = useLoaded();
  const fade = (d: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: show ? { opacity: 1, y: 0 } : {},
    transition: { delay: d, duration: 1, ease },
  });

  return (
    <section id="start" className="relative overflow-hidden pt-[72px]">
      <div className="mx-auto grid max-w-[1320px] items-center gap-14 px-5 pt-14 pb-16 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:py-0">
        <div className="relative z-10">
          <motion.p {...fade(0)} className="inline-flex items-center gap-2.5 rounded-full border border-line-2 py-1.5 pr-4 pl-1.5 text-[14px] text-muted">
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[13px] text-accent-2">{site.role}</span>
            {site.location}
          </motion.p>

          <h1 className="h-display mt-8 text-[clamp(2.8rem,5.3vw,5.1rem)]">
            <Line i={0} show={show}>
              Strony, które
            </Line>
            <Line i={1} show={show}>
              wyglądają drogo.
            </Line>
            <Line i={2} show={show}>
              <span className="text-muted">I </span>
              <span className="relative inline-block">
                sprzedają.
                <svg viewBox="0 0 300 24" preserveAspectRatio="none" className="absolute -bottom-[0.06em] left-0 h-[0.16em] w-[96%] overflow-visible text-accent" aria-hidden>
                  <motion.path
                    d="M3 16 C 60 6, 140 4, 297 11"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={show ? { pathLength: 1 } : {}}
                    transition={{ delay: 0.8, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
                  />
                </svg>
              </span>
            </Line>
          </h1>

          <motion.p {...fade(0.5)} className="mt-8 max-w-[34rem] text-[18px] leading-relaxed text-muted lg:text-[19px]">
            Projektuję i koduję strony internetowe, sklepy i identyfikacje wizualne, które budują zaufanie od pierwszego spojrzenia.{" "}
            <span className="text-ink">Jakość dużej agencji — bez agencyjnych cen.</span>
          </motion.p>

          <motion.div {...fade(0.62)} className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Button href="#kontakt">Wyceń projekt</Button>
            </Magnetic>
            <Magnetic>
              <Button href="#realizacje" variant="ghost" arrow={false}>
                Zobacz realizacje
              </Button>
            </Magnetic>
          </motion.div>

          <motion.ul {...fade(0.75)} className="mt-12 flex flex-col gap-3 text-[15px] text-muted sm:flex-row sm:flex-wrap sm:gap-x-7">
            {trust.map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-2" aria-hidden>
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="relative hidden h-[calc(100svh-72px)] min-h-[640px] lg:-mr-[max(32px,calc((100vw-1320px)/2+32px))] lg:block"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={show ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 1.4, ease }}
          aria-hidden
        >
          <ShowcaseWall />
        </motion.div>
      </div>

      <motion.div className="pb-16 lg:hidden" initial={{ opacity: 0 }} animate={show ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 1 }} aria-hidden>
        <ShowcaseRows />
      </motion.div>
    </section>
  );
}
