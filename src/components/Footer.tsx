"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import ScrollLink from "./figma/ScrollLink";
import Button from "./ui/Button";
import CopyEmail from "./ui/CopyEmail";
import { LogoMark, Wordmark } from "./Logo";

const ease = [0.16, 1, 0.3, 1] as const;

function LocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      setTime(new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: site.timezone }).format(new Date()));
    const first = setTimeout(fmt, 0);
    const id = setInterval(fmt, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return <span className="tabular-nums">{time || "--:--"}</span>;
}

// Ogromny napis — kursor "podświetla" litery latarką.
function GiantWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [name, tld] = site.domain.split(".");
  return (
    <div
      ref={ref}
      className="relative select-none"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      aria-hidden
    >
      <motion.p
        className="font-display text-[19.5vw] leading-[0.8] font-medium tracking-[-0.075em] whitespace-nowrap text-white/[0.045] lg:text-[15.5rem]"
        initial={{ y: "30%", opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease }}
      >
        {name}.{tld}
      </motion.p>
      <p
        className="pointer-events-none absolute inset-0 font-display text-[19.5vw] leading-[0.8] font-medium tracking-[-0.075em] whitespace-nowrap text-transparent lg:text-[15.5rem]"
        style={{
          backgroundImage: "radial-gradient(320px circle at var(--mx, -999px) var(--my, -999px), #ffffff, #36b5ff 30%, #9b6bff 55%, transparent 75%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {name}.{tld}
      </p>
    </div>
  );
}

export default function Footer() {
  const lenis = useLenis();

  return (
    <footer id="stopka" className="relative overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[900px] -translate-x-1/2 rounded-full bg-sel/15 blur-[120px]" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-5 pt-24 sm:pt-32">
        {/* CTA */}
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div>
            <p className="mb-6 font-mono text-[11px] tracking-wide text-muted uppercase">Masz pomysł?</p>
            <h2 className="font-display text-[clamp(2.6rem,6.5vw,5.4rem)] leading-[0.98] font-medium tracking-[-0.05em]">
              <span className="text-silver">Zbudujmy stronę, która </span>
              <span className="text-accent pr-1 font-serif font-normal tracking-[-0.02em] italic">zarabia.</span>
            </h2>
          </div>
          <div className="space-y-3 lg:pb-2">
            <p className="mb-6 max-w-sm text-[15px] leading-relaxed text-muted">
              Premium design, szybki kod i animacje, które robią wrażenie. Ceny od 200 zł, realizacja nawet w 7 dni.
            </p>
            <Button to="kontakt" size="lg" arrow className="w-full justify-between pl-6 sm:w-auto">
              Zamów stronę od 200 zł
            </Button>
            <div className="pt-2 sm:max-w-sm">
              <CopyEmail compact />
            </div>
          </div>
        </div>

        <div className="my-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent sm:my-20" />

        {/* kolumny */}
        <div className="grid grid-cols-2 gap-10 text-sm md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <LogoMark className="size-9" />
              <Wordmark className="text-lg" />
            </Link>
            <p className="mt-4 max-w-[240px] text-muted">{site.tagline} Strony, które robią wrażenie i sprzedają.</p>
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] py-1.5 pr-3.5 pl-2.5 text-[12px] text-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-fig-green opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-fig-green" />
              </span>
              Dostępny · <LocalTime /> w Polsce
            </div>
          </div>

          <div>
            <p className="mb-5 font-mono text-[11px] text-dim uppercase">Strona</p>
            <ul className="space-y-3">
              {nav.map((n) => (
                <li key={n.id}>
                  <ScrollLink to={n.id} className="text-muted transition-colors hover:text-ink">
                    {n.label}
                  </ScrollLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 font-mono text-[11px] text-dim uppercase">Social</p>
            <ul className="space-y-3">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-muted transition-colors hover:text-ink">
                    {s.label}
                    <span className="text-dim transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 font-mono text-[11px] text-dim uppercase">Dokumenty</p>
            <ul className="space-y-3">
              <li>
                <Link href="/regulamin" className="text-muted transition-colors hover:text-ink">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link href="/polityka-prywatnosci" className="text-muted transition-colors hover:text-ink">
                  Polityka prywatności
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-20 flex justify-center overflow-hidden sm:mt-28">
        <GiantWordmark />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-line px-5 py-6 text-[12px] text-dim sm:flex-row">
        <p>
          © {new Date().getFullYear()} {site.domain} · Zaprojektowane w Figmie, zbudowane w Next.js.
        </p>
        <button
          type="button"
          onClick={() => lenis?.scrollTo(0, { duration: 1.8 })}
          className="group inline-flex items-center gap-2 transition-colors hover:text-ink"
        >
          Wróć na górę
          <span className="grid size-7 place-items-center rounded-full bg-white/[0.05] transition-transform duration-500 ease-out-expo group-hover:-translate-y-1">↑</span>
        </button>
      </div>
    </footer>
  );
}
