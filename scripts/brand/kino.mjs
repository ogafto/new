// „Kino” — wspólne warstwy dla animacji premium: głębia (perspektywiczna podłoga, zorza),
// szkło (backdrop-filter + odblask), pyłki w kilku planach, ziarno, bloom.
// Wszystko okresowe względem długości pętli D → idealne zapętlenie.
import { C } from "./lib.mjs";

// deterministyczny generator (te same pyłki przy każdym renderze)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const KINO_CSS = `
.amb{position:absolute;inset:0;overflow:hidden}
.aur{position:absolute;border-radius:50%;pointer-events:none;will-change:transform}
.floor{position:absolute;left:-50%;right:-50%;bottom:0;perspective:520px;perspective-origin:50% 0;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,transparent 0,rgba(0,0,0,.5) 35%,#000 80%)}
.floor i{position:absolute;left:0;right:0;top:0;height:200%;transform-origin:50% 0;transform:rotateX(74deg);
  background-image:linear-gradient(to right,rgba(180,162,255,.22) 1px,transparent 1px),linear-gradient(to bottom,rgba(180,162,255,.22) 1px,transparent 1px);background-size:80px 80px}
.pt{position:absolute;left:0;top:0;border-radius:50%;background:#e9e4ff;pointer-events:none;will-change:transform}
.beam{position:absolute;top:-20%;bottom:-20%;left:0;width:60%;pointer-events:none;mix-blend-mode:screen;background:linear-gradient(100deg,transparent 30%,rgba(180,162,255,.09) 46%,rgba(255,255,255,.13) 50%,rgba(180,162,255,.09) 54%,transparent 70%);will-change:transform}
.ghost{position:absolute;overflow:visible;pointer-events:none}
.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 80% at 50% 45%,transparent 45%,rgba(4,4,6,.85) 100%)}
.grain{position:absolute;inset:-20%;pointer-events:none;opacity:.07;mix-blend-mode:overlay;background-image:${NOISE};background-size:240px 240px}
.gif .grain{display:none}
.glass{position:absolute;overflow:hidden;border-radius:28px;
  background:linear-gradient(160deg,rgba(255,255,255,.10),rgba(255,255,255,.025) 42%,rgba(255,255,255,.045));
  backdrop-filter:blur(28px) saturate(160%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22),inset 0 0 0 1px rgba(255,255,255,.09),0 50px 120px -40px rgba(0,0,0,.95),0 30px 90px -50px rgba(139,108,255,.45)}
.glass::after{content:"";position:absolute;inset:-1px;pointer-events:none;mix-blend-mode:screen;
  background:linear-gradient(105deg,transparent calc(var(--s,-40%) - 14%),rgba(255,255,255,.16) var(--s,-40%),transparent calc(var(--s,-40%) + 14%))}
