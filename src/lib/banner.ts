/*
 * Animowany baner 1500 × 300 „plik projektowy”: prowadnice budują znak af., kursor przeciąga zaznaczenie
 * i wpisuje tekst. Wszystko rysowane na canvasie (deterministycznie od czasu t), więc ten sam kod
 * daje podgląd, GIF (własny koder, bez bibliotek), wideo (MediaRecorder) i PNG.
 * Tylko w przeglądarce.
 */

export const BANNER = { W: 1500, H: 300, D: 8 };
const { W, H, D } = BANNER;
const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const oExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const oQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const iCubic = (x: number) => x * x * x;
const ioQuart = (x: number) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2);
const oBack = (x: number) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);

const V = "#8b6cff";
const INK = "#efedf5";
const BG = "#07070a";
const ANCH = [[16, 22], [25, 31], [16, 40], [7, 31], [25, 42.5], [25, 17], [32, 10], [39.5, 10], [34.5, 24]] as const;
// długości ścieżek znaku (j. logo): trzon 25,5 + łuk ¼ koła r=7 + 7,5; poprzeczka 9,5
const LEN = { stem: 25.5 + 3.5 * Math.PI + 7.5 + 0.5, bar: 10 };

type Ctx = CanvasRenderingContext2D;
type Metrics = { w: number; inkAsc: number; inkDesc: number; maxDesc: number; xh: number };

export type Scene = {
  text: string;
  font: string;
  size: number;
  s: number;
  m: Metrics;
  Y: number;
  ox: number;
  oy: number;
  left: number;
  right: number;
  chars: string[];
  lt: { x: number; end: number; tin: number; tout: number }[];
  sq: number;
  sqx: number;
  box: { x0: number; y0: number; x1: number; y1: number };
  typedEnd: number;
  bg: Record<string, HTMLCanvasElement>;
  paths: { stem: Path2D; bar: Path2D; arrow: Path2D };
};

let mctx: Ctx | null = null;
const measurer = () => (mctx ??= document.createElement("canvas").getContext("2d")!);

function setFont(c: Ctx, font: string, size: number, weight = 500) {
  c.font = `${weight} ${size}px ${font}`;
  c.letterSpacing = `${-0.04 * size}px`;
}

function measure(text: string, size: number, font: string): Metrics {
  const c = measurer();
  setFont(c, font, size);
  const m = c.measureText(text);
  const a = c.measureText("kfhl" + text);
  const d = c.measureText("yjgp" + text);
  return { w: m.width, inkAsc: a.actualBoundingBoxAscent, inkDesc: Math.max(m.actualBoundingBoxDescent, 0), maxDesc: d.actualBoundingBoxDescent, xh: c.measureText("x").actualBoundingBoxAscent };
}

/** Font strony (next/font) do użycia w canvasie. */
export function siteFont() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-satoshi").trim();
  return v || "ui-sans-serif, system-ui, sans-serif";
}

/**
 * Logo i napis na wspólnej linii bazowej i z tą samą wysokością x (23 j. logo).
 * Za długi tekst zmniejsza cały układ, żeby zmieścił się między marginesami.
 */
