/*
 * Logo afto — jedno źródło geometrii dla strony i eksportu plików.
 * Linia o stałej grubości (monoline), siatka 4 px, x-height 23, kropka = znak firmowy.
 * Eksport: `npm run logo` → public/brand/*.svg + *.png
 */

export const BRAND = {
  ink: "#F2F1EC",
  black: "#0B0B0D",
  accent: "#8B6CFF",
};

const S = 5; // grubość linii

// Monogram "af." — brzuszek "a" dzieli trzon z "f"
export const MARK = {
  viewBox: "0 3 44 44",
  width: 44,
  height: 44,
  circles: [{ cx: 16, cy: 31, r: 9 }],
  paths: ["M25 42.5V17a7 7 0 0 1 7-7h7.5", "M25 24h9.5"],
  dot: { x: 34.5, y: 37.5, size: 5 },
};

// Logotyp "afto."
export const WORDMARK = {
  viewBox: "0 3 106 44",
  width: 106,
  height: 44,
  circles: [
    { cx: 16, cy: 31, r: 9 },
    { cx: 81, cy: 31, r: 9 },
  ],
  paths: [
    "M25 19.5v23", // a
    "M36 42.5V17a7 7 0 0 1 7-7h5", // f
    "M31 24h14",
    "M56 12v21a7 7 0 0 0 7 7h3", // t
    "M51 24h12",
  ],
  dot: { x: 96.5, y: 37.5, size: 5 },
};

type Geo = typeof MARK | typeof WORDMARK;

export function toSvg(g: Geo, { ink = BRAND.ink, accent = BRAND.accent, bg, radius = 0, scale = 1 }: { ink?: string; accent?: string; bg?: string; radius?: number; scale?: number } = {}) {
  const [x, y, w, h] = g.viewBox.split(" ").map(Number);
  const body = [
    ...g.circles.map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" stroke="${ink}" stroke-width="${S}"/>`),
    ...g.paths.map((d) => `<path d="${d}" stroke="${ink}" stroke-width="${S}"/>`),
    `<rect x="${g.dot.x}" y="${g.dot.y}" width="${g.dot.size}" height="${g.dot.size}" fill="${accent}"/>`,
  ].join("");
  const back = bg ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${bg}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="${g.viewBox}" fill="none">${back}${body}</svg>`;
}

export const STROKE = S;
