"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import ScrollLink from "./figma/ScrollLink";

export default function Footer() {
  const lenis = useLenis();
  const letters = site.brand.split("");

  return (
    <footer id="stopka" className="relative overflow-hidden border-t border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-5 pt-20 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="max-w-sm font-display text-3xl leading-tight font-semibold tracking-tight">
              {site.tagline} <span className="text-muted">Strony od 200 zł, które robią wrażenie.</span>
            </p>
            <ScrollLink
              to="kontakt"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-canvas transition-transform hover:scale-[1.03]"
            >
              Zacznijmy projekt →
            </ScrollLink>
          </div>
          <div>
            <p className="mb-4 font-mono text-[11px] text-muted">Nawigacja</p>
            <ul className="space-y-2 text-sm">
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
            <p className="mb-4 font-mono text-[11px] text-muted">Kontakt</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`mailto:${site.email}`} className="text-muted transition-colors hover:text-ink">
                  {site.email}
                </a>
              </li>
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-ink">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ogromne logo — litery podskakują po najechaniu */}
        <div className="my-14 flex select-none justify-center sm:my-20" aria-hidden>
          {letters.map((l, i) => (
            <motion.span
              key={i}
              className="font-display text-[34vw] leading-[0.8] font-semibold tracking-[-0.07em] text-white/[0.06] transition-colors hover:text-sel lg:text-[26rem]"
              initial={{ y: "40%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -30, transition: { type: "spring", stiffness: 400, damping: 10 } }}
            >
              {l}
            </motion.span>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.brand}. Zaprojektowane w Figmie, zbudowane w Next.js.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/regulamin" className="hover:text-ink">
              Regulamin
            </Link>
            <Link href="/polityka-prywatnosci" className="hover:text-ink">
              Polityka prywatności
            </Link>
            <button type="button" onClick={() => lenis?.scrollTo(0, { duration: 1.6 })} className="hover:text-ink">
              Do góry ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
