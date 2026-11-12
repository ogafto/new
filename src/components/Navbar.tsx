"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { copy, site } from "@/lib/site";
import { useLoaded } from "./Providers";
import { Mark, Wordmark } from "./brand/Logo";
import DiscordButton from "./ui/Discord";
import { TLink } from "./Transition";

const ease = [0.16, 1, 0.3, 1] as const;

// Pasek: logo i „Zamów projekt” (Discord). Bez linków — strona to samo portfolio.
export default function Navbar() {
  const loaded = useLoaded();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  // na telefonach pasek zostaje zawsze na górze; na komputerze chowa się przy przewijaniu w dół
  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(v > 30);
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    setHidden(desktop && v > 500 && v > prev);
  });

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] ${scrolled ? "max-md:bg-bg" : ""}`}
      initial={{ y: -100, opacity: 0 }}
      animate={loaded ? { y: hidden ? -100 : 0, opacity: 1 } : {}}
      transition={{ duration: 0.8, ease }}
    >
      {/* telefon: pełne tło na samym <header> (Safari przedłuża je pod pasek statusu); komputer: szkło z rozmyciem */}
      <div className={`pointer-events-none absolute inset-0 bg-bg/75 backdrop-blur-xl transition-opacity duration-500 max-md:hidden ${scrolled ? "opacity-100" : "opacity-0"}`} aria-hidden />
      <div className="relative">
        <nav aria-label="Główna nawigacja" className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 sm:px-10">
          <TLink href="/" label="Strona główna" className="group flex items-center gap-3" aria-label={`${site.domain}, strona główna`}>
            <Mark className="size-8 transition-transform duration-700 ease-out-expo group-hover:-rotate-12" />
            <Wordmark className="hidden h-[20px] w-auto sm:block" />
          </TLink>
          <DiscordButton className="!h-11 !pl-5 text-[14px] [&_.dot]:!size-8">{copy.hero.cta}</DiscordButton>
        </nav>
        <div className={`h-px bg-gradient-to-r from-transparent via-line-2 to-transparent transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`} />
      </div>
    </motion.header>
  );
}
