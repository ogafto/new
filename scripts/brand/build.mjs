// Generator materiałów marki: zapowiedzi (Discord), banery 1500×300, propozycje logo.
// Użycie:
//   npm run brand                       — wszystko
//   npm run brand -- --only=baner       — tylko pliki, których id zawiera „baner”
//   npm run brand -- --sheets=DIR       — tylko arkusze klatek kluczowych (podgląd jakości) do DIR
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC, ROOT, closeBrowser, renderScene, stills } from "./lib.mjs";
import { announcements } from "./zapowiedzi.mjs";
import { banners } from "./banery.mjs";
import { buildLogos } from "./logo.mjs";

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const only = arg("only");
const sheets = arg("sheets");
const pick = (list) => list.filter((s) => !only || s.id.includes(only));

const MANIFEST = join(ROOT, "src", "app", "panel", "admin", "marka", "assets.json");
let manifest = { announcements: [], banners: [], logos: [] };
try {
  manifest = { ...manifest, ...JSON.parse(readFileSync(MANIFEST, "utf8")) };
} catch {}
const upsert = (key, entry) => {
  const list = manifest[key].filter((e) => e.id !== entry.id);
  list.push(entry);
  manifest[key] = list.sort((a, b) => a.id.localeCompare(b.id));
};
const meta = ({ id, name, desc, w, h, duration }) => ({ id, name, desc, w, h, duration });

if (sheets) {
  mkdirSync(sheets, { recursive: true });
  for (const s of pick([...announcements(), ...banners()])) {
    await stills(s, s.keys ?? Array.from({ length: 6 }, (_, i) => (s.duration * (i + 0.5)) / 6), join(sheets, `${s.id}.png`));
    console.log(`  ✓ ${s.id}`);
  }
  await closeBrowser();
  process.exit(0);
}

const anim = pick(announcements());
if (anim.length) console.log("Zapowiedzi (public/brand/discord)");
for (const s of anim) {
  const files = await renderScene(s, { outDir: join(PUBLIC, "brand", "discord"), base: s.id });
  upsert("announcements", { ...meta(s), files });
}

const ban = pick(banners());
if (ban.length) console.log("Banery (public/brand/banners)");
for (const s of ban) {
  const files = await renderScene(s, { outDir: join(PUBLIC, "brand", "banners"), base: s.id, png: true, mp4: s.animated, gif: s.animated });
  upsert("banners", { ...meta(s), animated: !!s.animated, files });
}
await closeBrowser();

if (!only || "logo".includes(only) || only.startsWith("logo")) {
  console.log("Propozycje logo (public/brand/logo-proposals)");
  for (const entry of await buildLogos(only)) upsert("logos", entry);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log("✓ manifest: src/app/panel/admin/marka/assets.json");
