import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { PageHead } from "@/components/panel/kit";
import { BRAND } from "@/lib/logo";
import BrandBoard, { type Anim, type Asset, type Color, type LogoAnim, type LogoProposal } from "./BrandBoard";
import manifest from "./assets.json";

export const metadata: Metadata = { title: "Marka i logo" };

// assets.json generuje `npm run brand` (scripts/brand) — rozmiary i ścieżki plików
const data = manifest as { announcements: Anim[]; banners: Anim[]; logos: LogoProposal[] };

const logoAnims: LogoAnim[] = [
  { name: "Baner — animacja", file: "afto-banner-anim", variant: "banner", size: "1500 × 500", span: true },
  { name: "Monogram — ciemny", file: "afto-mark-anim-dark", variant: "mark", size: "1080 × 1080" },
  { name: "Monogram — jasny", file: "afto-mark-anim-light", variant: "mark", light: true, size: "1080 × 1080" },
  { name: "Post — kwadrat", file: "afto-post-anim", variant: "square", size: "1080 × 1080" },
  { name: "Logotyp — ciemny", file: "afto-logo-anim-dark", variant: "logo", size: "1600 × 800" },
  { name: "Logotyp — jasny", file: "afto-logo-anim-light", variant: "logo", light: true, size: "1600 × 800" },
];

const assets: Asset[] = [
  { name: "Monogram", file: "afto-mark", bg: "#07070a" },
  { name: "Monogram — ciemny", file: "afto-mark-black", bg: BRAND.ink },
  { name: "Logotyp", file: "afto-logo", bg: "#07070a" },
  { name: "Logotyp — ciemny", file: "afto-logo-black", bg: BRAND.ink },
  { name: "Ikona — ciemna", file: "afto-icon-dark", bg: "#15151c" },
  { name: "Ikona — fiolet", file: "afto-icon-accent", bg: "#15151c" },
];

const colors: Color[] = [
  { name: "Ink", hex: BRAND.ink, note: "linia znaku, tekst" },
  { name: "Black", hex: BRAND.black, note: "znak na jasnym tle" },
  { name: "Violet", hex: BRAND.accent, note: "kropka, akcent" },
  { name: "Violet jasny", hex: "#B4A2FF", note: "wyróżnienia w tekście" },
  { name: "Tło", hex: "#07070A", note: "tło strony i materiałów" },
];

export default async function BrandPage() {
  await requireAdmin();
  return (
    <>
      <PageHead kicker="Marka" title="Logo i materiały" />
      <BrandBoard announcements={data.announcements} banners={data.banners} logoAnims={logoAnims} assets={assets} proposals={data.logos} colors={colors} />
    </>
  );
}
