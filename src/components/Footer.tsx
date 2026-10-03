"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useInView, useScroll, useVelocity } from "motion/react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/lib/site";
import { Mark } from "./brand/Logo";
import { openCookieSettings } from "./CookieConsent";
import { TLink } from "./Transition";
import { offers } from "@/lib/offer";

// Pasek przewijany: ruch liczy GPU (Web Animations API), JS tylko płynnie zmienia prędkość (najechanie, przewijanie strony).
// Poza ekranem animacja stoi; gdy prędkość się ustali, nie ma żadnej pracy na głównym wątku (wcześniej pętla co klatkę cały czas).
function Marquee({ href }: { href: string }) {
  const track = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const speed = useRef(1);
  const target = useRef(1);
  const kick = useRef(() => {});
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const visible = useInView(track, { margin: "100px 0px" });
  const shown = useRef(false);

  // pętla: przesunięcie o połowę paska (treść jest zdublowana), 70 px/s przy prędkości 1
  useEffect(() => {
    const el = track.current;
    if (!el || typeof el.animate !== "function") return;
    let width = 0;
    const make = () => {
      const half = el.scrollWidth / 2;
      if (!half || half === width) return;
      width = half;
      const prev = anim.current;
      const duration = (half / 70) * 1000;
      const timing = prev?.effect?.getComputedTiming();
      const progress = timing?.progress ?? 0;
      prev?.cancel();
      const a = el.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${-half}px,0,0)` }], { duration, iterations: Infinity });
      a.currentTime = progress * duration;
      a.playbackRate = speed.current;
      if (!shown.current) a.pause();
      anim.current = a;
    };
    make();
    const ro = new ResizeObserver(make);
    ro.observe(el);
    return () => {
      ro.disconnect();
      anim.current?.cancel();
      anim.current = null;
    };
  }, []);

  useEffect(() => {
    shown.current = visible;
    const a = anim.current;
    if (!a) return;
    if (visible) a.play();
    else a.pause();
  }, [visible]);

  // płynna zmiana prędkości — rAF działa tylko, dopóki prędkość nie dojdzie do celu
  useEffect(() => {
    if (!visible) return;
    let id = 0;
    let last = 0;
    const step = (now: number) => {
      const dt = last ? Math.min(now - last, 50) / 1000 : 0;
      last = now;
      // przewijanie strony lekko przyspiesza pasek
      const goal = target.current + Math.min(2.5, Math.abs(velocity.get()) / 1200);
      speed.current += (goal - speed.current) * Math.min(1, dt * 3);
      const done = Math.abs(goal - speed.current) < 0.004;
      if (done) speed.current = goal;
      if (anim.current) anim.current.playbackRate = speed.current;
      id = done ? 0 : requestAnimationFrame(step);
    };
    kick.current = () => {
      if (id) return;
      last = 0;
      id = requestAnimationFrame(step);
    };
    const off = velocity.on("change", () => kick.current());
    kick.current();
    return () => {
      off();
      cancelAnimationFrame(id);
      kick.current = () => {};
    };
  }, [visible, velocity]);

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
      onPointerEnter={() => {
        target.current = 0.25;
        kick.current();
      }}
      onPointerLeave={() => {
        target.current = 1;
        kick.current();
      }}
    >
      <div ref={track} className="h-display flex w-max text-[clamp(3.5rem,10vw,9.5rem)] text-ink transition-colors duration-700 group-hover:text-accent-2">
        {[0, 1, 2, 3, 4, 5].map(item)}
      </div>
    </TLink>
  );
}

export default function Footer() {
  const lenis = useLenis();
  const home = usePathname() === "/";
  const href = (h: string) => (home ? h : `/${h}`);

  const cols = [
    { title: "Nawigacja", links: nav.map((n) => ({ label: n.label, href: href(n.href) })) },
    { title: "Usługi", links: offers.map((o) => ({ label: o.name, href: `/uslugi/${o.slug}` })) },
    { title: "Social", links: site.socials.map((s) => ({ label: s.label, href: s.href, ext: true })) },
  ];

  return (
    <footer className="relative overflow-hidden">
      <Marquee href={href("#kontakt")} />

      <div className="pointer-events-none absolute bottom-[-40%] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.12),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 pt-16 pb-10 sm:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Mark className="size-10" />
            <p className="mt-6 max-w-[300px] text-[15px] leading-relaxed text-muted">Projektuję i koduję strony, które wyglądają drogo i sprzedają.</p>
            <address className="not-italic">
            <a href={`mailto:${site.email}`} className="link-u mt-6 inline-block text-[17px]">
              {site.email}
            </a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link-u mt-2 block w-fit text-[15px] text-muted hover:text-ink">
              {site.phone}
            </a>
            </address>
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
