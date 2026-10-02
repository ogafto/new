// Generator materiałów marki → public/brand + manifest src/app/panel/admin/marka/assets.json
// Użycie:
//   npm run brand                         — wszystko
//   npm run brand -- --only=haslo         — tylko pozycje, których id zawiera „haslo” (manifest uzupełniany)
//   npm run brand -- --sheets=DIR         — tylko arkusze klatek kluczowych do przeglądu (bez plików wyjściowych)
//   npm run brand -- --manifest           — tylko odświeża manifest z istniejących plików
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { PUBLIC, ROOT, closeBrowser, renderScene, size, stills } from "./lib.mjs";
import { announcements } from "./zapowiedzi.mjs";
import { banners } from "./banery.mjs";
import { buildLogos } from "./logo.mjs";
import { slogans } from "./haslo.mjs";
import { teasers } from "./nowa-strona.mjs";
import { verification } from "./weryfikacja.mjs";

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}`))?.split("=")[1] ?? (process.argv.includes(`--${k}`) ? true : undefined);
const only = arg("only");
const sheets = arg("sheets");
const manifestOnly = arg("manifest") === true;
const pick = (list) => list.filter((s) => !only || s.id.includes(only));

const MANIFEST = join(ROOT, "src", "app", "panel", "admin", "marka", "assets.json");
const ANIM_DIR = join(PUBLIC, "brand", "animacje");

// ---------- sceny ----------
const NEW = () => [...slogans(), ...teasers(), ...verification()];
const OLD_ANIM = () => announcements();
const OLD_BAN = () => banners();

if (sheets) {
  mkdirSync(sheets, { recursive: true });
  for (const s of pick([...NEW(), ...OLD_ANIM(), ...OLD_BAN()])) {
    await stills(s, s.keys ?? Array.from({ length: 6 }, (_, i) => (s.duration * (i + 0.5)) / 6), join(sheets, `${s.id}.png`));
    console.log(`  ✓ ${s.id}`);
  }
  await closeBrowser();
  process.exit(0);
}

if (!manifestOnly) {
  const groups = [
    ["Animacje premium (public/brand/animacje)", pick(NEW()), (s) => ({ outDir: ANIM_DIR, base: s.id })],
    ["Zapowiedzi starsze (public/brand/discord)", pick(OLD_ANIM()), (s) => ({ outDir: join(PUBLIC, "brand", "discord"), base: s.id })],
    ["Banery 1500×300 (public/brand/banners)", pick(OLD_BAN()), (s) => ({ outDir: join(PUBLIC, "brand", "banners"), base: s.id, png: true, mp4: s.animated, gif: s.animated })],
  ];
  for (const [label, list, opts] of groups) {
    if (!list.length) continue;
    console.log(label);
    for (const s of list) await renderScene(s, opts(s));
  }
  await closeBrowser();
  if (!only || only.startsWith("logo")) {
    console.log("Propozycje logo (public/brand/logo-proposals)");
    await buildLogos();
  }
}

// ---------- manifest (budowany z plików na dysku, więc częściowe przebiegi go nie psują) ----------
const url = (abs) => "/" + abs.slice(PUBLIC.length + 1).split("\\").join("/");
// label: podpis przycisku pobierania (np. „PNG 512 × 512” dla awatara)
const fileEntry = (abs, kind, label = kind.toUpperCase()) => (existsSync(abs) ? { kind, url: url(abs), bytes: size(abs), label } : null);
const filesFor = (dir, base, kinds) => kinds.map(([ext, kind, label]) => fileEntry(join(dir, `${base}${ext}`), kind, label)).filter(Boolean);

const items = [];
const anim = (s, dir, group, extra = {}) => {
  const files = filesFor(dir, s.id, [[".mp4", "mp4"], [".gif", "gif"]]);
  if (!files.length) return;
  const poster = [join(dir, `${s.id}-poster.jpg`), join(dir, `${s.id}.png`)].find(existsSync);
  items.push({ id: s.id, category: "animacje", group, title: s.title ?? s.name, description: s.description ?? s.desc, w: s.w, h: s.h, duration: s.duration, ...(poster ? { poster: url(poster) } : {}), files, ...extra });
};

for (const s of NEW()) anim(s, ANIM_DIR, s.group);
for (const s of OLD_ANIM()) anim(s, join(PUBLIC, "brand", "discord"), "Zapowiedzi (starsze)");
for (const s of OLD_BAN()) {
  const dir = join(PUBLIC, "brand", "banners");
  if (s.animated) anim(s, dir, "Banery 1500 × 300");
  const png = filesFor(dir, s.id, [[".png", "png"]]);
  if (png.length) items.push({ id: `${s.id}-png`, category: "grafiki", group: "Banery 1500 × 300", title: s.name, description: s.desc, w: s.w, h: s.h, files: png });
}

// animacje logo (starszy eksport: npm run logo:gif) + kadry podglądu
const LOGO_ANIMS = [
  ["afto-banner-anim", "Baner — animacja", 1500, 500, 6.4],
  ["afto-mark-anim-dark", "Monogram — ciemny", 1080, 1080, 4.8],
  ["afto-mark-anim-light", "Monogram — jasny", 1080, 1080, 4.8],
  ["afto-post-anim", "Post — kwadrat", 1080, 1080, 6.4],
  ["afto-logo-anim-dark", "Logotyp — ciemny", 1600, 800, 5.2],
  ["afto-logo-anim-light", "Logotyp — jasny", 1600, 800, 5.2],
];
const animDir = join(PUBLIC, "brand", "anim");
for (const [id, title, w, h, duration] of LOGO_ANIMS) {
  const gif = join(animDir, `${id}.gif`);
  if (!existsSync(gif)) continue;
  const poster = join(animDir, `${id}-poster.jpg`);
  if (!existsSync(poster)) spawnSync(ffmpegPath, ["-v", "error", "-y", "-ss", String(duration * 0.55), "-i", gif, "-frames:v", "1", "-q:v", "3", poster]);
  items.push({ id, category: "animacje", group: "Animacje logo", title, description: "Monogram i logotyp rysowane linią — GIF 30 kl./s, zapętlony.", w, h, duration, ...(existsSync(poster) ? { poster: url(poster) } : {}), files: [fileEntry(gif, "gif")] });
}

// oficjalne pliki logo (npm run logo)
const OFFICIAL = [
  ["afto-mark", "Monogram", "#07070a"],
  ["afto-mark-black", "Monogram — ciemny", "#F2F1EC"],
  ["afto-mark-mono-white", "Monogram — biały", "#07070a"],
  ["afto-mark-mono-black", "Monogram — czarny", "#F2F1EC"],
  ["afto-logo", "Logotyp", "#07070a"],
  ["afto-logo-black", "Logotyp — ciemny", "#F2F1EC"],
  ["afto-logo-mono-white", "Logotyp — biały", "#07070a"],
  ["afto-logo-mono-black", "Logotyp — czarny", "#F2F1EC"],
  ["afto-icon-dark", "Ikona — ciemna", "#15151c"],
  ["afto-icon-accent", "Ikona — fiolet", "#15151c"],
  ["afto-icon-light", "Ikona — jasna", "#15151c"],
];
const brandDir = join(PUBLIC, "brand");
const dims = (file) => {
  const m = readFileSync(file, "utf8").match(/width="([\d.]+)" height="([\d.]+)"/);
  return m ? [+m[1], +m[2]] : [0, 0];
};
for (const [id, title, bg] of OFFICIAL) {
  const files = filesFor(brandDir, id, [[".svg", "svg"], [".png", "png"]]);
  if (!files.length) continue;
  const [w, h] = dims(join(brandDir, `${id}.svg`));
  items.push({ id, category: "grafiki", group: "Logo — oficjalne", title, description: "Oficjalny plik znaku (SVG + PNG w wysokiej rozdzielczości).", w, h, bg, files });
}

// propozycje logo (logo.mjs zapisuje metadane obok plików)
const propDir = join(PUBLIC, "brand", "logo-proposals");
const propMeta = existsSync(join(propDir, "meta.json")) ? JSON.parse(readFileSync(join(propDir, "meta.json"), "utf8")) : [];
for (const p of propMeta) {
  const files = filesFor(propDir, p.id, [[".svg", "svg"], [".png", "png"], ["-512.png", "png", "PNG 512 × 512"]]);
  if (files.length) items.push({ id: p.id, category: "grafiki", group: "Propozycje logo", title: p.name, description: p.desc, w: p.w, h: p.h, bg: p.bg, ...(p.round ? { round: true } : {}), files });
}

// porządek: grupy w kolejności pojawienia się, wewnątrz wg id
const order = [...new Set(items.map((i) => i.group))];
items.sort((a, b) => (a.category === b.category ? order.indexOf(a.group) - order.indexOf(b.group) || a.id.localeCompare(b.id) : a.category === "animacje" ? -1 : 1));
// zgodność wstecz: dotychczasowa strona „Marka” czyta klucze announcements/banners/logos
const legacyFiles = (it) => Object.fromEntries(it.files.map((f) => [f.url.endsWith("-512.png") ? "avatar" : f.kind, { path: f.url, size: f.bytes }]).concat(it.poster ? [["poster", { path: it.poster, size: 0 }]] : []));
const legacy = {
  announcements: items.filter((i) => i.group === "Zapowiedzi (starsze)").map((i) => ({ id: i.id, name: i.title, desc: i.description, w: i.w, h: i.h, duration: i.duration, files: legacyFiles(i) })),
  banners: OLD_BAN()
    .map((s) => {
      const a = items.find((i) => i.id === s.id);
      const p = items.find((i) => i.id === `${s.id}-png`);
      if (!a && !p) return null;
      return { id: s.id, name: s.name, desc: s.desc, w: s.w, h: s.h, duration: s.duration, animated: !!s.animated, files: { ...(a ? legacyFiles(a) : {}), ...(p ? legacyFiles(p) : {}) } };
    })
    .filter(Boolean),
  logos: items.filter((i) => i.group === "Propozycje logo").map((i) => ({ id: i.id, name: i.title, desc: i.description, bg: i.bg, round: i.round, files: legacyFiles(i) })),
};

writeFileSync(MANIFEST, JSON.stringify({ version: 2, generated: new Date().toISOString(), items, ...legacy }, null, 2) + "\n");
console.log(`✓ manifest: ${items.length} pozycji → src/app/panel/admin/marka/assets.json`);
