"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";
import { openCookieSettings } from "./CookieConsent";

// Spis treści, który podąża za czytaniem
export function LegalToc({ items }: { items: { id: string; label: string; n: number }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const lenis = useLenis();
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-30% 0px -60% 0px" });
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);
  return (
    <nav aria-label="Spis treści" className="hidden lg:block">
      <ol className="sticky top-28 space-y-0.5 border-l border-line">
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
              <span className="w-5 shrink-0 tabular-nums">{i.n}</span>
              {i.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CookieButton() {
  return (
    <button type="button" onClick={openCookieSettings} className="rounded-full border border-line px-4 py-2 text-[13.5px] text-muted transition-colors hover:text-ink">
      Ustawienia cookies
    </button>
  );
}
