"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon, ICONS, Tabs } from "@/components/panel/kit";
import AnimatedLogo, { type Variant } from "@/components/brand/AnimatedLogo";

/* Materiały marki w zakładkach: animacje, banery, logo, kolory. Dane z assets.json (npm run brand). */

type File = { path: string; size: number };
type Files = Partial<Record<"mp4" | "gif" | "png" | "svg" | "avatar" | "poster", File>>;
export type Anim = { id: string; name: string; desc: string; w: number; h: number; duration: number; animated?: boolean; files: Files };
export type LogoProposal = { id: string; name: string; desc: string; bg: string; round?: boolean; files: Files };
export type LogoAnim = { name: string; file: string; variant: Variant; light?: boolean; size: string; span?: boolean };
export type Asset = { name: string; file: string; bg: string };
export type Color = { name: string; hex: string; note?: string };

type Tab = "animacje" | "banery" | "logo" | "kolory";
const ease = [0.16, 1, 0.3, 1] as const;

const mb = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} kB`);
const sec = (s: number) => `${s.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} s`;

function Download({ href, label, size }: { href: string; label: string; size?: number }) {
  return (
    <a
      href={href}
      download
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-2 px-3.5 text-[13px] font-medium transition-colors duration-300 hover:border-white/35 hover:bg-white/[0.04]"
    >
      <Icon d={ICONS.download} className="size-3.5 text-dim" />
      {label}
      {size !== undefined && <span className="font-normal text-dim">{mb(size)}</span>}
    </a>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-4 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h2 className="text-[16px] font-medium tracking-[-0.01em]">{title}</h2>
        {sub && <p className="text-[13px] text-dim">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Tile({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <figure className={`edge relative min-w-0 overflow-hidden rounded-[22px] bg-surface/80 ${className}`}>{children}</figure>;
}

function Caption({ name, desc, meta, children }: { name: string; desc?: string; meta?: string; children: React.ReactNode }) {
  return (
    <figcaption className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="min-w-0">
        <p className="text-[15px] font-medium">
          {name}
          {meta && <span className="ml-2 text-[13px] font-normal text-dim">{meta}</span>}
        </p>
        {desc && <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{desc}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </figcaption>
  );
}

// podgląd wideo: wycisz, zapętl, bez ładowania całości przed odtworzeniem
function Clip({ src, poster, ratio }: { src: string; poster?: string; ratio: string }) {
  return (
    <div className="relative bg-bg" style={{ aspectRatio: ratio }}>
      <video src={src} poster={poster} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 size-full object-cover" aria-hidden />
    </div>
  );
}

function Animations({ items, logoAnims }: { items: Anim[]; logoAnims: LogoAnim[] }) {
  return (
    <>
      <Section title="Zapowiedzi na Discorda" sub="MP4 1280 × 720 · 30 kl./s · GIF 960 × 540, zapętlone">
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((a) => (
            <Tile key={a.id}>
              {a.files.mp4 && <Clip src={a.files.mp4.path} poster={a.files.poster?.path} ratio={`${a.w} / ${a.h}`} />}
              <Caption name={a.name} desc={a.desc} meta={sec(a.duration)}>
                {a.files.mp4 && <Download href={a.files.mp4.path} label="MP4" size={a.files.mp4.size} />}
                {a.files.gif && <Download href={a.files.gif.path} label="GIF" size={a.files.gif.size} />}
              </Caption>
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Animacje logo" sub="GIF, 30 kl./s — podgląd na żywo">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {logoAnims.map((a) => (
            <Tile key={a.file} className={a.span ? "md:col-span-2 lg:col-span-3" : ""}>
              <AnimatedLogo variant={a.variant} light={a.light} />
              <Caption name={a.name} meta={a.size}>
                <Download href={`/brand/anim/${a.file}.gif`} label="GIF" />
              </Caption>
            </Tile>
          ))}
        </div>
      </Section>
    </>
  );
}

function Banners({ items }: { items: Anim[] }) {
  return (
    <Section title="Banery do osadzeń bota" sub="1500 × 300 · tekst czytelny po zmniejszeniu do ~400 px">
      <div className="grid gap-5">
        {items.map((b) => (
          <Tile key={b.id}>
            {b.animated && b.files.mp4 ? (
              <Clip src={b.files.mp4.path} poster={b.files.png?.path} ratio={`${b.w} / ${b.h}`} />
            ) : (
              b.files.png && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.files.png.path} alt={b.name} width={b.w} height={b.h} loading="lazy" className="block h-auto w-full bg-bg" />
              )
            )}
            <Caption name={b.name} desc={b.desc} meta={b.animated ? `animowany · ${sec(b.duration)}` : "statyczny"}>
              {b.files.png && <Download href={b.files.png.path} label="PNG" size={b.files.png.size} />}
              {b.files.gif && <Download href={b.files.gif.path} label="GIF" size={b.files.gif.size} />}
              {b.files.mp4 && <Download href={b.files.mp4.path} label="MP4" size={b.files.mp4.size} />}
            </Caption>
          </Tile>
        ))}
      </div>
    </Section>
  );
}

function Logos({ assets, proposals }: { assets: Asset[]; proposals: LogoProposal[] }) {
  return (
    <>
      <Section title="Oficjalne pliki" sub="SVG do druku i stron, PNG w wysokiej rozdzielczości">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <Tile key={a.file}>
              <div className="grid aspect-[4/3] place-items-center p-10" style={{ background: a.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/brand/${a.file}.svg`} alt={a.name} className={a.file.includes("logo") ? "w-3/4" : "w-2/5"} />
              </div>
              <Caption name={a.name}>
                <Download href={`/brand/${a.file}.svg`} label="SVG" />
                <Download href={`/brand/${a.file}.png`} label="PNG" />
              </Caption>
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Propozycje" sub="Rozwinięcia znaku — ta sama linia, siatka i kropka">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p) => {
            const wide = !p.round && !p.id.includes("ikona") && !p.id.includes("znak");
            return (
              <Tile key={p.id}>
                <div className="grid aspect-[4/3] place-items-center p-8" style={{ background: p.bg }}>
                  {p.files.svg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.files.svg.path} alt={p.name} loading="lazy" className={`max-h-full ${wide ? "w-[82%]" : "w-[52%]"}`} />
                  )}
                </div>
                <Caption name={p.name} desc={p.desc}>
                  {p.files.svg && <Download href={p.files.svg.path} label="SVG" size={p.files.svg.size} />}
                  {p.files.png && <Download href={p.files.png.path} label="PNG" size={p.files.png.size} />}
                  {p.files.avatar && <Download href={p.files.avatar.path} label="512 × 512" size={p.files.avatar.size} />}
                </Caption>
              </Tile>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function Swatch({ c }: { c: Color }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <Tile>
      <div className="h-32 border-b border-line" style={{ background: c.hex }} />
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-[15px]">{c.name}</p>
          {c.note && <p className="mt-0.5 text-[12.5px] text-dim">{c.note}</p>}
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(c.hex).then(() => setCopied(true))}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-2 px-3 text-[13px] text-muted tabular-nums transition-colors hover:border-white/35 hover:text-ink"
          aria-label={`Kopiuj ${c.hex}`}
        >
          <Icon d={copied ? ICONS.check : ICONS.copy} className={`size-3.5 ${copied ? "text-emerald-300" : ""}`} />
          {copied ? "Skopiowano" : c.hex}
        </button>
      </div>
    </Tile>
  );
}

