"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { useLoaded } from "./Providers";
import ScrollLink from "./figma/ScrollLink";
import Button from "./ui/Button";
import { LogoMark, Wordmark } from "./Logo";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Navbar() {
  const loaded = useLoaded();
  const lenis = useLenis();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  useEffect(() => {
    const els = nav.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  const pill = hovered ?? active;

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-4"
        initial={{ y: -100, opacity: 0 }}
        animate={loaded ? { y: 0, opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 1, ease }}
      >
        <nav
          aria-label="Główna nawigacja"
          className={`hairline flex h-14 w-full items-center justify-between rounded-full pr-2 pl-2 transition-all duration-700 ease-out-expo ${
            scrolled
              ? "glass max-w-[860px] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]"
              : "max-w-[1180px] bg-white/[0.02] backdrop-blur-sm"
          }`}
        >
          <Link href="/" className="group flex items-center gap-2.5 pr-3" aria-label={`${site.domain} — strona główna`}>
            <LogoMark className="size-9" />
            <Wordmark className="text-[17px]" />
          </Link>

          <ul className="hidden items-center md:flex" onPointerLeave={() => setHovered(null)}>
            {nav.map((n) => (
              <li key={n.id} className="relative" onPointerEnter={() => setHovered(n.id)}>
                <ScrollLink
                  to={n.id}
                  className={`relative z-10 block px-3.5 py-2 text-[13.5px] transition-colors duration-300 lg:px-4 ${
                    active === n.id || hovered === n.id ? "text-ink" : "text-muted"
                  }`}
                >
                  {n.label}
                </ScrollLink>
                {pill === n.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/[0.07] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <Button to="kontakt" size="md" arrow className="hidden sm:inline-flex">
              Wyceń projekt
            </Button>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="btn btn-ghost size-11 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            >
              <span className={`absolute h-[1.5px] w-4 rounded bg-ink transition-transform duration-500 ease-out-expo ${open ? "rotate-45" : "-translate-y-[3px]"}`} />
              <span className={`absolute h-[1.5px] w-4 rounded bg-ink transition-transform duration-500 ease-out-expo ${open ? "-rotate-45" : "translate-y-[3px]"}`} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-between bg-canvas/90 px-6 pt-28 pb-8 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2 } }}
          >
            <ul className="space-y-1">
              {nav.map((n, i) => (
                <li key={n.id} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.7, ease }}
                  >
                    <ScrollLink
                      to={n.id}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline justify-between border-b border-line py-4 font-display text-[2.6rem] leading-none font-medium tracking-[-0.04em]"
                    >
                      {n.label}
                      <span className="font-mono text-xs text-dim">0{i + 1}</span>
                    </ScrollLink>
                  </motion.div>
                </li>
              ))}
            </ul>
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Button to="kontakt" size="lg" arrow onClick={() => setOpen(false)} className="w-full justify-between">
                Zamów stronę od 200 zł
              </Button>
              <div className="flex justify-between font-mono text-[11px] text-muted">
                <span>{site.email}</span>
                <span>{site.tagline}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
