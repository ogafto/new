// Eksport logo do public/brand (SVG + PNG). Uruchom: npm run logo
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { BRAND, MARK, WORDMARK, toSvg } from "../src/lib/logo.ts";

const out = join(import.meta.dirname, "..", "public", "brand");
mkdirSync(out, { recursive: true });

// Ikona aplikacji: monogram na tle, z marginesem
function icon(bg: string, ink: string, accent: string) {
  const inner = toSvg(MARK, { ink, accent }).replace(/^<svg[^>]*>|<\/svg>$/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="-10 -7 64 64" fill="none"><rect x="-10" y="-7" width="64" height="64" rx="14" fill="${bg}"/>${inner}</svg>`;
}

const files: Record<string, string> = {
  "afto-mark.svg": toSvg(MARK),
  "afto-mark-black.svg": toSvg(MARK, { ink: BRAND.black }),
  "afto-mark-mono-white.svg": toSvg(MARK, { ink: "#FFFFFF", accent: "#FFFFFF" }),
  "afto-mark-mono-black.svg": toSvg(MARK, { ink: "#000000", accent: "#000000" }),
  "afto-logo.svg": toSvg(WORDMARK),
  "afto-logo-black.svg": toSvg(WORDMARK, { ink: BRAND.black }),
  "afto-logo-mono-white.svg": toSvg(WORDMARK, { ink: "#FFFFFF", accent: "#FFFFFF" }),
  "afto-logo-mono-black.svg": toSvg(WORDMARK, { ink: "#000000", accent: "#000000" }),
  "afto-icon-dark.svg": icon(BRAND.black, BRAND.ink, BRAND.accent),
  "afto-icon-accent.svg": icon(BRAND.accent, "#FFFFFF", "#FFFFFF"),
  "afto-icon-light.svg": icon(BRAND.ink, BRAND.black, BRAND.accent),
};

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(out, name), svg);
  const width = name.includes("logo") ? 2400 : 1024;
  await sharp(Buffer.from(svg), { density: 1200 }).resize({ width }).png().toFile(join(out, name.replace(".svg", ".png")));
}

console.log(`✓ ${Object.keys(files).length * 2} plików w public/brand`);
