"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { Mark } from "./brand/Logo";
import { openCookieSettings } from "./CookieConsent";

function Marquee({ href }: { href: string }) {
  const item = (k: number) => (
    <span key={k} className="flex shrink-0 items-center gap-[0.35em] pr-[0.35em]">
      Zacznijmy projekt
      <span className="inline-block size-[0.16em] bg-accent" />
    </span>
  );
  return (
    <a href={href} className="group block overflow-hidden border-y border-line py-8 sm:py-12" aria-label="Zacznijmy projekt — przejdź do kontaktu">
      <div className="h-display flex w-max animate-[footer-marquee_28s_linear_infinite] text-[clamp(3.5rem,10vw,9.5rem)] text-ink transition-colors duration-500 group-hover:text-accent-2 group-hover:[animation-duration:14s]">
        {[0, 1, 2, 3, 4, 5].map(item)}
      </div>
      <style>{`@keyframes footer-marquee { to { transform: translateX(-50%) } }`}</style>
    </a>
  );
}

export default function Footer() {
  const lenis = useLenis();
  const home = usePathname() === "/";
  const href = (h: string) => (home ? h : `/${h}`);

  const cols = [
    { title: "Nawigacja", links: nav.map((n) => ({ label: n.label, href: href(n.href) })) },
    { title: "Social", links: site.socials.map((s) => ({ label: s.label, href: s.href, ext: true })) },
  ];

  return (
    <footer className="relative overflow-hidden">
      <Marquee href={href("#kontakt")} />

      <div className="pointer-events-none absolute bottom-[-40%] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.12),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 pt-16 pb-10 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Mark className="size-10" />
            <p className="mt-6 max-w-[300px] text-[15px] leading-relaxed text-muted">Projektuję i koduję strony, które wyglądają drogo i sprzedają.</p>
            <a href={`mailto:${site.email}`} className="link-u mt-6 inline-block text-[17px]">
              {site.email}
            </a>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-5 text-[13px] text-dim">{c.title}</p>
              <ul className="space-y-2.5 text-[15px]">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} {...("ext" in l ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="link-u text-muted transition-colors hover:text-ink">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-5 text-[13px] text-dim">Informacje</p>
            <ul className="space-y-2.5 text-[15px]">
              <li>
                <Link href="/regulamin" className="link-u text-muted transition-colors hover:text-ink">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link href="/polityka-prywatnosci" className="link-u text-muted transition-colors hover:text-ink">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <button type="button" onClick={openCookieSettings} className="link-u text-muted transition-colors hover:text-ink">
                  Ustawienia cookies
                </button>
              </li>
              <li>
                <Link href="/brand" className="link-u text-muted transition-colors hover:text-ink">
                  Logo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.domain}
          </p>
          <button type="button" onClick={() => lenis?.scrollTo(0, { duration: 1.8 })} className="link-u self-start transition-colors hover:text-ink">
            Do góry ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
