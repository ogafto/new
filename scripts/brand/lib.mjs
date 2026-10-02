// Wspólne narzędzia generatora materiałów marki (npm run brand).
// Klatki renderowane deterministycznie: każda scena ma `window.__render(t)` (t w sekundach),
// skrypt ustawia czas ręcznie, robi zrzut i koduje MP4 (ffmpeg-static, H.264) oraz GIF (gifenc).
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import gifenc from "gifenc";
import sharp from "sharp";
import { MARK, STROKE, WORDMARK } from "../../src/lib/logo.ts";

const { GIFEncoder, quantize, applyPalette } = gifenc;

export const ROOT = join(import.meta.dirname, "..", "..");
export const PUBLIC = join(ROOT, "public");

export const C = {
  bg: "#07070a",
  surface: "#0e0e13",
  surface2: "#15151c",
  ink: "#efedf5",
  muted: "#9b98a8",
  dim: "#615e6e",
  accent: "#8b6cff",
  accent2: "#b4a2ff",
  green: "#34d399",
};

const fontB64 = readFileSync(join(ROOT, "src", "fonts", "Satoshi-Variable.woff2")).toString("base64");

// ---------- geometria znaku jako znaczniki SVG ----------

/** Monogram „af.” / logotyp „afto.” — każdy element z `data-i` (kolejność rysowania). */
export function geoSvg(geo, { ink = C.ink, accent = C.accent, id = "", stroke = STROKE, cls = "" } = {}) {
  const items = [
    ...geo.circles.map((c, i) => `<circle data-s="${i}" cx="${c.cx}" cy="${c.cy}" r="${c.r}" stroke="${ink}" stroke-width="${stroke}" fill="none" pathLength="1"/>`),
    ...geo.paths.map((d, i) => `<path data-s="${geo.circles.length + i}" d="${d}" stroke="${ink}" stroke-width="${stroke}" fill="none" pathLength="1"/>`),
  ].join("");
  const { x, y, size } = geo.dot;
  return `<svg ${id ? `id="${id}"` : ""} class="${cls}" viewBox="${geo.viewBox}" fill="none" overflow="visible">${items}<rect class="dot" x="${x}" y="${y}" width="${size}" height="${size}" fill="${accent}" style="transform-box:fill-box;transform-origin:center"/></svg>`;
}

export { MARK, WORDMARK, STROKE };

// ---------- runtime w przeglądarce (wspólny dla scen) ----------

const RUNTIME = /* js */ `
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, k) => a + (b - a) * k;
const E = {
  lin: (x) => x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inCubic: (x) => x * x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  // sprężyna (tłumiona), kończy się w 1
  spring: (x, k = 6.5, z = 0.42) => (x >= 1 ? 1 : 1 - Math.exp(-k * z * x * 1.6) * Math.cos(k * Math.sqrt(1 - z * z) * x * 1.6)),
};
// postęp 0..1 w oknie [a, a+d]
const P = (t, a, d, e = E.outExpo) => e(clamp((t - a) / d));
// wejście i wyjście: rośnie od a (czas d), maleje od b (czas d2)
const IO = (t, a, d, b, d2 = d, e1 = E.outExpo, e2 = E.inOutCubic) => (t < b ? P(t, a, d, e1) : 1 - P(t, b, d2, e2));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// rysowanie linii (pathLength=1); przy pełnym bez dasharray — bez szwów na okręgach
function draw(el, p) {
  if (p >= 0.999) { el.style.strokeDasharray = ""; el.style.strokeDashoffset = ""; el.style.opacity = 1; return; }
  el.style.strokeDasharray = "1 1";
  el.style.strokeDashoffset = String(1 - p);
  el.style.opacity = p > 0.001 ? 1 : 0;
}
// kursor: ścieżka między punktami kluczowymi [t, x, y], łagodny ruch po łuku
function track(t, keys, e = E.inOutCubic) {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, x0, y0] = keys[i], [t1, x1, y1] = keys[i + 1];
    if (t <= t1) {
      const k = e(clamp((t - t0) / Math.max(1e-6, t1 - t0)));
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
      const arc = Math.sin(Math.PI * k) * Math.min(40, len * 0.12);
      return { x: x0 + dx * k + (-dy / (len || 1)) * arc, y: y0 + dy * k + (dx / (len || 1)) * arc };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l[1], y: l[2] };
}
const css = (el, o) => { for (const k in o) el.style[k] = o[k]; };
`;

