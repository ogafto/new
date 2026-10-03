import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listBrandAssets, listBrandColors } from "@/lib/brand";
import { BRAND } from "@/lib/logo";
import { setting } from "@/lib/settings";
import { blobAccess } from "@/lib/storage";
import { PageHead } from "@/components/panel/kit";
import BrandBoard, { type GenFile, type Generated, type PaletteColor } from "./BrandBoard";
import manifest from "./assets.json";

export const metadata: Metadata = { title: "Marka i logo" };

/*
 * Materiały marki:
 * - wygenerowane skryptem `npm run brand` (assets.json → public/brand/…),
 * - oficjalne pliki logo i animacje logo (public/brand),
 * - pliki i kolory dodane w panelu (baza + Vercel Blob / dysk).
 */

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const ext = (u: string) => u.split("?")[0].split(".").pop()!.toLowerCase();

function files(v: unknown): GenFile[] {
  if (Array.isArray(v)) return v.map((f: Raw) => ({ kind: str(f.kind) ?? ext(str(f.url) ?? str(f.path) ?? ""), url: str(f.url) ?? str(f.path) ?? "", bytes: num(f.bytes) ?? num(f.size), label: str(f.label) })).filter((f) => f.url);
  if (v && typeof v === "object")
    return Object.entries(v as Record<string, Raw | string>)
      .filter(([k]) => k !== "poster")
      .flatMap(([k, f]) => (typeof f === "string" ? [{ kind: ext(f), url: f }] : str(f.path) || str(f.url) ? [{ kind: ext(str(f.path) ?? str(f.url)!) || k, url: (str(f.path) ?? str(f.url))!, bytes: num(f.size) ?? num(f.bytes) }] : []));
  return [];
}
const posterOf = (e: Raw) => str(e.poster) ?? str(((e.files as Raw | undefined)?.poster as Raw | undefined)?.path);

// manifesty bez pola `section` — przypisanie po nazwie grupy
function sectionFor(group: string, animated: boolean) {
  const g = group.toLowerCase();
  if (g.includes("nowej strony")) return "Zapowiedź nowej strony";
  if (g.includes("starsze") || g.includes("discorda")) return "Archiwum";
  if (g.includes("zapowied") || g.includes("nadchodzi")) return "Zapowiedzi";
  if (g.includes("weryfik")) return "Weryfikacja";
  if (g.includes("hasł") || (animated && g.includes("baner"))) return "Banery z hasłem";
  if (g.includes("animacje logo") || (animated && g.includes("logo"))) return "Logo animowane";
  if (g.includes("propozycj")) return "Propozycje logo";
  if (g.includes("logo")) return "Logo";
  if (g.includes("baner")) return "Banery";
  return group;
}

function entry(e: Raw, fallback: { group: string; category?: "animacje" | "grafiki" }): Generated {
  const fs = files(e.files);
  const animated = fs.some((f) => ["mp4", "webm", "gif"].includes(f.kind));
  return {
    id: str(e.id) ?? fs[0]?.url ?? Math.random().toString(36),
    category: (str(e.category) as Generated["category"]) ?? fallback.category ?? (animated ? "animacje" : "grafiki"),
    section: str(e.section) ?? sectionFor(str(e.group) ?? fallback.group, animated),
    group: str(e.group) ?? fallback.group,
    title: str(e.title) ?? str(e.name) ?? "Bez nazwy",
    description: str(e.description) ?? str(e.desc),
    w: num(e.w),
    h: num(e.h),
    duration: num(e.duration),
    poster: posterOf(e),
    bg: str(e.bg),
    files: fs,
  };
}