export function createScene(raw: string, font: string): Scene {
  const text = raw.trim().replace(/\s+/g, " ") || "weryfikacja";
  const margin = 112, gap = 120, maxX = 84;
  const r = measure(text, 100, font);
  const xr = r.xh / 100;
  const perSize = (r.w + 13.5) / 100;
  let h = Math.min(maxX, (W - 2 * margin - gap) / (35 / 23 + perSize / xr));
  h = Math.min(h, 200 / ((r.inkAsc + r.maxDesc) / 100 / xr));
  const size = h / xr, s = h / 23;
  const m = measure(text, size, font);
  const Y = Math.round(150 + (Math.max(35 * s, m.inkAsc) - m.inkDesc) / 2 + (m.inkDesc ? 0 : -6));
  const ox = margin - 4.5 * s, oy = Y - 42.5 * s;
  const right = W - margin;
  const left = right - (m.w + size * 0.135);

  const chars = [...text];
  const c = measurer();
  setFont(c, font, size);
  const prefix = (i: number) => c.measureText(chars.slice(0, i).join("")).width;
  const sq = size * 0.105, sqx = m.w + size * 0.03;
  const n = chars.length + 1;
  const step = Math.min(0.075, 1.0 / n), back = Math.min(0.035, 0.55 / n);
  const lt = Array.from({ length: n }, (_, i) => ({ x: i < chars.length ? prefix(i) : sqx, end: i < chars.length ? prefix(i + 1) : sqx + sq, tin: 2.4 + i * step, tout: 6.3 + (n - 1 - i) * back }));
  const pad = 14;
  return {
    text, font, size, s, m, Y, ox, oy, left, right, chars, lt, sq, sqx,
    box: { x0: left - pad, y0: Y - m.inkAsc - pad, x1: right + pad, y1: Y + Math.max(m.inkDesc, m.maxDesc * 0.3) + pad },
    typedEnd: 2.4 + n * step,
    bg: {},
    paths: { stem: new Path2D("M25 42.5V17a7 7 0 0 1 7-7h7.5"), bar: new Path2D("M25 24h9.5"), arrow: new Path2D("M2 2l7.2 19 2.6-8.2L20 10.2z") },
  };
}

function background(S: Scene, k: number) {
  if (S.bg[k]) return S.bg[k];
  const c = document.createElement("canvas");
  c.width = Math.round(W * k);
  c.height = Math.round(H * k);
  const g = c.getContext("2d")!;
  g.fillStyle = BG;
  g.fillRect(0, 0, c.width, c.height);
  g.scale(k, k);
  for (let x = 0; x < W; x += 10) {
    g.fillStyle = `rgba(255,255,255,${x % 50 ? 0.018 : 0.063})`;
    g.fillRect(x, 0, 1, H);
  }
  for (let y = 0; y < H; y += 10) {
    g.fillStyle = `rgba(255,255,255,${y % 50 ? 0.018 : 0.063})`;
    g.fillRect(0, y, W, 1);
  }
  // winieta: elipsa 70% × 120%, środek 40% / 50%
  g.save();
  g.translate(600, 150);
  g.scale(1050 / 360, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 360);
  gr.addColorStop(0.4, "rgba(7,7,10,0)");
  gr.addColorStop(1, BG);
  g.fillStyle = gr;
  g.fillRect(-400, -400, 800, 800);
  g.restore();
  return (S.bg[k] = c);
}

