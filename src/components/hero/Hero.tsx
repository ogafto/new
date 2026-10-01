"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { projects, site } from "@/lib/site";
import { useLoaded } from "../Providers";
import { Arrow, Cross, LineX } from "../ui/Line";
import RidgeField from "./RidgeField";
import Eye from "./Eye";

const ease = [0.76, 0, 0.24, 1] as const;

function Reveal({ children, delay, show }: { children: React.ReactNode; delay: number; show: boolean }) {
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span className="block" initial={{ y: "102%" }} animate={show ? { y: "0%" } : {}} transition={{ delay, duration: 1.1, ease }}>
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const loaded = useLoaded();
  const coords = useRef<HTMLSpanElement>(null);

  // współrzędne kursora jak w programie graficznym
  useEffect(() => {
    const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");
    const onMove = (e: PointerEvent) => {
      if (coords.current) coords.current.textContent = `X ${pad(e.clientX)}  Y ${pad(e.clientY + window.scrollY)}`;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const cells = [
    <>{site.brand} — grafika & web design</>,
    <>Strony · Sklepy · Branding · UI/UX</>,
    <>
      <span className="mr-2 inline-block size-1.5 bg-accent align-middle" /> Przyjmuję zlecenia
    </>,
    <span key="c" ref={coords} className="tabular-nums">
      X 0000 Y 0000
    </span>,
  ];

  return (
    <section id="start" className="relative flex min-h-[100svh] flex-col pt-14">
      <div className="relative grid grid-cols-2 lg:grid-cols-4">
        {cells.map((c, i) => (
          <motion.div
            key={i}
            className={`label flex h-11 items-center border-line px-4 text-muted sm:px-6 ${i % 2 === 0 ? "border-r" : ""} ${i === 1 ? "lg:border-r" : ""} ${i >= 2 ? "hidden lg:flex" : ""}`}
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            {c}
          </motion.div>
        ))}
        <LineX className="bottom-0" />
      </div>

      <div className="relative min-h-[56svh] flex-1">
        <RidgeField className="absolute inset-0 h-full w-full" />
        <h1 className="display relative z-10 px-4 pt-[5vh] text-[clamp(3.2rem,13.2vw,13.5rem)] sm:px-6">
          <Reveal delay={0.1} show={loaded}>Klienci kupują</Reveal>
          <Reveal delay={0.22} show={loaded}>
            <Eye />
            czami.
          </Reveal>
        </h1>
      </div>

      <div className="relative z-10 grid bg-bg lg:grid-cols-4">
        <LineX className="top-0" />
        <Cross className="-top-[5px] -left-[6px]" />
        <Cross className="-top-[5px] -right-[6px]" />
        <motion.p
          className="border-line p-4 text-[17px] leading-relaxed text-muted sm:p-6 lg:col-span-2 lg:border-r lg:text-[19px]"
          initial={{ opacity: 0, y: 12 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Twoja strona ma kilka sekund, żeby przekonać klienta.{" "}
          <span className="text-ink">Projektuję i koduję strony, sklepy i identyfikacje wizualne, które robią to od pierwszego spojrzenia.</span>
        </motion.p>
        <a href="#prace" className="group relative flex min-h-[120px] flex-col justify-between border-t border-line p-4 sm:p-6 lg:border-t-0 lg:border-r">
          <span className="label text-muted">Portfolio · {String(projects.length).padStart(2, "0")} prace</span>
          <span className="flex items-end justify-between">
            <span className="display text-[34px] lg:text-[44px]">Zobacz prace</span>
            <span className="text-2xl transition-transform duration-500 ease-out-expo group-hover:translate-y-1">↓</span>
          </span>
        </a>
        <a href="#kontakt" className="group relative flex min-h-[120px] flex-col justify-between bg-accent p-4 text-bg transition-colors duration-300 hover:bg-ink sm:p-6">
          <span className="label">Odpowiedź w 24 h</span>
          <span className="flex items-end justify-between">
            <span className="display text-[34px] lg:text-[44px]">Wyceń projekt</span>
            <Arrow className="size-7 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </a>
      </div>
    </section>
  );
}
