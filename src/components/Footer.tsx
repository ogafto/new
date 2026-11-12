"use client";

import { motion } from "motion/react";
import { copy, DISCORD, site } from "@/lib/site";
import { Mark } from "./brand/Logo";
import { DiscordIcon } from "./ui/Discord";
import { Arrow } from "./ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

// Stopka: jedno wezwanie (Discord), a niżej logo i dwa profile po prawej. Nic więcej.
const links = site.socials.filter((s) => s.label === "Discord" || s.label === "Instagram");

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute bottom-[-50%] left-1/2 h-[560px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.13),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 pt-20 pb-8 sm:px-10 sm:pt-28">
        <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="group block w-fit" aria-label={`${copy.footer.cta} ${copy.footer.accent}`}>
          <motion.span className="block text-[clamp(1.1rem,2vw,1.5rem)] text-muted" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease }}>
            {copy.footer.cta}
          </motion.span>
          <span className="mt-3 flex items-center gap-4 sm:gap-6">
            {/* obserwowany jest rodzic: tekst schowany pod maską nigdy nie „wchodzi w widok”.
                Rozmiar pisma na masce, żeby zapas na ogonki (g, j, y) liczył się od dużej czcionki */}
            <motion.span className="h-display block overflow-hidden pt-[0.04em] pb-[0.16em] text-[clamp(2.4rem,7.4vw,7rem)]" initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.span
                className="block transition-colors duration-700 group-hover:text-accent-2"
                variants={{ hidden: { y: "105%" }, show: { y: "0%", transition: { duration: 1.2, delay: 0.05, ease } } }}
              >
                {copy.footer.accent}
              </motion.span>
            </motion.span>
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#5865F2] text-white transition-transform duration-700 ease-out-expo group-hover:rotate-[-12deg] group-hover:scale-110 sm:size-20">
              <DiscordIcon className="size-6 sm:size-8" />
            </span>
          </span>
        </a>

        <div className="mt-20 flex flex-col gap-6 border-t border-line pt-8 sm:mt-28 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Mark className="size-9" />
            <p className="text-[13.5px] text-dim">
              © {year} {site.domain}
              <span className="block text-muted">{site.legal.owner}</span>
            </p>
          </div>

          <ul className="flex items-center gap-8 text-[15px]">
            {links.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-muted transition-colors hover:text-ink">
                  <span>{s.label}</span>
                  <Arrow className="size-3 opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