.shine{background:linear-gradient(100deg,var(--c1,${C.ink}) calc(var(--sh,-50%) - 12%),#ffffff var(--sh,-50%),var(--c1,${C.ink}) calc(var(--sh,-50%) + 12%)) 0 0/100% 100%;-webkit-background-clip:text;background-clip:text;color:transparent}
.word{display:inline-block;white-space:nowrap}
.ch{display:inline-block;will-change:transform,filter,opacity}
.mask{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .14em;margin:0 -.04em -.14em}
.mask>span{display:inline-block}
.chip{display:inline-flex;align-items:center;gap:12px;border-radius:999px;padding:0 22px;height:52px;font-size:21px;color:${C.ink};
  background:rgba(255,255,255,.05);backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.08)}
.dotc{width:9px;height:9px;border-radius:50%;background:${C.accent};box-shadow:0 0 16px ${C.accent}}
`;

/** Tekst w literach (słowa nie łamią się w środku). */
export const chars = (text, cls = "ch") =>
  text
    .split(" ")
    .map((w) => `<span class="word">${[...w].map((c) => `<span class="${cls}">${c}</span>`).join("")}</span>`)
    .join(" ");

/** Tekst w słowach z maską (wjazd od dołu). */
export const maskWords = (text, tail = "") =>
  text
    .split(" ")
    .map((w, i, a) => `<span class="mask"><span class="mw">${w}${i === a.length - 1 ? tail : ""}</span></span>`)
    .join(" ");

export const DOT = `<span style="color:${C.accent}">.</span>`;

/**
 * Tło z głębią. Zwraca znaczniki (wstaw jako pierwsze w #stage) i kod JS z funkcją `amb(t)`.
 * aurora: [{x, y, r, color, a, dx, dy}] — plamy światła krążące po krzywej Lissajous (okres D).
 */
export function ambient({ w, h, D, seed = 7, particles = 46, floor = true, floorTop = 0.62, aurora = [] }) {
  const R = rng(seed);
  const pts = Array.from({ length: particles }, () => {
    const z = R(); // 0 = daleko, 1 = blisko
    return {
      x: R() * w,
      y: R() * h,
      s: 0.8 + z * 2.6,
      a: 0.12 + z * 0.4,
      k: z > 0.66 ? 2 : 1, // ile razy przelatuje przez kadr w pętli
      sw: 6 + R() * 18,
      ph: R() * Math.PI * 2,
      blur: z > 0.8 ? 1.2 : 0,
    };
  });
  const html = `<div class="amb">
${aurora.map((b, i) => `<div class="aur" id="au${i}" style="left:${b.x - b.r}px;top:${b.y - b.r}px;width:${b.r * 2}px;height:${b.r * 2}px;background:radial-gradient(closest-side,${b.color},transparent);opacity:${b.a}"></div>`).join("")}
${floor ? `<div class="floor" style="top:${Math.round(h * floorTop)}px"><i id="fl"></i></div>` : ""}
${pts.map((p, i) => `<span class="pt" id="pt${i}" style="width:${p.s}px;height:${p.s}px;opacity:${p.a};${p.blur ? `filter:blur(${p.blur}px)` : ""}"></span>`).join("")}
</div>`;
  const js = `
const AMB = { D: ${D}, W: ${w}, H: ${h}, pts: ${JSON.stringify(pts.map((p) => [Math.round(p.x), Math.round(p.y), p.k, Math.round(p.sw), +p.ph.toFixed(3)]))}, aur: ${JSON.stringify(aurora.map((b) => [b.dx ?? 40, b.dy ?? 24, b.f ?? 1]))} };
const AMB_EL = { pts: AMB.pts.map((_, i) => document.getElementById("pt" + i)), aur: AMB.aur.map((_, i) => document.getElementById("au" + i)), fl: document.getElementById("fl") };
function amb(t) {
  const gif = document.documentElement.classList.contains("gif");
  const ph = (t / AMB.D) * Math.PI * 2;
  AMB.pts.forEach(([x, y, k, sw, p], i) => {
    const H2 = AMB.H + 40;
    const yy = (((y - (k * H2 * t) / AMB.D) % H2) + H2) % H2 - 20;
    const xx = x + Math.sin(ph * k + p) * sw;
    AMB_EL.pts[i].style.transform = "translate(" + xx.toFixed(1) + "px," + yy.toFixed(1) + "px)";
  });
  // w GIF-ie zorza stoi (mniej zmienionych pikseli → mniejszy plik)
  AMB.aur.forEach(([dx, dy, f], i) => { const m = gif ? 0 : 1; AMB_EL.aur[i].style.transform = "translate(" + (Math.sin(ph * f) * dx * m).toFixed(1) + "px," + (Math.sin(ph * f * 2 + 1) * dy * m).toFixed(1) + "px)"; });
  if (AMB_EL.fl) AMB_EL.fl.style.backgroundPosition = "0 " + (gif ? 0 : (t / AMB.D) * 160).toFixed(2) + "px";
}
// odblask szkła: --s od -40% do 140%
function glint(el, t, a, d) { el.style.setProperty("--s", (-40 + 180 * P(t, a, d, E.inOutSine)).toFixed(1) + "%"); }
function shine(el, t, a, d) { el.style.setProperty("--sh", (-30 + 160 * P(t, a, d, E.inOutSine)).toFixed(1) + "%"); }
`;
  return { html, js };
}

/** Duży znak z cienkich linii konstrukcyjnych (warstwa tła). Elementy z data-s do rysowania. */
export function ghostMark(MARK, { id = "ghost", color = "rgba(180,162,255,.5)", sw = 0.16 } = {}) {
  const c = MARK.circles[0];
  const lines = [
    ...MARK.circles.map((k) => `<circle data-s cx="${k.cx}" cy="${k.cy}" r="${k.r + 2.5}" pathLength="1"/><circle data-s cx="${k.cx}" cy="${k.cy}" r="${k.r - 2.5}" pathLength="1"/>`),
    `<path data-s d="M22.5 42.5V17a9.5 9.5 0 0 1 9.5-9.5h7.5" pathLength="1"/><path data-s d="M27.5 42.5V17a4.5 4.5 0 0 1 4.5-4.5h7.5" pathLength="1"/>`,
    `<path data-s d="M27.5 21.5h7M27.5 26.5h7M39.5 7.5v5M34.5 21.5v5M22.5 42.5h5" pathLength="1"/>`,
    `<path data-s d="M-30 42.5H80M-30 7.5H80M-30 ${c.cy}H80" stroke-dasharray=".6 .9" opacity=".5"/>`,
  ].join("");
  return `<svg id="${id}" class="ghost" viewBox="${MARK.viewBox}" fill="none" stroke="${color}" stroke-width="${sw}">${lines}<rect data-d x="${MARK.dot.x}" y="${MARK.dot.y}" width="${MARK.dot.size}" height="${MARK.dot.size}" stroke="rgba(139,108,255,.9)"/></svg>`;
}

export const GRAIN = `<div class="vig"></div><div class="grain"></div>`;
