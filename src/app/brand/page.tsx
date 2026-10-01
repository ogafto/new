import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/logo";

export const metadata: Metadata = {
  title: "Logo i materiały",
  robots: { index: false },
};

const assets = [
  { name: "Monogram", file: "afto-mark", bg: "#131316" },
  { name: "Monogram — ciemny", file: "afto-mark-black", bg: BRAND.ink },
  { name: "Logotyp", file: "afto-logo", bg: "#131316" },
  { name: "Logotyp — ciemny", file: "afto-logo-black", bg: BRAND.ink },
  { name: "Ikona — ciemna", file: "afto-icon-dark", bg: "#1a1a1e" },
  { name: "Ikona — akcent", file: "afto-icon-accent", bg: "#1a1a1e" },
  { name: "Ikona — jasna", file: "afto-icon-light", bg: "#1a1a1e" },
  { name: "Monogram — biały mono", file: "afto-mark-mono-white", bg: "#131316" },
  { name: "Logotyp — czarny mono", file: "afto-logo-mono-black", bg: BRAND.ink },
];

const colors = [
  { name: "Ink", hex: BRAND.ink },
  { name: "Black", hex: BRAND.black },
  { name: "Cobalt", hex: BRAND.accent },
];

export default function BrandPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-[1320px] px-5 pt-40 pb-28 sm:px-8">
        <p className="eyebrow">Brand</p>
        <h1 className="h-display mt-6 text-[clamp(2.8rem,6vw,5.4rem)]">Logo i materiały</h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          Monogram „af.” i logotyp „afto.” rysowane jedną linią na wspólnej siatce. Pobierz SVG (wektor, do druku i edycji) albo PNG (gotowy do social mediów).
        </p>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <figure key={a.file} className="overflow-hidden rounded-[24px] border border-line bg-surface">
              <div className="grid aspect-[4/3] place-items-center p-10" style={{ background: a.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/brand/${a.file}.svg`} alt={a.name} className={a.file.includes("logo") ? "w-3/4" : "w-2/5"} />
              </div>
              <figcaption className="flex items-center justify-between gap-3 p-5 text-[15px]">
                <span>{a.name}</span>
                <span className="flex gap-2">
                  <a href={`/brand/${a.file}.svg`} download className="rounded-full border border-line-2 px-3 py-1 text-[13px] transition-colors hover:bg-white/5">
                    SVG
                  </a>
                  <a href={`/brand/${a.file}.png`} download className="rounded-full border border-line-2 px-3 py-1 text-[13px] transition-colors hover:bg-white/5">
                    PNG
                  </a>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {colors.map((c) => (
            <div key={c.hex} className="overflow-hidden rounded-[24px] border border-line">
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
