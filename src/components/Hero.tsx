"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { animate, motion, useInView } from "motion/react";
import { useLoaded } from "./Providers";
import SelectionBox from "./figma/SelectionBox";
import Cursor from "./figma/Cursor";
import Magnetic from "./figma/Magnetic";
import ScrollLink from "./figma/ScrollLink";
import { site } from "@/lib/site";

const HeroScene = dynamic(() => import("./three/HeroScene"), { ssr: false });

const ease = [0.22, 1, 0.36, 1] as const;

function Line({ children, delay, show, className = "pb-[0.12em] -mb-[0.12em]" }: { children: React.ReactNode; delay: number; show: boolean; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "110%", rotate: 4 }}
        animate={show ? { y: "0%", rotate: 0 } : {}}
        transition={{ delay, duration: 1, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const loaded = useLoaded();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "100px" });

  return (
    <section ref={ref} id="hero" className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16">
      {/* Scena 3D */}
      <div className="absolute inset-0" aria-hidden>
        <HeroScene ready={loaded} active={inView} />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgb(11 11 13 / 0.85), transparent 75%)" }}
        aria-hidden
      />

      <LayersPanel show={loaded} />
      <DesignPanel show={loaded} />

      {loaded && (
        <>
          <Cursor
            name="Twój klient"
            color="var(--color-fig-green)"
            path={{ x: ["58%", "44%", "52%", "40%"], y: ["78%", "70%", "64%", "73%"] }}
            duration={9}
            delay={1.2}
          />
          <Cursor
            name={site.brand}
            color="var(--color-comp)"
            path={{ x: ["24%", "30%", "22%", "34%"], y: ["24%", "40%", "34%", "28%"] }}
            duration={11}
            delay={1.6}
            className="hidden md:block"
          />
        </>
      )}

      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 text-center">
        <motion.div
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 py-1.5 pr-4 pl-2 text-xs text-muted backdrop-blur sm:text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-fig-green opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-fig-green" />
          </span>
          Przyjmuję nowe projekty · <span className="text-ink">{site.tagline}</span>
        </motion.div>

        <h1 className="font-display text-[clamp(2.6rem,9.5vw,7.6rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
          <Line delay={0.1} show={loaded}>
            Strony, które
          </Line>
          <Line delay={0.22} show={loaded} className="relative z-10 -my-8 py-8">
            <SelectionBox label="Twój zysk ↑" show={loaded} delay={1.1} className="mt-1 mb-5 sm:my-3">
              <span className="text-gradient pr-[0.08em] font-serif font-normal tracking-[-0.02em] italic">sprzedają</span>
            </SelectionBox>
          </Line>
          <Line delay={0.34} show={loaded}>
            <span className="text-ink/90">od pierwszego scrolla.</span>
          </Line>
        </h1>

        <motion.p
          className="mx-auto mt-9 max-w-xl text-base text-pretty text-muted sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.8, ease }}
        >
          Projektuję w Figmie i koduję w Next.js. Szybkie, responsywne strony z animacjami, które robią
          wrażenie — <span className="font-medium text-ink">już od 200 zł</span>.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.85, duration: 0.8, ease }}
        >
          <Magnetic>
            <ScrollLink
              to="kontakt"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-sel px-7 py-4 font-medium text-white shadow-[0_10px_40px_-10px] shadow-sel transition-transform active:scale-95"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Zamów stronę od 200 zł
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </ScrollLink>
          </Magnetic>
          <Magnetic>
            <ScrollLink
              to="portfolio"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-panel/70 px-7 py-4 font-medium backdrop-blur transition-colors hover:border-white/25"
            >
              Zobacz realizacje
            </ScrollLink>
          </Magnetic>
        </motion.div>

        <motion.ul
          className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-2 font-mono text-[10px] text-muted sm:text-xs"
          initial="hidden"
          animate={loaded ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 1 } } }}
        >
          {[
            ["200 zł", "cena startowa"],
            ["7 dni", "średni czas"],
            ["100%", "responsywność"],
          ].map(([a, b]) => (
            <motion.li
              key={a}
              className="rounded-xl border border-line bg-panel/50 px-2 py-3 backdrop-blur"
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <span className="block font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{a}</span>
              {b}
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[11px] text-muted sm:flex"
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ delay: 1.6 }}
      >
        <span className="flex h-8 w-5 justify-center rounded-full border border-white/20 pt-1.5">
          <motion.span
            className="h-1.5 w-0.5 rounded-full bg-ink"
            animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </span>
        Przewiń
      </motion.div>
    </section>
  );
}

