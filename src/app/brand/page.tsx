import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedLogo, { type Variant } from "@/components/brand/AnimatedLogo";
import { BRAND } from "@/lib/logo";

export const metadata: Metadata = {
  title: "Logo i materiały",
  robots: { index: false },
};

const animations: { name: string; file: string; variant: Variant; light?: boolean; size: string; span?: boolean }[] = [
  { name: "Baner — animacja", file: "afto-banner-anim", variant: "banner", size: "1500 × 500", span: true },
  { name: "Monogram — ciemny", file: "afto-mark-anim-dark", variant: "mark", size: "1080 × 1080" },
  { name: "Monogram — jasny", file: "afto-mark-anim-light", variant: "mark", light: true, size: "1080 × 1080" },
  { name: "Post — kwadrat", file: "afto-post-anim", variant: "square", size: "1080 × 1080" },
  { name: "Logotyp — ciemny", file: "afto-logo-anim-dark", variant: "logo", size: "1600 × 800" },
  { name: "Logotyp — jasny", file: "afto-logo-anim-light", variant: "logo", light: true, size: "1600 × 800" },
];

const assets = [
  { name: "Monogram", file: "afto-mark", bg: "#07070a" },
  { name: "Monogram — ciemny", file: "afto-mark-black", bg: BRAND.ink },
  { name: "Logotyp", file: "afto-logo", bg: "#07070a" },
  { name: "Logotyp — ciemny", file: "afto-logo-black", bg: BRAND.ink },
  { name: "Ikona — ciemna", file: "afto-icon-dark", bg: "#15151c" },
  { name: "Ikona — fiolet", file: "afto-icon-accent", bg: "#15151c" },
];

const colors = [
  { name: "Ink", hex: BRAND.ink },
  { name: "Black", hex: BRAND.black },
  { name: "Violet", hex: BRAND.accent },
];

function Download({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} download className="rounded-full border border-line-2 px-3.5 py-1.5 text-[13px] transition-colors hover:border-white/40 hover:bg-white/5">
      {label}
    </a>
  );
}

export default function BrandPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-5 pt-40 pb-28 sm:px-10">
        <p className="kicker">Brand</p>
        <h1 className="h-display mt-7 text-[clamp(3rem,7vw,6.4rem)]">Logo i materiały</h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
          Monogram „af.” i logotyp „afto.” rysowane jedną linią na wspólnej siatce. Animacje do pobrania jako GIF (30 kl./s, zapętlone), pliki statyczne jako SVG i PNG.
        </p>

        <h2 className="mt-20 mb-6 text-[15px] text-dim">Animacje</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {animations.map((a) => (
            <figure key={a.file} className={`overflow-hidden rounded-[22px] border border-line bg-surface ${a.span ? "md:col-span-2 lg:col-span-3" : ""}`}>
              <AnimatedLogo variant={a.variant} light={a.light} />
              <figcaption className="flex items-center justify-between gap-3 p-5 text-[15px]">
                <span>
                  {a.name} <span className="text-[13px] text-dim">· {a.size}</span>
                </span>
                <Download href={`/brand/anim/${a.file}.gif`} label="GIF" />
              </figcaption>
            </figure>
          ))}
        </div>

        <h2 className="mt-20 mb-6 text-[15px] text-dim">Pliki statyczne</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <figure key={a.file} className="overflow-hidden rounded-[22px] border border-line bg-surface">
              <div className="grid aspect-[4/3] place-items-center p-10" style={{ background: a.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/brand/${a.file}.svg`} alt={a.name} className={a.file.includes("logo") ? "w-3/4" : "w-2/5"} />
              </div>
              <figcaption className="flex items-center justify-between gap-3 p-5 text-[15px]">
                <span>{a.name}</span>
                <span className="flex gap-2">
                  <Download href={`/brand/${a.file}.svg`} label="SVG" />
                  <Download href={`/brand/${a.file}.png`} label="PNG" />
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <h2 className="mt-20 mb-6 text-[15px] text-dim">Kolory</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {colors.map((c) => (
            <div key={c.hex} className="overflow-hidden rounded-[22px] border border-line">
              <div className="h-32" style={{ background: c.hex }} />
              <p className="flex justify-between p-5 text-[15px]">
                <span>{c.name}</span>
                <span className="text-muted">{c.hex}</span>
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
