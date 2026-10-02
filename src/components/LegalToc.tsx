"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { useLenis } from "lenis/react";
import { openCookieSettings } from "./CookieConsent";

type Item = { id: string; label: string; n: number };
const ease = [0.16, 1, 0.3, 1] as const;

function useActive(items: Item[]) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-30% 0px -60% 0px" });
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);
  return active;
}

// Spis treści (komputer): przyklejony, podświetla czytaną sekcję
export function LegalToc({ items }: { items: Item[] }) {
  const active = useActive(items);
  const lenis = useLenis();
  return (
    <nav aria-label="Spis treści" className="hidden lg:block">
      <div className="sticky top-28">
        <p className="mb-4 text-[12px] tracking-[0.04em] text-dim">Spis treści</p>
        <ol className="space-y-0.5 border-l border-line">
          {items.map((i) => (
            <li key={i.id} className="relative">
              {active === i.id && <motion.span layoutId="toc" className="absolute top-0 bottom-0 -left-px w-px bg-accent shadow-[0_0_10px_#8b6cff]" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
              <a
                href={`#${i.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  lenis?.scrollTo(`#${i.id}`, { offset: -110, duration: 1.2 });
                }}
                className={`flex gap-3 py-2 pl-5 text-[13.5px] leading-snug transition-colors ${active === i.id ? "text-ink" : "text-dim hover:text-muted"}`}
              >
                <span className="w-5 shrink-0 tabular-nums">{String(i.n).padStart(2, "0")}</span>
                {i.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

// Spis treści (telefon): rozwijany
export function LegalTocMobile({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  return (
    <div className="mb-12 overflow-hidden rounded-2xl border border-line lg:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between px-5 py-4 text-left text-[15px]">
        Spis treści <span className="ml-1.5 text-dim">({items.length})</span>
        <motion.svg viewBox="0 0 12 12" className="ml-auto size-3 text-muted" animate={{ rotate: open ? 180 : 0 }} aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ol initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.45, ease }} className="overflow-hidden border-t border-line">
            {items.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    lenis?.scrollTo(`#${i.id}`, { offset: -100, duration: 1.1 });
                  }}
                  className="flex gap-3 px-5 py-2.5 text-[14px] text-muted active:text-ink"
                >
                  <span className="w-5 shrink-0 text-dim tabular-nums">{String(i.n).padStart(2, "0")}</span>
                  {i.label}
                </a>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pasek postępu czytania
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-accent to-accent-2" style={{ scaleX: x }} aria-hidden />;
}

export function CookieButton() {
  return (
    <button type="button" onClick={openCookieSettings} className="rounded-full border border-line px-4 py-2 text-[13.5px] text-muted transition-colors hover:text-ink">
      Ustawienia cookies
    </button>
  );
}
