"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";
import { LocalTime } from "./Navbar";
import { Arrow, Section } from "./ui/Line";

// Wielki napis rysowany linią — litera wypełnia się akcentem pod kursorem.
function Wordmark() {
  const text = `${site.brand}.works`;
  return (
    <p className="display flex justify-center overflow-hidden px-2 py-6 text-[clamp(4rem,19.5vw,17.5rem)] leading-[0.8] select-none" aria-label={site.domain}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className={`inline-block text-transparent transition-[color,-webkit-text-stroke-color] duration-300 [-webkit-text-stroke:1px_var(--color-line-strong)] hover:text-accent hover:[-webkit-text-stroke-color:var(--color-accent)] ${
            ch === "." ? "text-accent [-webkit-text-stroke-color:var(--color-accent)]" : ""
          }`}
        >
          {ch}
        </span>
      ))}
    </p>
  );
}

export default function Footer() {
  const lenis = useLenis();
  const home = usePathname() === "/";
  const contact = home ? "#kontakt" : "/#kontakt";

  return (
    <footer id="stopka">
      <Section>
        <div className="grid lg:grid-cols-4">
          <div className="border-line p-4 sm:p-6 lg:col-span-3 lg:border-r">
            <p className="display text-[clamp(3rem,8vw,7.5rem)]">
              Masz projekt?
              <br />
              <span className="text-outline">Porozmawiajmy.</span>
            </p>
          </div>
          <a href={contact} className="group flex min-h-[180px] flex-col justify-between bg-accent p-4 text-bg transition-colors hover:bg-ink sm:p-6">
            <span className="label">{site.responseTime}</span>
            <span className="flex items-end justify-between">
              <span className="display text-[2.6rem]">Napisz do mnie</span>
              <Arrow className="size-7 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
          </a>
        </div>

        <div className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
          <div className="border-r border-b border-line p-4 sm:p-6 lg:border-b-0">
            <p className="label mb-4 text-dim">Kontakt</p>
            <a href={`mailto:${site.email}`} className="link-u block w-fit text-[15px]">
              {site.email}
            </a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link-u mt-1 block w-fit text-[15px]">
              {site.phone}
            </a>
          </div>
          <div className="border-b border-line p-4 sm:p-6 lg:border-r lg:border-b-0">
            <p className="label mb-4 text-dim">Social</p>
            {site.socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link-u block w-fit text-[15px]">
                {s.label} ↗
              </a>
            ))}
          </div>
          <div className="border-r border-line p-4 sm:p-6">
            <p className="label mb-4 text-dim">Dokumenty</p>
            <Link href="/regulamin" className="link-u block w-fit text-[15px]">
              Regulamin
            </Link>
            <Link href="/polityka-prywatnosci" className="link-u block w-fit text-[15px]">
              Polityka prywatności
            </Link>
          </div>
          <div className="p-4 sm:p-6">
            <p className="label mb-4 text-dim">Status</p>
            <p className="flex items-center gap-2 text-[15px]">
              <span className="size-1.5 animate-pulse bg-accent" /> Przyjmuję zlecenia
            </p>
            <p className="mt-1 text-[15px] text-muted">
              <LocalTime /> w Polsce
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <Wordmark />
      </Section>

      <Section>
        <div className="label flex flex-col gap-3 px-4 py-5 text-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            © {new Date().getFullYear()} {site.domain} — {site.role}
          </span>
          <span>{site.tagline}</span>
          <button type="button" onClick={() => lenis?.scrollTo(0, { duration: 1.6 })} className="text-left hover:text-ink">
            Do góry ↑
          </button>
        </div>
      </Section>
    </footer>
  );
}