/** Pełny dokument HTML sceny: style + markup + skrypt definiujący window.__render(t). */
export function page({ w, h, style = "", body = "", script = "" }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Satoshi;src:url(data:font/woff2;base64,${fontB64}) format("woff2");font-weight:300 900;font-display:block}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${C.bg}}
body{font-family:Satoshi,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;font-feature-settings:"ss01" 0}
#stage{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:${C.bg}}
.abs{position:absolute}
${style}
</style></head><body><div id="stage">${body}</div><script>${RUNTIME}
${script}
</script></body></html>`;
}

// ---------- przeglądarka ----------

let browserP = null;
export async function browser() {
  if (!browserP) {
    const { chromium } = await import("playwright-core");
    browserP = chromium.launch({ args: ["--font-render-hinting=none", "--disable-lcd-text"] });
  }
  return browserP;
}
export async function closeBrowser() {
  if (browserP) await (await browserP).close();
  browserP = null;
}

async function openScene(scene) {
  const b = await browser();
  const p = await b.newPage({ viewport: { width: scene.w, height: scene.h }, deviceScaleFactor: scene.scale ?? 1 });
  await p.setContent(scene.html, { waitUntil: "load" });
  await p.evaluate(async () => {
    await document.fonts.load('500 40px Satoshi');
    await document.fonts.ready;
  });
  return p;
}

async function frameAt(p, t) {
  await p.evaluate((t) => window.__render(t), t);
  return p.screenshot({ type: "png", animations: "disabled", caret: "hide" });
}

// ---------- kodowanie ----------

function encodeMp4(file, w, h, fps, crf = 14) {
  mkdirSync(dirname(file), { recursive: true });
  const ff = spawn(ffmpegPath, [
    "-y", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-tune", "animation",
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
    file,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
  return {
    write: (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res))),
    end: async () => {
      ff.stdin.end();
      await done;
    },
  };
}

// porządkowy dithering 4×4 (Bayer) — łagodzi pasmowanie ciemnych przejść w GIF-ie
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v / 16 - 0.5) * 10);
function dither(rgba, w) {
  const out = new Uint8Array(rgba.length);
  for (let i = 0, px = 0; i < rgba.length; i += 4, px++) {
    const x = px % w, y = (px / w) | 0;
    const d = BAYER[(y & 3) * 4 + (x & 3)];
    out[i] = Math.max(0, Math.min(255, rgba[i] + d));
    out[i + 1] = Math.max(0, Math.min(255, rgba[i + 1] + d));
    out[i + 2] = Math.max(0, Math.min(255, rgba[i + 2] + d));
    out[i + 3] = 255;
  }
  return out;
}

function encodeGif(file, frames, w, h, fps, { ditherOn = true, lossy = 0 } = {}) {
  const prepared = frames.map((f) => (ditherOn ? dither(f, w) : f));
  // wspólna paleta z próbki klatek — bez migotania kolorów
  const step = Math.max(1, Math.floor(prepared.length / 24));
  const sample = Buffer.concat(prepared.filter((_, i) => i % step === 0).map((f) => Buffer.from(f.buffer, f.byteOffset, f.byteLength)));
  const palette = quantize(new Uint8Array(sample), 255, { format: "rgb565" });
  const T = palette.length;
  const pal = palette.slice(0, T);
  palette.push([0, 0, 0]);
  const gif = GIFEncoder();
  let shown = null; // indeksy pikseli, które aktualnie widzi odbiorca
  const delay = Math.round(1000 / fps);
  prepared.forEach((rgba, i) => {
    const index = applyPalette(rgba, pal, "rgb565");
    if (!shown) shown = index.slice();
    else {
      // piksel bez (widocznej) zmiany → przezroczysty; `lossy` = tolerancja sumy różnic RGB
      for (let k = 0, o = 0; k < index.length; k++, o += 4) {
        const s = shown[k];
        if (index[k] === s) {
          index[k] = T;
          continue;
        }
        if (lossy) {
          const c = pal[s];
          if (Math.abs(c[0] - rgba[o]) + Math.abs(c[1] - rgba[o + 1]) + Math.abs(c[2] - rgba[o + 2]) <= lossy) {
            index[k] = T;
            continue;
          }
        }
        shown[k] = index[k];
      }
    }
    gif.writeFrame(index, w, h, { palette: i === 0 ? palette : undefined, delay, repeat: 0, transparent: i > 0, transparentIndex: T, dispose: 1 });
  });
  gif.finish();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, gif.bytes());
}

const kb = (f) => statSync(f).size;

/**
 * Renderuje scenę: MP4 (w×h, fps) i/lub GIF (gifW×gifH, gifFps) oraz PNG z klatki `still`.
 * Zwraca opis plików do manifestu.
 */
export async function renderScene(scene, { outDir, base, mp4 = true, gif = true, png = false, sheet = null }) {
  const { w, h, duration, fps = 30 } = scene;
  const gifW = scene.gifW ?? w;
  const gifH = scene.gifH ?? h;
  const gifFps = scene.gifFps ?? 25;
  const p = await openScene(scene);
  const files = {};
  const t0 = Date.now();

  if (mp4) {
    const file = join(outDir, `${base}.mp4`);
    const enc = encodeMp4(file, w, h, fps, scene.crf ?? 14);
    const n = Math.round(duration * fps);
    for (let i = 0; i < n; i++) {
      const shot = await frameAt(p, i / fps);
      await enc.write(await sharp(shot).removeAlpha().raw().toBuffer());
    }
    await enc.end();
    files.mp4 = { path: rel(file), size: kb(file) };
  }

  if (gif) {
    const file = join(outDir, `${base}.gif`);
    const n = Math.round(duration * gifFps);
    const frames = [];
    // tryb GIF: sceny mogą uprościć efekty (bez ziarna, statyczna zorza)
    await p.evaluate(() => document.documentElement.classList.add("gif"));
    for (let i = 0; i < n; i++) {
      const shot = await frameAt(p, i / gifFps);
      let s = sharp(shot);
      if (gifW !== w || gifH !== h) s = s.resize(gifW, gifH, { kernel: "lanczos3" });
      frames.push(new Uint8Array(await s.ensureAlpha().raw().toBuffer()));
    }
    await p.evaluate(() => document.documentElement.classList.remove("gif"));
    encodeGif(file, frames, gifW, gifH, gifFps, { ditherOn: scene.dither !== false, lossy: scene.gifLossy ?? 0 });
    files.gif = { path: rel(file), size: kb(file) };
  }

  if (scene.poster) {
    // kadr podglądu dla <video poster> (gdy przeglądarka nie odtworzy automatycznie)
    const file = join(outDir, `${base}-poster.jpg`);
    const shot = await frameAt(p, scene.still ?? duration * 0.6);
    await sharp(shot).resize(960).jpeg({ quality: 82, mozjpeg: true }).toFile(file);
    files.poster = { path: rel(file), size: kb(file) };
  }

  if (png) {
    const file = join(outDir, `${base}.png`);
    const shot = await frameAt(p, scene.still ?? duration * 0.6);
    await sharp(shot).png({ compressionLevel: 9 }).toFile(file);
    files.png = { path: rel(file), size: kb(file) };
  }

  if (sheet) await contactSheet(p, scene, sheet);
  await p.close();
  console.log(`  ✓ ${base}  ${Object.entries(files).map(([k, v]) => `${k} ${(v.size / 1024 / 1024).toFixed(2)} MB`).join(" · ")}  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  return files;
}