/* ---------- Panele w stylu Figmy (tylko duże ekrany) ---------- */

const layers = [
  { id: "hero", label: "Hero" },
  { id: "portfolio", label: "Portfolio" },
  { id: "proces", label: "Proces" },
  { id: "uslugi", label: "Usługi" },
  { id: "kontakt", label: "Kontakt" },
  { id: "stopka", label: "Footer" },
];

function LayersPanel({ show }: { show: boolean }) {
  return (
    <motion.aside
      className="panel absolute top-1/2 left-6 z-10 hidden w-52 -translate-y-1/2 rounded-xl p-2 text-xs xl:block"
      initial={{ opacity: 0, x: -30 }}
      animate={show ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: 0.9, duration: 0.8, ease }}
      aria-label="Warstwy strony"
    >
      <div className="flex items-center justify-between px-2 pt-1 pb-2 text-[11px] font-medium">
        <span>Warstwy</span>
        <span className="text-muted">Strona 1</span>
      </div>
      <ul>
        {layers.map((l) => (
          <li key={l.id}>
            <ScrollLink
              to={l.id}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                l.id === "hero" ? "bg-sel/20 text-ink" : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <span className={`font-mono ${l.id === "hero" ? "text-sel" : ""}`}>#</span>
              {l.label}
            </ScrollLink>
          </li>
        ))}
      </ul>
    </motion.aside>
  );
}

function Counter({ to, show }: { to: number; show: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!show) return;
    const c = animate(0, to, {
      duration: 1.6,
      delay: 1.2,
      ease: "easeOut",
      onUpdate: (v) => ref.current && (ref.current.textContent = Math.round(v).toString()),
    });
    return () => c.stop();
  }, [to, show]);
  return <span ref={ref}>0</span>;
}

function Prop({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-2 py-1.5">
      <span className="text-muted">{k}</span>
      <span className="font-mono text-ink">{children}</span>
    </div>
  );
}

function DesignPanel({ show }: { show: boolean }) {
  return (
    <motion.aside
      className="panel absolute top-1/2 right-6 z-10 hidden w-56 -translate-y-1/2 space-y-3 rounded-xl p-3 text-xs xl:block"
      initial={{ opacity: 0, x: 30 }}
      animate={show ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: 1, duration: 0.8, ease }}
      aria-label="Właściwości projektu"
    >
      <div className="flex gap-3 border-b border-line pb-2 text-[11px] font-medium">
        <span>Projekt</span>
        <span className="text-muted">Prototyp</span>
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted">Ramka</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Prop k="W">1440</Prop>
          <Prop k="H">Auto</Prop>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted">Oferta</p>
        <Prop k="Cena od">
          <Counter to={200} show={show} /> zł
        </Prop>
        <Prop k="Realizacja">7 dni</Prop>
        <Prop k="Efekt">wow</Prop>
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted">Wypełnienie</p>
        <div className="flex gap-1.5">
          {["bg-fig-red", "bg-fig-purple", "bg-fig-blue", "bg-fig-green", "bg-fig-yellow"].map((c) => (
            <span key={c} className={`size-5 rounded ${c} ring-1 ring-white/10`} />
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted">Responsywność</p>
        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
          {["Mobile", "Tablet", "Desktop"].map((d) => (
            <span key={d} className="rounded bg-fig-green/15 px-1.5 py-0.5 text-fig-green">
              ✓ {d}
            </span>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
