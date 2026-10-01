// Animowane logo → GIF (public/brand/anim). Wymaga działającego `npm run dev`.
// Użycie: BASE=http://localhost:3000 npm run logo:gif
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";
import gifenc from "gifenc";

const { GIFEncoder, quantize, applyPalette } = gifenc;
const BASE = process.env.BASE || "http://localhost:3000";
const FPS = 30;
const out = join(import.meta.dirname, "..", "public", "brand", "anim");
mkdirSync(out, { recursive: true });

const jobs = [
  { name: "afto-mark-anim-dark", variant: "mark", w: 1080, h: 1080, loop: 4.8 },
  { name: "afto-mark-anim-light", variant: "mark-light", w: 1080, h: 1080, loop: 4.8 },
  { name: "afto-logo-anim-dark", variant: "logo", w: 1600, h: 800, loop: 5.2 },
  { name: "afto-logo-anim-light", variant: "logo-light", w: 1600, h: 800, loop: 5.2 },
  { name: "afto-banner-anim", variant: "banner", w: 1500, h: 500, loop: 6.4 },
  { name: "afto-post-anim", variant: "square", w: 1080, h: 1080, loop: 6.4 },
];

const browser = await chromium.launch();
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/brand/capture/${job.variant}`, { waitUntil: "load", timeout: 120000 });
  await page.addStyleTag({ content: "nextjs-portal,[role=dialog],[role=status]{display:none!important}" });
  await page.waitForFunction(() => "__setT" in window, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const frames = Math.round(job.loop * FPS);
  const raw = [];
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.__setT(t), i / FPS);
    await page.waitForTimeout(16);
    const png = await page.locator("#stage").screenshot();
    raw.push(await sharp(png).ensureAlpha().raw().toBuffer());
  }
  // wspólna paleta z kilku klatek (255 kolorów + 1 przezroczysty) — brak migotania kolorów
  const sample = Buffer.concat(raw.filter((_, i) => i % Math.ceil(frames / 8) === 0));
  const palette = quantize(new Uint8Array(sample), 255, { format: "rgb565" });
  const T = palette.length;
  palette.push([0, 0, 0]);
  const gif = GIFEncoder();
  let prev = null;
  raw.forEach((buf, i) => {
    const index = applyPalette(new Uint8Array(buf), palette.slice(0, T), "rgb565");
    // piksele bez zmian względem poprzedniej klatki → przezroczyste (mniejszy plik, ta sama jakość)
    if (prev) {
      const cur = index.slice();
      for (let k = 0; k < index.length; k++) if (index[k] === prev[k]) index[k] = T;
      prev = cur;
    } else prev = index.slice();
    gif.writeFrame(index, job.w, job.h, {
      palette: i === 0 ? palette : undefined,
      delay: 1000 / FPS,
      repeat: 0,
      transparent: i > 0,
      transparentIndex: T,
      dispose: 1,
    });
  });
  gif.finish();
  writeFileSync(join(out, `${job.name}.gif`), gif.bytes());
  console.log(`✓ ${job.name}.gif (${frames} klatek)`);
  await page.close();
}
await browser.close();
