"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useLoaded } from "./Providers";
import SelectionBox from "./figma/SelectionBox";
import Cursor from "./figma/Cursor";
import Magnetic from "./figma/Magnetic";
import Button from "./ui/Button";
import Studio from "./Studio";
import Stack from "./Stack";

const HeroScene = dynamic(() => import("./three/HeroScene"), { ssr: false });

const ease = [0.16, 1, 0.3, 1] as const;

function Line({ children, delay, show, className = "pb-[0.1em] -mb-[0.1em]" }: { children: React.ReactNode; delay: number; show: boolean; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "115%", rotate: 3 }}
        animate={show ? { y: "0%", rotate: 0 } : {}}
        transition={{ delay, duration: 1.2, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

const points = ["Stała cena", "Projekt w Figmie przed kodowaniem", "30 dni wsparcia"];

export default function Hero() {
  const loaded = useLoaded();
  const top = useRef<HTMLDivElement>(null);
  const inView = useInView(top, { margin: "100px" });
  const { scrollYProgress } = useScroll({ target: top, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Tło: siatka + zorza */}
      <div
        className="grid-lines pointer-events-none absolute inset-x-0 top-0 h-[120svh] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_30%,transparent_100%)]"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute top-[-20%] left-1/2 h-[80svh] w-[120vw] max-w-[1400px] -translate-x-1/2 rounded-[100%] blur-[120px]"
        style={{ background: "radial-gradient(closest-side, rgb(13 153 255 / 0.35), rgb(151 71 255 / 0.18) 55%, transparent)" }}
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 0.6 } : {}}
        transition={{ duration: 2 }}
        aria-hidden
      />

      <div ref={top} className="relative flex min-h-[100svh] items-center pt-28 pb-20 sm:pt-32">
        <div className="absolute inset-0" aria-hidden>
          <HeroScene ready={loaded} active={inView} />
        </div>

        {loaded && (
          <Cursor
            name="Twój klient"
            color="var(--color-fig-green)"
            path={{ x: ["62%", "48%", "56%", "44%"], y: ["82%", "76%", "70%", "79%"] }}
            duration={10}
            delay={1.6}
            className="hidden md:block"
          />
        )}

        <motion.div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 text-center" style={{ y: contentY, opacity: contentOpacity }}>
          <motion.div
            className="hairline glass mb-8 inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 text-[13px] text-muted"
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={loaded ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.8, ease }}
          >
            <span className="flex items-center gap-1.5 rounded-full bg-fig-green/12 px-2.5 py-0.5 text-[12px] text-fig-green">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-fig-green opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-fig-green" />
              </span>
              Dostępny
            </span>
            Przyjmuję nowe projekty
          </motion.div>

          <h1 className="font-display text-[clamp(2.9rem,7.4vw,6rem)] leading-[0.98] font-medium tracking-[-0.055em]">
            <Line delay={0.1} show={loaded} className="relative z-10 -mt-10 -mb-[0.1em] pt-10 pb-[0.1em]">
              <span className="text-silver">Strony, które </span>
              <SelectionBox label="Twój zysk ↑" labelPos="top" labelClassName="hidden sm:block" show={loaded} delay={1.3}>
                <span className="text-accent pr-[0.06em] font-serif font-normal tracking-[-0.02em] italic">sprzedają</span>
              </SelectionBox>
            </Line>
            <Line delay={0.22} show={loaded}>
              <span className="text-silver">od pierwszego spojrzenia.</span>
            </Line>
          </h1>

          <motion.p
            className="mx-auto mt-8 max-w-[600px] text-[17px] leading-relaxed text-pretty text-muted sm:text-lg"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={loaded ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ delay: 0.6, duration: 1, ease }}
          >
            Klienci kupują oczami. Projektuję w Figmie, koduję w Next.js i dodaję animacje 3D, które zatrzymują wzrok —{" "}
            <span className="text-ink">premium wygląd już od 200 zł.</span>
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.75, duration: 1, ease }}
          >
            <Magnetic strength={0.2}>
              <Button to="kontakt" size="lg" arrow>
                Zamów stronę od 200 zł
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button to="portfolio" size="lg" variant="ghost">
                Zobacz realizacje
              </Button>
            </Magnetic>
          </motion.div>

          <motion.ul
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted"
            initial="hidden"
            animate={loaded ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.95 } } }}
          >
            {points.map((p) => (
              <motion.li key={p} className="flex items-center gap-2" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <circle cx="7" cy="7" r="7" fill="rgb(13 153 255 / 0.15)" />
                  <path d="M4.2 7.2l1.8 1.8 3.8-4" stroke="#36b5ff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      <Studio />
      <Stack />
    </section>
  );
}
