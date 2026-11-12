import { GifReader } from "omggif";

/*
 * GIF → MP4 w przeglądarce (panel). Wygląda tak samo, ale waży kilka–kilkanaście razy mniej,
 * a przeglądarka odtwarza wideo kartą graficzną. Duże GIF-y rozpakowuje procesor i to one zacinały stronę.
 * Klatki składamy jak przeglądarka (przezroczystość, sposób usuwania klatki, opóźnienia),
 * kodujemy w H.264 (działa wszędzie, także na iPhonie) i pakujemy do MP4.
 * Gdy przeglądarka nie umie kodować wideo, zwracamy null i zostaje zwykły GIF.
 */

const MAX = { w: 1920, h: 1080 };
const BG = "#0e0e13"; // tło pod przezroczyste piksele (MP4 nie ma przezroczystości) = tło kafelka na stronie

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

export async function gifToMp4(file: File, onProgress?: (p: number) => void): Promise<File | null> {
  if (typeof VideoEncoder === "undefined" || typeof OffscreenCanvas === "undefined") return null;

  let gif: GifReader;
  try {
    gif = new GifReader(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return null;
  }
  const W = gif.width;
  const H = gif.height;
  const n = gif.numFrames();
  if (n < 2 || !W || !H) return null; // nieruchomy GIF zostaje obrazkiem

  // wymiary wideo: najwyżej 1920 × 1080, parzyste (wymóg H.264)
  const s = Math.min(1, MAX.w / W, MAX.h / H);
  const w = even(W * s);
  const h = even(H * s);

  const mb = await import("mediabunny");
  const quality = mb.QUALITY_VERY_HIGH; // klatki z GIF-ów są „ziarniste” (dithering), przy niższej jakości widać bloki
  if (!(await mb.canEncodeVideo("avc", { width: w, height: h, quality }).catch(() => false))) return null;

  const pixels = new Uint8ClampedArray(W * H * 4);
  const frame = new ImageData(pixels, W, H);
  const src = new OffscreenCanvas(W, H);
  const sctx = src.getContext("2d")!;
  const out = new OffscreenCanvas(w, h);
  const octx = out.getContext("2d", { alpha: false })!;
  octx.imageSmoothingQuality = "high";

  const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }), target: new mb.BufferTarget() });
  const video = new mb.CanvasSource(out, { codec: "avc", quality, keyFrameInterval: 2, latencyMode: "quality" });
  output.addVideoTrack(video);
  await output.start();

  try {
    let t = 0;
    for (let i = 0; i < n; i++) {
      const f = gif.frameInfo(i);
      const before = f.disposal === 3 ? pixels.slice() : null;
      gif.decodeAndBlitFrameRGBA(i, pixels);

      sctx.putImageData(frame, 0, 0);
      octx.fillStyle = BG;
      octx.fillRect(0, 0, w, h);
      octx.drawImage(src, 0, 0, w, h);

      // opóźnienie w setnych sekundy; 0–1 przeglądarki pokazują jako 0,1 s
      const d = (f.delay <= 1 ? 10 : f.delay) / 100;
      await video.add(t, d);
      t += d;

      // przed następną klatką: wyczyść obszar tej klatki albo przywróć stan sprzed niej
      if (f.disposal === 2) {
        for (let y = f.y; y < Math.min(H, f.y + f.height); y++) pixels.fill(0, (y * W + f.x) * 4, (y * W + Math.min(W, f.x + f.width)) * 4);
      } else if (before) pixels.set(before);

      onProgress?.(((i + 1) / n) * 100);
      if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0)); // nie zamrażaj panelu przy długich GIF-ach
    }
    await output.finalize();
  } catch (e) {
    await output.cancel().catch(() => {});
    console.warn("GIF → MP4 nie wyszedł, zostaje GIF", e);
    return null;
  }

  const buf = output.target.buffer;
  if (!buf) return null;
  const name = file.name.replace(/\.gif$/i, "") + ".mp4";
  return new File([buf], name, { type: "video/mp4" });
}