export default function BrandBoard({ announcements, banners, logoAnims, assets, proposals, colors }: { announcements: Anim[]; banners: Anim[]; logoAnims: LogoAnim[]; assets: Asset[]; proposals: LogoProposal[]; colors: Color[] }) {
  const [tab, setTab] = useState<Tab>("animacje");
  // zakładka w adresie (#banery) — łatwo podesłać link
  useEffect(() => {
    const h = location.hash.slice(1) as Tab;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (["animacje", "banery", "logo", "kolory"].includes(h)) setTab(h);
  }, []);
  const change = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  return (
    <div className="min-w-0">
      <p className="max-w-xl text-[15px] leading-relaxed text-muted">
        Monogram „af.” i logotyp „afto.” rysowane jedną linią na wspólnej siatce. Zapowiedzi i banery na Discorda, pliki logo i propozycje rozwinięcia znaku — wszystko gotowe do pobrania.
      </p>
      <div className="mt-8 mb-8 max-w-full">
        <Tabs
          id="marka"
          value={tab}
          onChange={change}
          items={[
            { value: "animacje", label: "Animacje", count: announcements.length + logoAnims.length },
            { value: "banery", label: "Banery", count: banners.length },
            { value: "logo", label: "Logo", count: assets.length + proposals.length },
            { value: "kolory", label: "Kolory", count: colors.length },
          ]}
        />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45, ease }}>
          {tab === "animacje" && <Animations items={announcements} logoAnims={logoAnims} />}
          {tab === "banery" && <Banners items={banners} />}
          {tab === "logo" && <Logos assets={assets} proposals={proposals} />}
          {tab === "kolory" && (
            <Section title="Paleta" sub="Kliknij kod, aby skopiować">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {colors.map((c) => (
                  <Swatch key={c.hex} c={c} />
                ))}
              </div>
            </Section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