function fromManifest(m: unknown): Generated[] {
  if (Array.isArray(m)) return m.map((e) => entry(e as Raw, { group: "Materiały" }));
  const o = (m ?? {}) as Record<string, unknown>;
  if (Array.isArray(o.items)) return (o.items as Raw[]).map((e) => entry(e, { group: "Materiały" }));
  // starszy format: { announcements, banners, logos }
  const out: Generated[] = [];
  for (const e of (o.announcements as Raw[]) ?? []) out.push(entry(e, { group: "Zapowiedzi na Discorda", category: "animacje" }));
  for (const e of (o.banners as Raw[]) ?? []) {
    const g = entry(e, { group: "Banery 1500 × 300" });
    out.push(g);
    const png = g.files.find((f) => f.kind === "png");
    if (g.category === "animacje" && png) out.push({ ...g, id: `${g.id}-png`, category: "grafiki", group: "Banery 1500 × 300", files: [png], poster: undefined });
  }
  for (const e of (o.logos as Raw[]) ?? []) out.push(entry(e, { group: "Propozycje logo", category: "grafiki" }));
  return out;
}

const official: Generated[] = [
  { file: "afto-mark", title: "Monogram", bg: "#07070a" },
  { file: "afto-mark-black", title: "Monogram — na jasne tło", bg: BRAND.ink },
  { file: "afto-logo", title: "Logotyp", bg: "#07070a" },
  { file: "afto-logo-black", title: "Logotyp — na jasne tło", bg: BRAND.ink },
  { file: "afto-icon-dark", title: "Ikona — ciemna", bg: "#15151c" },
  { file: "afto-icon-accent", title: "Ikona — fiolet", bg: "#15151c" },
].map((a) => ({ id: a.file, category: "grafiki" as const, group: "Logo — oficjalne pliki", title: a.title, bg: a.bg, w: 4, h: 3, files: [{ kind: "svg", url: `/brand/${a.file}.svg` }, { kind: "png", url: `/brand/${a.file}.png` }] }));

const logoAnims: Generated[] = [
  { file: "afto-banner-anim", title: "Baner z logo", w: 1500, h: 500 },
  { file: "afto-mark-anim-dark", title: "Monogram — ciemny", w: 1080, h: 1080 },
  { file: "afto-mark-anim-light", title: "Monogram — jasny", w: 1080, h: 1080 },
  { file: "afto-post-anim", title: "Post — kwadrat", w: 1080, h: 1080 },
  { file: "afto-logo-anim-dark", title: "Logotyp — ciemny", w: 1600, h: 800 },
  { file: "afto-logo-anim-light", title: "Logotyp — jasny", w: 1600, h: 800 },
].map((a) => ({ id: a.file, category: "animacje" as const, group: "Animacje logo", title: a.title, w: a.w, h: a.h, files: [{ kind: "gif", url: `/brand/anim/${a.file}.gif` }] }));

const palette: PaletteColor[] = [
  { name: "Ink", hex: BRAND.ink, note: "linia znaku, tekst" },
  { name: "Black", hex: BRAND.black, note: "znak na jasnym tle" },
  { name: "Violet", hex: BRAND.accent, note: "kropka, akcent" },
  { name: "Violet jasny", hex: "#B4A2FF", note: "wyróżnienia w tekście" },
  { name: "Tło", hex: "#07070A", note: "tło strony i materiałów" },
].map((c) => ({ ...c, hex: c.hex.toUpperCase() }));

export default async function BrandPage() {
  await requireAdmin();
  const [own, colors, token] = await Promise.all([listBrandAssets(), listBrandColors(), setting("blob_token")]);
  const blob = token ? await blobAccess(token).catch(() => null) : null;
  // nowy manifest (items) zawiera już animacje logo i oficjalne pliki — starszy nie
  const hasItems = Array.isArray((manifest as { items?: unknown }).items);
  const generated = hasItems ? fromManifest(manifest) : [...fromManifest(manifest), ...logoAnims, ...official];
  return (
    <>
      <PageHead kicker="Strona" title="Marka i logo" />
      <BrandBoard generated={generated} own={own} palette={palette} colors={colors} blob={blob} />
    </>
  );
}
