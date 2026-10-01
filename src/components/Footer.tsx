"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { Wordmark } from "./brand/Logo";
import { Arrow } from "./ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Footer() {
  const lenis = useLenis();
  const home = usePathname() === "/";
  const href = (h: string) => (home ? h : `/${h}`);

  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute bottom-[-30%] left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.18),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 pt-28 pb-10 sm:px-10">
        <a href={href("#kontakt")} className="group block">
          <p className="kicker">Nowy projekt</p>
          <p className="h-display mt-7 flex items-end justify-between gap-6 text-[clamp(2.8rem,7vw,7rem)]">
            <span>
              Masz pomysł?
              <br />
              <span className="text-muted transition-colors duration-500 group-hover:text-accent-2">Zacznijmy.</span>
            </span>
            <span className="mb-[0.15em] grid size-[clamp(56px,7vw,104px)] shrink-0 place-items-center rounded-full border border-line-2 transition-all duration-700 ease-out-expo group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent">
              <Arrow className="size-[40%]" />
            </span>
          </p>
        </a>

        <div className="mt-24 grid gap-10 border-t border-line pt-10 text-[15px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-4 text-[13px] text-dim">Kontakt</p>
            <a href={`mailto:${site.email}`} className="link-u">
              {site.email}
            </a>
          </div>
          <div>
            <p className="mb-4 text-[13px] text-dim">Nawigacja</p>
            <ul className="space-y-2">
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
            <p className="mb-4 text-[13px] text-dim">Social</p>
            <ul className="space-y-2">
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
            <p className="mb-4 text-[13px] text-dim">Informacje</p>
            <ul className="space-y-2">
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
                  Logo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <motion.div className="mt-20 text-[#1a1922]" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.4, ease }} aria-hidden>
          <Wordmark className="h-auto w-full" />
        </motion.div>

        <div className="mt-8 flex flex-col gap-3 text-[13px] text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.domain}
          </p>
          <button type="button" onClick={() => lenis?.scrollTo(0, { duration: 1.8 })} className="link-u self-start hover:text-ink">
            Do góry ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
