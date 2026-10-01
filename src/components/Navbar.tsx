"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { useLoaded } from "./Providers";
import ScrollLink from "./figma/ScrollLink";

export default function Navbar() {
  const loaded = useLoaded();
  const lenis = useLenis();
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  // Podświetlenie aktywnej sekcji — jak zaznaczone narzędzie w pasku Figmy.
  useEffect(() => {
    const els = nav.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4"
        initial={{ y: -80, opacity: 0 }}
        animate={loaded ? { y: 0, opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-3 py-2 transition-all duration-500 sm:px-4 ${
            scrolled ? "panel border-line shadow-2xl shadow-black/40" : "border-transparent"
          }`}
          aria-label="Główna nawigacja"
        >
          <Link href="/" className="group flex items-center gap-2" aria-label={`${site.brand} — strona główna`}>
            <Logo />
            <span className="font-display text-lg font-semibold tracking-tight">
              {site.brand}
              <span className="text-sel">.</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 rounded-xl border border-line bg-panel/60 p-1 md:flex">
            {nav.map((n) => (
              <li key={n.id} className="relative">
                <ScrollLink
                  to={n.id}
                  className={`relative z-10 block rounded-lg px-4 py-1.5 text-sm transition-colors ${
                    active === n.id ? "text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {n.label}
                </ScrollLink>
                {active === n.id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-sel"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ScrollLink
              to="kontakt"
              className="hidden rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[1.03] active:scale-95 sm:block"
            >
              Wyceń stronę
            </ScrollLink>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative flex size-10 items-center justify-center rounded-xl border border-line bg-panel md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            >
              <span className={`absolute h-px w-4 bg-ink transition-transform ${open ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-px w-4 bg-ink transition-transform ${open ? "-rotate-45" : "translate-y-1"}`} />
            </button>
          </div>
        </nav>
        <motion.div className="mx-auto mt-2 h-px max-w-6xl origin-left bg-sel/70" style={{ scaleX: scrollYProgress }} />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="canvas-dots fixed inset-0 z-40 flex flex-col justify-between bg-canvas/95 px-6 pt-28 pb-10 backdrop-blur-xl md:hidden"
            initial={{ clipPath: "circle(0% at 92% 6%)" }}
            animate={{ clipPath: "circle(150% at 92% 6%)" }}
            exit={{ clipPath: "circle(0% at 92% 6%)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="space-y-2">
              {nav.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <ScrollLink
                    to={n.id}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-3 font-display text-5xl font-semibold tracking-tighter"
                  >
                    <span className="font-mono text-xs text-sel">0{i + 1}</span>
                    {n.label}
                  </ScrollLink>
                </motion.li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
              <ScrollLink
                to="kontakt"
                onClick={() => setOpen(false)}
                className="block rounded-2xl bg-sel py-4 text-center font-medium text-white"
              >
                Zamów stronę od 200 zł
              </ScrollLink>
              <p className="text-center font-mono text-xs text-muted">{site.email}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Logo() {
  return (
    <span className="relative grid size-8 place-items-center rounded-lg border border-line bg-panel-2 transition-transform duration-500 group-hover:rotate-[20deg]">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <circle cx="5" cy="5" r="3" fill="var(--color-fig-coral)" />
        <rect x="8" y="2" width="6" height="6" rx="1.5" fill="var(--color-fig-purple)" />
        <rect x="2" y="9" width="6" height="5" rx="2.5" fill="var(--color-fig-blue)" />
        <path d="M11 9l3 5H8z" fill="var(--color-fig-green)" />
      </svg>
    </span>
  );
}