/** Klatka w chwili t (0…8 s), w skali k (1 = 1500 × 300). */
export function renderBanner(S: Scene, ctx: Ctx, t: number, k: number) {
  const { lt, box, typedEnd } = S;
  const P = (u: number, v: number): [number, number] => [S.ox + u * S.s, S.oy + v * S.s];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(background(S, k), 0, 0);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.lineCap = "butt";

  // prowadnice
  const gOut = lerp(1, 0.25, seg(t, typedEnd + 0.3, typedEnd + 0.8)) * (1 - seg(t, 6.7, 7.3));
  const labOut = 1 - seg(t, typedEnd + 0.2, typedEnd + 0.6);
  const [gx] = P(22, 0);
  const guides = [
    { y: S.Y, t: 0.15, label: "baseline", dash: [] as number[] },
    { y: P(0, 19.5)[1], t: 0.28, label: "x-height", dash: [] },
    { y: P(0, 7.5)[1], t: 0.41, label: "ascender", dash: [4, 4] },
  ];
  ctx.strokeStyle = V;
  ctx.fillStyle = V;
  ctx.lineWidth = 1;
  ctx.font = `500 11px ${S.font}`;
  ctx.letterSpacing = "0px";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  for (const g of guides) {
    const p = oExpo(seg(t, g.t, g.t + 1.1));
    if (p <= 0) continue;
    const y = Math.round(g.y) + 0.5;
    ctx.globalAlpha = 0.8 * gOut;
    ctx.setLineDash(g.dash);
    ctx.beginPath();
    ctx.moveTo(lerp(gx, 0, p), y);
    ctx.lineTo(lerp(gx, W, p), y);
    ctx.stroke();
    ctx.globalAlpha = labOut * seg(t, g.t + 0.6, g.t + 1.0);
    if (ctx.globalAlpha > 0) ctx.fillText(g.label, 1468, y - 7);
  }
  ctx.setLineDash([]);
  ctx.textAlign = "left";

  // konstrukcja znaku: pion trzonu i okręgi
  const cOut = 1 - seg(t, 2.6, 3.1);
  const vp = oExpo(seg(t, 0.3, 1.3));
  if (vp > 0 && cOut > 0) {
    const x = Math.round(P(25, 0)[0]) + 0.5;
    ctx.globalAlpha = 0.7 * cOut;
    ctx.beginPath();
    ctx.moveTo(x, lerp(150, 0, vp));
    ctx.lineTo(x, lerp(150, H, vp));
    ctx.stroke();
    ([[16, 31, 9], [32, 17, 7]] as const).forEach(([u, v, r], i) => {
      const p = ioQuart(seg(t, 0.45 + i * 0.15, 1.35 + i * 0.15));
      if (p <= 0) return;
      const [cx, cy] = P(u, v);
      ctx.globalAlpha = 0.85 * cOut;
      ctx.beginPath();
      ctx.arc(cx, cy, r * S.s, 0, p * TAU);
      ctx.stroke();
    });
  }

  // kreski znaku
  ctx.save();
  ctx.translate(S.ox, S.oy);
  ctx.scale(S.s, S.s);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  const o = (a: number) => ioQuart(seg(t, a, a + 0.55));
  {
    const p = oQuart(seg(t, 1.0, 1.75)), out = o(6.95), a0 = -Math.PI / 3;
    if (out > 0) {
      if (out < 1) {
        ctx.beginPath();
        ctx.arc(16, 31, 9, a0 + out * TAU, a0 + TAU);
        ctx.stroke();
      }
    } else if (p > 0) {
      ctx.beginPath();
      ctx.arc(16, 31, 9, a0, a0 + p * TAU);
      ctx.stroke();
    }
  }
  ([[S.paths.stem, LEN.stem, 1.2, 2.0, 7.05], [S.paths.bar, LEN.bar, 1.6, 2.05, 7.1]] as const).forEach(([path, len, a, b, oa]) => {
    const p = oQuart(seg(t, a, b)), out = o(oa);
    if (out >= 1 || p <= 0) return;
    ctx.setLineDash(out > 0 ? [0, out * len, len * (1 - out) + 1, len * 3] : p >= 1 ? [] : [p * len, len * 3]);
    ctx.stroke(path);
  });
  ctx.setLineDash([]);
  const ds = oBack(seg(t, 1.95, 2.45)) * (1 - iCubic(seg(t, 6.85, 7.15)));
  if (ds > 0) {
    ctx.fillStyle = V;
    const z = 5 * ds;
    ctx.fillRect(37 - z / 2, 40 - z / 2, z, z);
  }
  ctx.restore();

  // punkty węzłowe
  ANCH.forEach(([u, v], i) => {
    const a = oBack(seg(t, 0.55 + i * 0.06, 0.95 + i * 0.06)) * (1 - seg(t, 2.55 + i * 0.02, 2.85 + i * 0.02));
    if (a <= 0.01) return;
    const [x, y] = P(u, v), z = 7 * a;
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.strokeStyle = V;
    ctx.lineWidth = 1.2 * a;
    ctx.fillRect(x - z / 2, y - z / 2, z, z);
    ctx.strokeRect(x - z / 2, y - z / 2, z, z);
  });

  // napis: wpisywany i kasowany
  setFont(ctx, S.font, S.size);
  let caretX = S.left;
  lt.forEach((l, i) => {
    const a = seg(t, l.tin, l.tin + 0.03) * (1 - seg(t, l.tout, l.tout + 0.03));
    if (t >= l.tin + 0.03 && t < l.tout) caretX = S.left + l.end;
    if (a <= 0) return;
    const dy = (1 - oQuart(seg(t, l.tin, l.tin + 0.3))) * 0.06 * S.size;
    ctx.globalAlpha = a;
    if (i < S.chars.length) {
      ctx.fillStyle = INK;
      ctx.fillText(S.chars[i], S.left + l.x, S.Y + dy);
    } else {
      ctx.fillStyle = V;
      ctx.fillRect(S.left + S.sqx, S.Y - S.sq + dy, S.sq, S.sq);
    }
  });
  ctx.letterSpacing = "0px";

  // zaznaczenie przeciągane kursorem
  const gp = oExpo(seg(t, 1.6, 2.35));
  const x1 = lerp(box.x0, box.x1, gp), y1 = lerp(box.y0, box.y1, gp);
  const offT = typedEnd + 0.35;
  const selOn = t >= 1.6 && t < offT + 0.25 ? 1 - seg(t, offT, offT + 0.25) : 0;
  if (selOn > 0) {
    ctx.globalAlpha = selOn;
    ctx.strokeStyle = V;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(box.x0, box.y0, x1 - box.x0, y1 - box.y0);
    const hOn = seg(t, 2.2, 2.3) * selOn;
    if (hOn > 0) {
      ctx.globalAlpha = hOn;
      ctx.fillStyle = BG;
      ([[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]] as const).forEach(([x, y]) => {
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.strokeRect(x - 4, y - 4, 8, 8);
      });
    }
    const ca = selOn * seg(t, 1.65, 1.8);
    if (ca > 0) {
      const label = `${Math.round(x1 - box.x0)} × ${Math.round(y1 - box.y0)}`;
      ctx.font = `500 11.5px ${S.font}`;
      const cw = ctx.measureText(label).width + 14, ch = 20;
      const cx = (box.x0 + x1) / 2 - cw / 2, cy = Math.min(272, y1 + 10);
      ctx.globalAlpha = ca;
      ctx.fillStyle = V;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx + 7, cy + ch / 2 + 0.5);
      ctx.textBaseline = "alphabetic";
    }
  }
  // kursor tekstowy (miga po wpisaniu)
  const typing = (t >= 2.3 && t < offT) || (t >= 6.15 && t < 6.95);
  if (typing && !(t > typedEnd && t < 6.3 && Math.floor(t * 2.6) % 2)) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = V;
    ctx.fillRect(caretX + 2, S.Y - S.m.inkAsc * 0.92, 2, S.m.inkAsc * 0.92 + S.size * 0.18);
  }

  // kursor „afto”
  let cx: number, cy: number;
  if (t < 1.55) {
    const p = ioQuart(seg(t, 0.85, 1.55));
    cx = lerp(1540, box.x0, p);
    cy = lerp(330, box.y0, p);
  } else if (t < 2.35) {
    cx = x1;
    cy = y1;
  } else {
    const p = ioQuart(seg(t, 3.15, 4.0));
    cx = lerp(box.x1, 1560, p);
    cy = lerp(box.y1, 120, p);
  }
  if (cx < W + 10) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.translate(cx, cy);
    const pr = t > 1.5 && t < 2.35 ? 0.88 : 1;
    ctx.scale(pr, pr);
    ctx.save();
    ctx.translate(-2, -2);
    ctx.fillStyle = V;
    ctx.fill(S.paths.arrow);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = "round";
    ctx.stroke(S.paths.arrow);
    ctx.restore();
    ctx.font = `500 12px ${S.font}`;
    const tw = ctx.measureText("afto").width;
    ctx.fillStyle = V;
    ctx.beginPath();
    ctx.roundRect(16, 20, tw + 16, 21, [10.5, 10.5, 10.5, 4]);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText("afto", 24, 31);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* ---------- GIF: stała paleta z kolorów banera, w klatkach tylko zmienione piksele ---------- */

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function palette() {
  const bg = hex(BG), ink = hex(INK), v = hex(V), wh = [255, 255, 255];
  const out: number[][] = [];
  const ramp = (a: number[], b: number[], n: number) => {
    for (let i = 0; i < n; i++) out.push(a.map((c, j) => Math.round(c + ((b[j] - c) * i) / (n - 1))));
  };
  ramp(bg, ink, 110);
  ramp(bg, v, 72);
  ramp(v, ink, 40);
  ramp(v, wh, 12);
  ramp(ink, wh, 6);
  return out.slice(0, 255);
}

