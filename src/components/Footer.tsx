"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { LocalTime } from "./Navbar";
import { Mark, Wordmark } from "./brand/Logo";
import Button, { Magnetic } from "./ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Footer() {
  const lenis = useLenis();
  const home = usePathname() === "/";
  const href = (h: string) => (home ? h : `/${h}`);

  return (
    <footer className="mx-auto max-w-[1320px] px-5 pb-8 sm:px-8">
      {/* zamknięcie sprzedażowe */}
      <motion.div
        className="relative overflow-hidden rounded-[32px] bg-accent px-6 py-14 text-white sm:px-12 sm:py-20"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1, ease }}
      >
        <Mark className="pointer-events-none absolute -right-16 -bottom-24 size-[420px] text-[#5b72ff] sm:-right-10 sm:-bottom-28 sm:size-[520px]" />
        <p className="text-[15px] text-white/75">Masz pomysł albo starą stronę do odświeżenia?</p>
        <p className="h-display mt-4 max-w-[14ch] text-[clamp(2.6rem,6vw,5.4rem)]">Zróbmy coś, co sprzedaje.</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic>
            <Button href={href("#kontakt")} variant="light">
              Wyceń projekt
            </Button>
          </Magnetic>
          <a href={`mailto:${site.email}`} className="link-u text-[16px] text-white/85">
            {site.email}
          </a>
        </div>
      </motion.div>

      <div className="grid gap-10 border-b border-line py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label={site.domain}>
            <Mark className="size-9" />
            <Wordmark className="h-6 w-auto" />
          </Link>
          <p className="mt-5 max-w-[260px] text-[15px] leading-relaxed text-muted">{site.role}. Strony, sklepy i identyfikacje, które wyglądają drogo i sprzedają.</p>
          <p className="mt-5 flex items-center gap-2 text-[14px] text-muted">
            <span className="size-2 rounded-full bg-emerald-400" /> Dostępny · <LocalTime /> w Polsce
          </p>
        </div>
        <div>
          <p className="mb-4 text-[14px] text-dim">Strona</p>
          <ul className="space-y-2.5 text-[15px]">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={href(n.href)} className="link-u">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[14px] text-dim">Social</p>
          <ul className="space-y-2.5 text-[15px]">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-u">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[14px] text-dim">Informacje</p>
          <ul className="space-y-2.5 text-[15px]">
            <li>
              <Link href="/regulamin" className="link-u">
                Regulamin
              </Link>
            </li>
            <li>
              <Link href="/polityka-prywatnosci" className="link-u">
                Polityka prywatności
              </Link>
            </li>
            <li>
              <Link href="/brand" className="link-u">
                Logo i materiały
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <motion.div
        className="py-10 text-[#18181c]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease }}
        aria-hidden
      >
        <Wordmark className="h-auto w-full" />
      </motion.div>

      <div className="flex flex-col gap-3 text-[14px] text-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.domain}. Projekt i kod: {site.brand}.
        </p>
        <button type="button" onClick={() => lenis?.scrollTo(0, { duration: 1.6 })} className="group inline-flex items-center gap-2 self-start transition-colors hover:text-ink">
          Do góry
          <span className="grid size-8 place-items-center rounded-full border border-line-2 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1">↑</span>
        </button>
      </div>
    </footer>
  );
}
