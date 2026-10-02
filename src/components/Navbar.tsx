"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { useLoaded } from "./Providers";
import { Mark, Wordmark } from "./brand/Logo";
import Button from "./ui/Button";
import { TLink, usePageTransition } from "./Transition";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Navbar() {
  const loaded = useLoaded();
  const lenis = useLenis();
  const go = usePageTransition();
  const home = usePathname() === "/";
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  // na telefonach pasek zostaje zawsze na górze; na komputerze chowa się przy przewijaniu w dół
  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(v > 30);
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    setHidden(desktop && v > 500 && v > prev && !open);
  });

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  const href = (h: string) => (home ? h : `/${h}`);

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-500 ${scrolled || open ? "max-md:bg-bg" : ""}`}
        initial={{ y: -100, opacity: 0 }}
        animate={loaded ? { y: hidden ? -100 : 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease }}
      >
        {/* iOS (Safari 26) wypełnia pas pod paskiem statusu kolorem tła samego <header> — stąd max-md:bg-bg wyżej.
            Ta warstwa daje rozmycie na komputerze i zapas ponad krawędzią dla starszych iOS. */}
        <div
          className={`pointer-events-none absolute inset-x-0 -top-[120px] bottom-0 transition-opacity duration-500 ${scrolled || open ? "opacity-100" : "opacity-0"} bg-bg/[0.97] md:bg-bg/75 md:backdrop-blur-xl`}
          aria-hidden
        />
        <div className="relative">
          <nav aria-label="Główna nawigacja" className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 sm:px-10">
            <TLink href="/" label="Strona główna" className="group flex items-center gap-3" aria-label={`${site.domain} — strona główna`} onClick={() => setOpen(false)}>
              <Mark className="size-8 transition-transform duration-700 ease-out-expo group-hover:-rotate-12" />
              <Wordmark className="hidden h-[20px] w-auto sm:block" />
            </TLink>

            <ul className="hidden items-center gap-10 md:flex">
              {nav.map((n) => (
                <li key={n.href}>
                  <TLink href={href(n.href)} label={n.label} className="group text-[15px] text-muted transition-colors hover:text-ink">
                    <span className="roll">
                      <span>{n.label}</span>
                      <span aria-hidden>{n.label}</span>
                    </span>
                  </TLink>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2.5">
              <Button href={href("#kontakt")} label="Kontakt" className="hidden !h-11 !pl-5 text-[14px] sm:inline-flex [&_.dot]:!size-8">
                Wyceń projekt
              </Button>
              <TLink
                href="/konto"
                label="Panel klienta"
                className="group relative grid size-11 place-items-center overflow-hidden rounded-full border border-line-2 text-muted transition-colors duration-500 hover:border-accent/60 hover:text-ink"
                aria-label="Konto — logowanie do panelu klienta"
                title="Panel klienta"
              >
                <span className="absolute inset-0 scale-0 rounded-full bg-accent/15 transition-transform duration-500 ease-out-expo group-hover:scale-100" />
                <svg viewBox="0 0 24 24" className="relative size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <circle cx="12" cy="8.5" r="3.6" className="origin-center transition-transform duration-500 ease-out-expo group-hover:-translate-y-[1.5px]" />
                  <path d="M4.8 19.5c1.3-3.1 4-4.7 7.2-4.7s5.9 1.6 7.2 4.7" />
                </svg>
              </TLink>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative grid size-11 place-items-center rounded-full border border-line-2 md:hidden"
                aria-expanded={open}
                aria-controls="menu"
                aria-label={open ? "Zamknij menu" : "Otwórz menu"}
              >
                <span className={`absolute h-px w-4 bg-ink transition-transform duration-500 ease-out-expo ${open ? "rotate-45" : "-translate-y-[3px]"}`} />
                <span className={`absolute h-px w-4 bg-ink transition-transform duration-500 ease-out-expo ${open ? "-rotate-45" : "translate-y-[3px]"}`} />
              </button>
            </div>
          </nav>
          <div className={`h-px bg-gradient-to-r from-transparent via-line-2 to-transparent transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`} />
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div id="menu" className="fixed inset-0 z-40 flex flex-col justify-between bg-bg px-5 pt-28 pb-8 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.15 } }}>
            <ul>
              {[{ href: "#start", label: "Start" }, ...nav].map((n, i) => (
                <li key={n.href} className="overflow-hidden border-b border-line">
                  <motion.a
                    href={href(n.href)}
                    onClick={(e) => {
                      setOpen(false);
                      if (!home) {
                        e.preventDefault();
                        go(href(n.href), n.label);
                      }
                    }}
                    className="h-display flex items-baseline justify-between py-4 text-[2.8rem]"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.8, ease }}
                  >
                    {n.label}
                    <span className="text-[13px] tracking-normal text-dim">0{i + 1}</span>
                  </motion.a>
                </li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-5">
              <Button href={href("#kontakt")} label="Kontakt" onClick={() => setOpen(false)} className="w-full justify-between">
                Wyceń projekt
              </Button>
              <TLink href="/konto" label="Panel klienta" onClick={() => setOpen(false)} className="btn btn-outline w-full justify-center">
                Panel klienta
              </TLink>
              <p className="text-[14px] text-muted">{site.email}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