function quantizer(pal: number[][]) {
  const cache = new Int16Array(32768).fill(-1);
  return (data: Uint8ClampedArray, n: number) => {
    const out = new Uint8Array(n);
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const key = ((data[p] >> 3) << 10) | ((data[p + 1] >> 3) << 5) | (data[p + 2] >> 3);
      let c = cache[key];
      if (c < 0) {
        const r = (data[p] & ~7) + 4, g = (data[p + 1] & ~7) + 4, b = (data[p + 2] & ~7) + 4;
        let best = Infinity;
        for (let j = 0; j < pal.length; j++) {
          const q = pal[j], d = 2 * (q[0] - r) ** 2 + 4 * (q[1] - g) ** 2 + 3 * (q[2] - b) ** 2;
          if (d < best) {
            best = d;
            c = j;
          }
        }
        cache[key] = c;
      }
      out[i] = c;
    }
    return out;
  };
}

class Buf {
  a = new Uint8Array(1 << 20);
  n = 0;
  byte(v: number) {
    if (this.n >= this.a.length) {
      const b = new Uint8Array(this.a.length * 2);
      b.set(this.a);
      this.a = b;
    }
    this.a[this.n++] = v;
  }
  u16(v: number) {
    this.byte(v & 255);
    this.byte((v >> 8) & 255);
  }
  str(s: string) {
    for (const ch of s) this.byte(ch.charCodeAt(0));
  }
}

