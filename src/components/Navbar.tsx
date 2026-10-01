"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { useLoaded } from "./Providers";

const ease = [0.76, 0, 0.24, 1] as const;

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-[-0.02em] uppercase [font-stretch:78%] ${className}`}>
      {site.brand}
      <span className="text-accent">.</span>
      works
    </span>
  );
}

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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!home) return;
    const els = nav.map((n) => document.querySelector(n.href)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)), { rootMargin: "-45% 0px -50% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [home]);

  const href = (h: string) => (home ? h : `/${h}`);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -60 }}
        animate={loaded ? { y: 0 } : {}}
        transition={{ delay: 0.15, duration: 0.8, ease }}
      >
        <nav
          aria-label="Główna nawigacja"
          className="mx-3 flex h-14 items-stretch border-x border-b border-line bg-bg/85 backdrop-blur-md sm:mx-6 2xl:mx-auto 2xl:max-w-[1440px]"
        >
          <Link href="/" className="flex items-center border-r border-line px-4 text-[19px] sm:px-6" aria-label={`${site.domain} — strona główna`}>
            <Wordmark />
          </Link>
          <ul className="hidden md:flex">
            {nav.map((n) => (
              <li key={n.href} className="border-r border-line">
                <a href={href(n.href)} className={`label relative flex h-full items-center px-6 transition-colors hover:text-ink ${active === n.href ? "text-ink" : "text-muted"}`}>
                  {n.label}
                  <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-accent transition-transform duration-500 ease-out-expo ${active === n.href ? "scale-x-100" : "scale-x-0"}`} />
                </a>
              </li>
            ))}
          </ul>
          <div className="flex-1" />
          <div className="label hidden items-center gap-2 border-l border-line px-6 text-muted lg:flex">
            <span className="size-1.5 animate-pulse bg-accent" /> Dostępny · <LocalTime />
          </div>
          <a href={href("#kontakt")} className="label hidden items-center gap-3 bg-accent px-6 text-bg transition-colors hover:bg-ink sm:flex">
            Wyceń projekt <span aria-hidden>↗</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="label flex items-center border-l border-line px-4 md:hidden"
            aria-expanded={open}
            aria-controls="menu"
          >
            {open ? "Zamknij" : "Menu"}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu"
            className="fixed inset-0 z-40 flex flex-col bg-bg pt-14 md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease }}
          >
            <ul className="mx-3 flex-1 border-x border-line sm:mx-6">
              {[{ href: "#start", label: "Start" }, ...nav].map((n, i) => (
                <li key={n.href} className="overflow-hidden border-b border-line">
                  <motion.a
                    href={href(n.href)}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between px-4 py-5"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.7, ease }}
                  >
                    <span className="display text-[3.4rem]">{n.label}</span>
                    <span className="label text-dim">0{i + 1}</span>
                  </motion.a>
                </li>
              ))}
            </ul>
            <div className="mx-3 border-x border-t border-line sm:mx-6">
              <a href={href("#kontakt")} onClick={() => setOpen(false)} className="display flex items-center justify-between bg-accent px-4 py-6 text-[2rem] text-bg">
                Wyceń projekt <span aria-hidden>↗</span>
              </a>
              <p className="label flex justify-between px-4 py-4 text-muted">
                <span>{site.email}</span>
                <LocalTime />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
