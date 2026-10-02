// Baner z hasłem marketingowym — 1500×500 i 1500×300. Szklany kafel ze znakiem w 3D, hasło litera po literze,
// odblask na szkle, połysk na drugiej linii, pyłki i perspektywiczna podłoga.
import { C, MARK, geoSvg, page } from "./lib.mjs";
import { KINO_CSS, GRAIN, ambient, chars, ghostMark } from "./kino.mjs";

const D = 8;

function haslo({ w, h }) {
  const tall = h >= 450;
  const L = tall
    ? { tile: 270, tx: 116, ty: 106, fs: 72, x: 460, y1: 136, chipsY: 336, mark: 156, floor: 0.72 }
    : { tile: 188, tx: 70, ty: 56, fs: 60, x: 318, y1: 82, chipsY: null, mark: 108, floor: 0.8 };
  const amb = ambient({
    w,
    h,
    D,
    seed: tall ? 11 : 12,
    particles: tall ? 44 : 30,
    floorTop: L.floor,
    aurora: [
      { x: L.tx + L.tile / 2, y: L.ty + L.tile / 2, r: L.tile * 1.15, color: "rgba(139,108,255,.9)", a: 0.42, dx: 26, dy: 14 },
      { x: w * 0.8, y: h * 0.15, r: h * 0.9, color: "rgba(91,63,214,.85)", a: 0.18, dx: 50, dy: 20, f: 1 },
      { x: w * 0.5, y: h * 1.05, r: h * 0.7, color: "rgba(180,162,255,.6)", a: 0.12, dx: 60, dy: 10 },
    ],
  });
  const style = `${KINO_CSS}
#tw{position:absolute;left:${L.tx}px;top:${L.ty}px;width:${L.tile}px;height:${L.tile}px;perspective:900px}
#tile{position:absolute;inset:0;border-radius:${L.tile * 0.24}px;transform-style:preserve-3d}
#tile .m{position:absolute;left:50%;top:50%;width:${L.mark}px;height:${L.mark}px;margin:${-L.mark / 2}px 0 0 ${-L.mark / 2}px;overflow:visible}
#tile .dot{filter:drop-shadow(0 0 ${tall ? 10 : 7}px rgba(139,108,255,.95))}
#rim{position:absolute;inset:0;border-radius:inherit;pointer-events:none;padding:1.5px;background:conic-gradient(from var(--a,0deg),rgba(255,255,255,.0),rgba(214,204,255,.75) 12%,rgba(255,255,255,0) 24%,rgba(255,255,255,0) 60%,rgba(139,108,255,.6) 72%,rgba(255,255,255,0) 84%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
#refl{position:absolute;left:${L.tx + L.tile * 0.1}px;top:${L.ty + L.tile + (tall ? 26 : 14)}px;width:${L.tile * 0.8}px;height:${tall ? 40 : 22}px;border-radius:50%;background:radial-gradient(closest-side,rgba(139,108,255,.55),transparent);filter:blur(8px)}
#rip{position:absolute;border:2px solid ${C.accent2};border-radius:${L.tile * 0.24}px;pointer-events:none}
#txt{position:absolute;left:${L.x}px;top:${L.y1}px;font-size:${L.fs}px;font-weight:500;letter-spacing:-.045em;line-height:1.08;white-space:nowrap}
#l2{color:${C.accent2}}
#chips{position:absolute;left:${L.x}px;top:${L.chipsY}px;display:flex;align-items:center;gap:22px}
#chips .t{font-size:22px;color:${C.muted};letter-spacing:-.005em}
#chips .t i{display:inline-block;width:5px;height:5px;margin:0 12px;background:${C.accent};vertical-align:middle;transform:translateY(-2px)}
#url{position:absolute;right:64px;top:50%;transform:translateY(-50%)}
#gw{position:absolute;left:${tall ? w - 360 : w - 470}px;top:${tall ? -60 : -150}px;width:${tall ? 600 : 600}px;height:${tall ? 600 : 600}px;perspective:1200px}
#ghost{width:100%;height:100%;filter:blur(.4px)}
`;
  const body = `${amb.html}
<div id="c" class="abs" style="inset:0">
  <div id="gw">${ghostMark(MARK)}</div>
  <div class="beam" id="beam"></div>
  <div id="refl"></div>
  <div id="tw"><div id="tile" class="glass">${geoSvg(MARK, { cls: "m" })}<div id="rim"></div></div></div>
  <span id="rip" style="left:${L.tx}px;top:${L.ty}px;width:${L.tile}px;height:${L.tile}px;opacity:0"></span>
  <div id="txt"><div id="l1">${chars("Strony, które wyglądają drogo.")}</div><div id="l2">${chars("I sprzedają.")}</div></div>
  ${tall ? `<div id="chips"><span class="chip" id="chip"><span class="dotc"></span>afto.works</span><span class="t" id="srv">Strony<i></i>Sklepy<i></i>Identyfikacja wizualna</span></div>` : `<div id="url"><span class="chip" id="chip"><span class="dotc"></span>afto.works</span></div>`}
</div>
${GRAIN}`;
  const script = `${amb.js}
const strokes = $$("#tile [data-s]"), dot = $("#tile .dot"), l1 = $$("#l1 .ch"), l2 = $$("#l2 .ch");
const X0 = $("#txt").getBoundingClientRect().left, l2x = l2.map((el) => { const r = el.getBoundingClientRect(); return r.left - X0 + r.width / 2; });
const L2W = Math.max(...l2x) + 60;
const OUT = ${D - 0.85};
window.__render = (t) => {
  amb(t);
  const ph = (t / ${D}) * Math.PI * 2;
  const out = P(t, OUT, 0.75, E.inOutCubic);
  // kafel: wyłania się z głębi, potem delikatnie kołysze w 3D
  const inn = P(t, 0.15, 1.4, E.outExpo);
  const rx = Math.sin(ph) * 5 + (1 - inn) * 18, ry = Math.cos(ph) * 9 - (1 - inn) * 26;
  css($("#tile"), { transform: "translateZ(" + ((inn - 1) * 220 - out * 120) + "px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)", opacity: inn * (1 - out), filter: "blur(" + ((1 - inn) * 10 + out * 8).toFixed(2) + "px)" });
  $("#rim").style.setProperty("--a", (t / ${D}) * 360 + "deg");
  css($("#refl"), { opacity: inn * (1 - out) * (0.75 + 0.25 * Math.sin(ph)), transform: "scaleX(" + (0.9 + 0.1 * Math.cos(ph)) + ")" });
  strokes.forEach((s) => draw(s, P(t, 0.45 + +s.dataset.s * 0.2, 0.95, E.inOutQuart)));
  const dp = t < 1.35 ? 0 : E.outBack(clamp((t - 1.35) / 0.55), 2.2);
  dot.setAttribute("transform", "scale(" + Math.max(0, dp) + ")");
  glint($("#tile"), t, 2.4, 1.3);
  const rp = P(t, 1.45, 1.3, E.outCubic);
  css($("#rip"), { opacity: t < 1.45 ? 0 : 0.6 * (1 - rp), transform: "scale(" + (1 + rp * 0.18) + ")" });
  // hasło: litery z rozmycia, z lekkim uniesieniem
  const letter = (el, a) => { const p = P(t, a, 0.9, E.outExpo); css(el, { opacity: clamp((t - a) / 0.35) * (1 - out), transform: "translateY(" + ((1 - p) * 0.42 - out * 0.15).toFixed(3) + "em)", filter: "blur(" + ((1 - p) * 10 + out * 6).toFixed(2) + "px)" }); };
  l1.forEach((el, i) => letter(el, 0.6 + i * 0.022));
  l2.forEach((el, i) => letter(el, 1.3 + i * 0.03));
  // połysk: jasna fala przechodzi przez drugą linię (kolor + bloom per litera)
  const sx = mix(-160, L2W + 160, P(t, 3.3, 1.6, E.inOutSine));
  l2.forEach((el, i) => { const k = t > 3.3 && t < 5 ? Math.exp(-Math.pow((l2x[i] - sx) / 80, 2)) : 0; el.style.color = "rgb(" + Math.round(mix(180, 255, k)) + "," + Math.round(mix(162, 255, k)) + ",255)"; el.style.textShadow = k > 0.01 ? "0 0 " + (26 * k).toFixed(1) + "px rgba(180,162,255," + (0.85 * k).toFixed(2) + ")" : "none"; });
  const cp = P(t, 1.9, 1.0, E.outExpo);
  css($("#chip"), { opacity: cp * (1 - out), transform: "translateY(" + (1 - cp) * 14 + "px)" });
  if ($("#srv")) css($("#srv"), { opacity: P(t, 2.1, 1.0, E.outExpo) * (1 - out) });
  $("#chip .dotc").style.opacity = 0.55 + 0.45 * Math.cos(ph * 3);
  // warstwa tła: konstrukcja znaku rysuje się powoli, obraca w głębi (paralaksa)
  $$("#ghost [data-s]").forEach((el, i) => { if (el.getAttribute("pathLength")) draw(el, P(t, 0.3 + i * 0.12, 2.2, E.inOutCubic)); });
  css($("#ghost"), { opacity: ${tall ? 0.55 : 0.4} * P(t, 0.2, 1.5, E.lin) * (1 - out), transform: "rotateY(" + (-18 + Math.sin(ph) * 8).toFixed(2) + "deg) rotateX(" + (Math.cos(ph) * 4).toFixed(2) + "deg)" });
  $("#beam").style.transform = "translateX(" + mix(-${w * 0.7}, ${w * 1.1}, P(t, 2.0, 2.2, E.inOutSine)) + "px)";
};`;
  return {
    id: `haslo-01-${w}x${h}`,
    title: `Baner z hasłem — ${w} × ${h}`,
    description: "Szklany kafel ze znakiem wyłania się z głębi i kołysze w 3D, hasło „Strony, które wyglądają drogo. I sprzedają.” pojawia się litera po literze z rozmycia; odblask na szkle i połysk na drugiej linii.",
    group: "Baner z hasłem",
    w,
    h,
    duration: D,
    gifFps: 20,
    gifLossy: 14,
    still: 5,
    poster: true,
    keys: [0.4, 0.9, 1.4, 2.0, 2.9, 3.9, 5.5, 7.6],
    html: page({ w, h, style, body, script }),
  };
}

export const slogans = () => [haslo({ w: 1500, h: 500 }), haslo({ w: 1500, h: 300 })];