let TABLE: Int32Array | null = null;
// LZW jak w klasycznych koderach GIF (kody 9–12 bitów, czyszczenie słownika przy 4096)
function lzw(buf: Buf, ind: Uint8Array) {
  const table = (TABLE ??= new Int32Array(1 << 20));
  const clearCode = 256, eof = 257, MAXMAX = 4096;
  buf.byte(8);
  let nBits = 9, maxcode = 511, free = 258, clearFlg = false, cur = 0, curBits = 0;
  const block = new Uint8Array(255);
  let bl = 0;
  const put = (v: number) => {
    block[bl++] = v;
    if (bl === 255) {
      buf.byte(255);
      for (let i = 0; i < 255; i++) buf.byte(block[i]);
      bl = 0;
    }
  };
  const output = (code: number) => {
    cur |= code << curBits;
    curBits += nBits;
    while (curBits >= 8) {
      put(cur & 255);
      cur >>>= 8;
      curBits -= 8;
    }
    if (free > maxcode || clearFlg) {
      if (clearFlg) {
        nBits = 9;
        maxcode = 511;
        clearFlg = false;
      } else {
        nBits++;
        maxcode = nBits === 12 ? MAXMAX : (1 << nBits) - 1;
      }
    }
    if (code === eof) {
      while (curBits > 0) {
        put(cur & 255);
        cur >>>= 8;
        curBits -= 8;
      }
      curBits = 0;
    }
  };
  table.fill(-1);
  output(clearCode);
  let ent = ind[0];
  for (let i = 1; i < ind.length; i++) {
    const c = ind[i], key = (c << 12) | ent, v = table[key];
    if (v >= 0) {
      ent = v;
      continue;
    }
    output(ent);
    ent = c;
    if (free < MAXMAX) table[key] = free++;
    else {
      table.fill(-1);
      free = 258;
      clearFlg = true;
      output(clearCode);
    }
  }
  output(ent);
  output(eof);
  if (bl) {
    buf.byte(bl);
    for (let i = 0; i < bl; i++) buf.byte(block[i]);
  }
  buf.byte(0);
}

const tick = () => new Promise((r) => setTimeout(r));

