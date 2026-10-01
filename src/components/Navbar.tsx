"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { useLoaded } from "./Providers";
import { Mark, Wordmark } from "./brand/Logo";
import Button from "./ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

export function LocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => setTime(new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: site.timezone }).format(new Date()));
    const first = setTimeout(fmt, 0);
    const id = setInterval(fmt, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return <span className="tabular-nums">{time || "--:--"}</span>;
}

export default function Navbar() {
  const loaded = useLoaded();
  const lenis = useLenis();
  const home = usePathname() === "/";
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  // pasek chowa się przy przewijaniu w dół i wraca przy przewijaniu w górę
  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(v > 20);
    setHidden(v > 400 && v > prev && !open);
  });

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!home) return;
    const els = nav.map((n) => document.querySelector(n.href)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)), { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [home]);

  const href = (h: string) => (home ? h : `/${h}`);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -90 }}
        animate={loaded ? { y: hidden ? -90 : 0 } : {}}
        transition={{ duration: 0.7, ease }}
      >
        <div
          className={`transition-[background-color,border-color,backdrop-filter] duration-500 ${
            scrolled || open ? "border-b border-line bg-bg/75 backdrop-blur-xl" : "border-b border-transparent"
          }`}
        >
          <nav aria-label="Główna nawigacja" className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
            <Link href="/" className="group flex items-center gap-3 text-ink" aria-label={`${site.domain} — strona główna`} onClick={() => setOpen(false)}>
              <Mark className="size-8 transition-transform duration-700 ease-out-expo group-hover:rotate-[-8deg]" />
              <Wordmark className="hidden h-[22px] w-auto sm:block" />
            </Link>

            <ul className="hidden items-center gap-1 md:flex">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={href(n.href)}
                    className={`group relative flex h-10 items-center rounded-full px-4 text-[15px] transition-colors ${active === n.href ? "text-ink" : "text-muted hover:text-ink"}`}
                  >
                    <span className="roll">
                      <span>{n.label}</span>
                      <span aria-hidden>{n.label}</span>
                    </span>
                    {active === n.href && <motion.span layoutId="nav-dot" className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 bg-accent" />}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 text-[14px] text-muted lg:flex">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Dostępny
              </span>
              <Button href={href("#kontakt")} className="hidden h-11 px-5 text-[14px] sm:inline-flex">
                Wyceń projekt
              </Button>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative grid size-11 place-items-center rounded-full border border-line-2 md:hidden"
                aria-expanded={open}
                aria-controls="menu"
                aria-label={open ? "Zamknij menu" : "Otwórz menu"}
              >
                <span className={`absolute h-[1.5px] w-4 bg-ink transition-transform duration-500 ease-out-expo ${open ? "rotate-45" : "-translate-y-[3px]"}`} />
                <span className={`absolute h-[1.5px] w-4 bg-ink transition-transform duration-500 ease-out-expo ${open ? "-rotate-45" : "translate-y-[3px]"}`} />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu"
            className="fixed inset-0 z-40 flex flex-col justify-between bg-bg px-5 pt-28 pb-8 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.15 } }}
          >
            <ul className="space-y-2">
              {[{ href: "#start", label: "Start" }, ...nav].map((n, i) => (
                <li key={n.href} className="overflow-hidden">
                  <motion.a
                    href={href(n.href)}
                    onClick={() => setOpen(false)}
                    className="h-display block py-1 text-[3.2rem]"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.8, ease }}
                  >
                    {n.label}
                  </motion.a>
                </li>
              ))}
            </ul>
            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Button href={href("#kontakt")} onClick={() => setOpen(false)} className="w-full">
                Wyceń projekt
              </Button>
              <p className="flex justify-between text-[14px] text-muted">
                <span>{site.email}</span>
                <LocalTime />
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