/** Arkusz kontrolny klatek kluczowych (do przeglądu jakości). */
export async function contactSheet(p, scene, file, times = null) {
  const ts = times ?? scene.keys ?? Array.from({ length: 8 }, (_, i) => (scene.duration * (i + 0.5)) / 8);
  const cols = scene.w / scene.h > 3 ? 1 : 2;
  const tw = cols === 1 ? 1000 : 800;
  const th = Math.round((tw * scene.h) / scene.w);
  const tiles = [];
  for (const [i, t] of ts.entries()) {
    const shot = await frameAt(p, t);
    const img = await sharp(shot).resize(tw, th).png().toBuffer();
    tiles.push({ input: img, left: (i % cols) * (tw + 8), top: Math.floor(i / cols) * (th + 8) });
  }
  const rows = Math.ceil(ts.length / cols);
  mkdirSync(dirname(file), { recursive: true });
  await sharp({ create: { width: cols * tw + (cols - 1) * 8, height: rows * th + (rows - 1) * 8, channels: 3, background: "#333" } })
    .composite(tiles)
    .png()
    .toFile(file);
}

export async function stills(scene, times, file) {
  const p = await openScene(scene);
  await contactSheet(p, scene, file, times);
  await p.close();
}

export const rel = (f) => "/" + f.slice(PUBLIC.length + 1).split("\\").join("/");
export const size = kb;