/** GIF w pętli, 25 kl./s, skala k (1 = 1500 × 300, 0,5 = 750 × 150). */
export async function bannerGif(S: Scene, k: number, onProgress: (p: number) => void) {
  const w = Math.round(W * k), h = Math.round(H * k), fps = 25, N = D * fps, TR = 255;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const pal = palette(), q = quantizer(pal);
  const frames: { x: number; y: number; w: number; h: number; ind: Uint8Array; delay: number; first?: boolean }[] = [];
  let prev: Uint8Array | null = null;
  for (let f = 0; f < N; f++) {
    renderBanner(S, ctx, f / fps, k);
    const ind = q(ctx.getImageData(0, 0, w, h).data, w * h);
    if (!prev) frames.push({ x: 0, y: 0, w, h, ind, delay: 4, first: true });
    else {
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) {
        const r = y * w;
        for (let x = 0; x < w; x++)
          if (ind[r + x] !== prev[r + x]) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      }
      if (x1 < 0) frames[frames.length - 1].delay += 4;
      else {
        const fw = x1 - x0 + 1, fh = y1 - y0 + 1, sub = new Uint8Array(fw * fh);
        for (let y = 0; y < fh; y++)
          for (let x = 0; x < fw; x++) {
            const i = (y + y0) * w + x + x0;
            sub[y * fw + x] = ind[i] === prev[i] ? TR : ind[i];
          }
        frames.push({ x: x0, y: y0, w: fw, h: fh, ind: sub, delay: 4 });
      }
    }
    prev = ind;
    if (f % 4 === 0) {
      onProgress(f / N);
      await tick();
    }
  }
  const buf = new Buf();
  buf.str("GIF89a");
  buf.u16(w);
  buf.u16(h);
  [0xf7, 0, 0].forEach((b) => buf.byte(b));
  for (let i = 0; i < 256; i++) (pal[i] ?? [0, 0, 0]).forEach((b) => buf.byte(b));
  [0x21, 0xff, 0x0b].forEach((b) => buf.byte(b));
  buf.str("NETSCAPE2.0");
  [3, 1, 0, 0, 0].forEach((b) => buf.byte(b));
  for (const fr of frames) {
    // rozszerzenie sterujące: bez czyszczenia (klatki dokładają tylko zmiany), przezroczysty indeks 255
    [0x21, 0xf9, 4, fr.first ? 0x04 : 0x05].forEach((b) => buf.byte(b));
    buf.u16(fr.delay);
    buf.byte(TR);
    buf.byte(0);
    buf.byte(0x2c);
    buf.u16(fr.x);
    buf.u16(fr.y);
    buf.u16(fr.w);
    buf.u16(fr.h);
    buf.byte(0);
    lzw(buf, fr.ind);
  }
  buf.byte(0x3b);
  onProgress(1);
  return new Blob([buf.a.slice(0, buf.n)], { type: "image/gif" });
}

/** Wideo nagrywane w czasie rzeczywistym (8 s); MP4, gdy przeglądarka umie, inaczej WebM. */
export async function bannerVideo(S: Scene, onProgress: (p: number) => void) {
  const mime = ["video/mp4;codecs=avc1.640028", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("Ta przeglądarka nie nagrywa wideo z canvasu. Spróbuj w Chrome.");
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const stream = c.captureStream(0);
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12e6 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  renderBanner(S, ctx, 0, 1);
  rec.start();
  const fps = 30, N = D * fps, t0 = performance.now();
  for (let f = 0; f <= N; f++) {
    const wait = t0 + (f * 1000) / fps - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    renderBanner(S, ctx, Math.min(f / fps, D - 0.001), 1);
    track.requestFrame?.();
    if (f % 10 === 0) onProgress(f / N);
  }
  rec.stop();
  await done;
  stream.getTracks().forEach((t) => t.stop());
  return { blob: new Blob(chunks, { type: mime.split(";")[0] }), ext: mime.includes("mp4") ? "mp4" : "webm" };
}

/** Nieruchoma klatka (gotowy baner) w 1500 × 300. */
export function bannerPng(S: Scene) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  renderBanner(S, c.getContext("2d")!, 5, 1);
  return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("PNG"))), "image/png"));
}

export const bannerSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "baner";
