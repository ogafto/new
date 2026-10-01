"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, useScroll, useVelocity } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { Mark } from "./brand/Logo";
import { openCookieSettings } from "./CookieConsent";
import { TLink } from "./Transition";

// Pasek przewijany w JS: prędkość zmienia się płynnie (bez skoków przy najechaniu)
function Marquee({ href }: { href: string }) {
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const speed = useRef(1);
  const target = useRef(1);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useAnimationFrame((_, delta) => {
    const el = track.current;
    if (!el) return;
    const dt = Math.min(delta, 50) / 1000;
    // przewijanie strony lekko przyspiesza pasek
    const boost = Math.min(2.5, Math.abs(velocity.get()) / 1200);
    speed.current += (target.current + boost - speed.current) * Math.min(1, dt * 3);
    const half = el.scrollWidth / 2;
    let next = x.get() - 70 * speed.current * dt;
    if (next <= -half) next += half;
    x.set(next);
  });

  const item = (k: number) => (
    <span key={k} className="flex shrink-0 items-center gap-[0.35em] pr-[0.35em]">
      Zacznijmy projekt
      <span className="inline-block size-[0.16em] bg-accent" />
    </span>
  );

  return (
    <TLink
      href={href}
      label="Kontakt"
      className="group block overflow-hidden border-y border-line py-8 sm:py-12"
      aria-label="Zacznijmy projekt — przejdź do kontaktu"
      onPointerEnter={() => (target.current = 0.25)}
      onPointerLeave={() => (target.current = 1)}
    >
      <motion.div ref={track} style={{ x }} className="h-display flex w-max text-[clamp(3.5rem,10vw,9.5rem)] text-ink transition-colors duration-700 group-hover:text-accent-2">
        {[0, 1, 2, 3, 4, 5].map(item)}
      </motion.div>
    </TLink>
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
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link-u mt-2 block w-fit text-[15px] text-muted hover:text-ink">
              {site.phone}
            </a>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-5 text-[13px] text-dim">{c.title}</p>
              <ul className="space-y-2.5 text-[15px]">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"ext" in l ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="link-u text-muted transition-colors hover:text-ink">
                        {l.label}
                      </a>
                    ) : (
                      <TLink href={l.href} label={l.label} className="link-u text-muted transition-colors hover:text-ink">
                        {l.label}
                      </TLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-5 text-[13px] text-dim">Informacje</p>
            <ul className="space-y-2.5 text-[15px]">
              <li>
                <TLink href="/regulamin" label="Regulamin" className="link-u text-muted transition-colors hover:text-ink">
                  Regulamin
                </TLink>
              </li>
              <li>
                <TLink href="/polityka-prywatnosci" label="Polityka prywatności" className="link-u text-muted transition-colors hover:text-ink">
                  Polityka prywatności
                </TLink>
              </li>
              <li>
                <TLink href="/konto" label="Panel klienta" className="link-u text-muted transition-colors hover:text-ink">
                  Panel klienta
                </TLink>
              </li>
              <li>
                <button type="button" onClick={openCookieSettings} className="link-u text-muted transition-colors hover:text-ink">
                  Ustawienia cookies
                </button>
              </li>
              <li>
                <TLink href="/brand" label="Logo" className="link-u text-muted transition-colors hover:text-ink">
                  Logo
                </TLink>
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
