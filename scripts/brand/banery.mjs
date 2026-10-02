// Banery 1500×300 do osadzeń bota na Discordzie (PNG + animowane GIF/MP4).
// Tekst ≥ 56 px w głównych liniach — czytelny także po zmniejszeniu do ~400 px szerokości.
import { C, MARK, WORDMARK, geoSvg, page } from "./lib.mjs";

const W = 1500;
const H = 300;

const BG = `
.grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px);background-size:60px 60px;background-position:30px 30px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent)}
.glow{position:absolute;width:900px;height:520px;background:radial-gradient(closest-side,rgba(139,108,255,.14),rgba(139,108,255,0));pointer-events:none}
#c{position:absolute;inset:0}
.line{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em}
.line>span{display:inline-block}
`;
const DOT = `<span style="color:${C.accent}">.</span>`;
const words = (text, tail = "", cls = "w") =>
  text
    .split(" ")
    .map((w, i, a) => `<span class="line"><span class="${cls}">${w}${i === a.length - 1 ? tail : ""}</span></span>`)
    .join(" ");
const fadeOut = (a, d = 0.7) => `const out = P(t, ${a}, ${d}, E.inOutCubic); $("#c").style.opacity = 1 - out;`;

/* 01 · znak + hasło */
function haslo() {
  const style = `
#mark{position:absolute;left:96px;top:58px;width:184px;height:184px}
#div{position:absolute;left:352px;top:70px;width:1px;height:160px;background:rgba(255,255,255,.16);transform-origin:top}
#txt{position:absolute;left:404px;top:76px;font-size:64px;font-weight:500;letter-spacing:-.04em;line-height:1.08}
#txt .l2{color:${C.accent2}}
#url{position:absolute;right:64px;bottom:52px;font-size:28px;color:${C.muted};letter-spacing:-.01em}
`;
  const body = `<div class="grid"></div><div class="glow" style="left:-200px;top:-110px"></div>
<div id="c">${geoSvg(MARK, { id: "mark" })}<div id="div"></div>
<div id="txt"><div>${words("Strony, które wyglądają drogo.")}</div><div class="l2">${words("I sprzedają.")}</div></div>
<div id="url">afto.works</div></div>`;
  const script = `
const strokes = $$("#mark [data-s]"), dot = $("#mark .dot"), ws = $$(".w");
window.__render = (t) => {
  strokes.forEach((s) => draw(s, P(t, 0.15 + +s.dataset.s * 0.22, 0.95, E.inOutQuart)));
  const d = t < 1.05 ? 0 : E.outBack(clamp((t - 1.05) / 0.5), 2.4);
  dot.setAttribute("transform", "scale(" + Math.max(0, d) + ")");
  $("#div").style.transform = "scaleY(" + P(t, 0.5, 1.0, E.outExpo) + ")";
  ws.forEach((w, i) => { const p = P(t, 0.75 + i * 0.07, 1.0, E.outExpo); w.style.transform = "translateY(" + (1 - p) * 110 + "%)"; });
  const u = P(t, 1.6, 1.0); css($("#url"), { opacity: u, transform: "translateX(" + (1 - u) * -10 + "px)" });
  ${fadeOut(6.3)}
};`;
  return {
    id: "baner-01-haslo",
    name: "Znak + hasło",
    desc: "Monogram, pionowa linia i hasło „Strony, które wyglądają drogo. I sprzedają.” — klasyczny układ logo z lewej.",
    w: W,
    h: H,
    duration: 7,
    still: 4,
    animated: true,
    keys: [0.4, 0.9, 1.4, 2.2, 6.6],
    html: page({ w: W, h: H, style: BG + style, body, script }),
  };
}

/* 02 · logotyp na siatce konstrukcyjnej + przejście światła */
function siatka() {
  const u = 160 / 44;
  const ww = 106 * u;
  const x0 = (W - ww) / 2;
  const y0 = 150 - (26.25 - 3) * u; // środek między wydłużeniem (7.5) a linią bazową (42.5)
  const Y = (v) => y0 + (v - 3) * u;
  const guides = [
    [Y(42.5), "linia bazowa"],
    [Y(19.5), "wysokość x"],
    [Y(7.5), "wydłużenie"],
  ];
  const style = `
.lit{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(180,162,255,.5) 1px,transparent 1px),linear-gradient(to bottom,rgba(180,162,255,.5) 1px,transparent 1px);background-size:60px 60px;background-position:30px 30px}
#beam{position:absolute;top:0;bottom:0;left:0;width:2px;background:linear-gradient(to bottom,transparent,rgba(214,204,255,.9) 25%,rgba(214,204,255,.9) 75%,transparent)}
#bg2{position:absolute;top:-40%;bottom:-40%;left:0;width:300px;margin-left:-150px;background:radial-gradient(closest-side,rgba(139,108,255,.3),rgba(139,108,255,0))}
#wm{position:absolute;left:${x0}px;top:${y0}px;width:${ww}px;height:${44 * u}px}
.gl{position:absolute;left:0;right:0;height:1px;background:repeating-linear-gradient(90deg,rgba(139,108,255,.55) 0 6px,transparent 6px 12px)}
.gt{position:absolute;font-size:17px;color:${C.dim};letter-spacing:.04em;transform:translateY(-130%)}
.side{position:absolute;top:50%;font-size:22px;color:${C.muted};transform:translateY(-50%)}
#rip{position:absolute;border:2px solid ${C.accent};border-radius:50%}
`;
  const dotX = x0 + (WORDMARK.dot.x + 2.5) * u;
  const dotY = Y(WORDMARK.dot.y + 2.5);
  const body = `<div class="grid"></div>
<div id="c"><div class="lit" id="lit"></div>
${guides.map(([y, l], i) => `<div class="gl" style="top:${y}px" data-i="${i}"></div><span class="gt" style="left:60px;top:${y}px">${l}</span>`).join("")}
<div id="bg2"></div><div id="beam"></div>
${geoSvg(WORDMARK, { id: "wm" })}
<span id="rip" style="left:${dotX - 30}px;top:${dotY - 30}px;width:60px;height:60px;opacity:0"></span>
<span class="side" style="right:60px;text-align:right;line-height:1.5">siatka 4 px<br><span style="color:${C.dim}">linia 5 px</span></span>
</div>`;
  const script = `
const X0 = -200, X1 = ${W} + 200, B0 = 0.6, BD = 2.6, DX = ${dotX};
window.__render = (t) => {
  const bx = mix(X0, X1, P(t, B0, BD, E.inOutSine));
  const vis = P(t, B0, 0.3, E.lin) * (1 - P(t, B0 + BD - 0.3, 0.3, E.lin));
  css($("#beam"), { transform: "translateX(" + bx + "px)", opacity: vis });
  css($("#bg2"), { transform: "translateX(" + bx + "px)", opacity: vis });
  const m = "radial-gradient(220px 300px at " + bx + "px 50%,rgba(0,0,0," + 0.8 * vis + "),transparent 70%)";
  css($("#lit"), { webkitMaskImage: m });
  // prowadnice rozjaśniają się, gdy wiązka je mija
  $$(".gl").forEach((g) => (g.style.opacity = 0.55 + 0.45 * vis));
  // kropka: fala, gdy przechodzi przez nią światło
  const tc = B0 + BD * (Math.acos(1 - 2 * clamp((DX - X0) / (X1 - X0))) / Math.PI);
  const r = P(t, tc, 1.2, E.outCubic);
  css($("#rip"), { opacity: t < tc ? 0 : 0.9 * (1 - r), transform: "scale(" + (0.4 + r * 1.6) + ")" });
  const pop = t < tc ? 0 : Math.sin(clamp((t - tc) / 0.35) * Math.PI);
  $("#wm .dot").setAttribute("transform", "scale(" + (1 + 0.3 * pop) + ")");
};`;
  return {
    id: "baner-02-siatka",
    name: "Logotyp na siatce",
    desc: "Logotyp „afto.” na siatce konstrukcyjnej z opisami linii; co pętlę przechodzi po nim wiązka światła.",
    w: W,
    h: H,
    duration: 5,
    still: 0.2,
    animated: true,
    keys: [0.2, 1.2, 1.9, 2.4, 3.0],
    html: page({ w: W, h: H, style: BG + style, body, script }),
  };
}

/* 03 · usługi — przesuwający się pasek */
function uslugi() {
  const items = ["Strony internetowe", "Sklepy", "Identyfikacja wizualna", "UI/UX", "Landing page", "Logo"];
  const set = items.map((s, i) => `<span class="it${i % 2 ? " alt" : ""}">${s}</span><i class="sq"></i>`).join("");
  const style = `
#panel{position:absolute;left:0;top:0;bottom:0;width:340px;background:linear-gradient(90deg,${C.bg} 75%,rgba(7,7,10,0));z-index:2;display:flex;align-items:center;padding-left:72px;gap:22px}
#panel svg{width:118px;height:118px}
#rule{position:absolute;left:250px;top:84px;bottom:84px;width:1px;background:rgba(255,255,255,.14)}
#track{position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;white-space:nowrap;will-change:transform}
.it{font-size:72px;font-weight:500;letter-spacing:-.04em;color:${C.ink}}
.it.alt{color:${C.muted}}
.sq{display:inline-block;width:16px;height:16px;margin:0 44px;background:${C.accent};transform:translateY(8px)}
#fade{position:absolute;right:0;top:0;bottom:0;width:200px;background:linear-gradient(90deg,rgba(7,7,10,0),${C.bg});z-index:2}
`;
  const body = `<div class="grid" style="-webkit-mask-image:none;opacity:.7"></div>
<div id="c"><div id="track"><span id="s1">${set}</span><span>${set}</span><span>${set}</span></div>
<div id="panel">${geoSvg(MARK)}</div><div id="rule"></div><div id="fade"></div></div>`;
  const script = `
const SW = $("#s1").getBoundingClientRect().width, D = 12;
window.__render = (t) => {
  // dokładnie jedna szerokość zestawu na pętlę → bez szwu
  $("#track").style.transform = "translateX(" + (300 - (t / D) * SW) + "px)";
};`;
  return {
    id: "baner-03-uslugi",
    name: "Usługi — pasek",
    desc: "Pasek usług przesuwa się w pętli (Strony internetowe · Sklepy · Identyfikacja wizualna · UI/UX…), znak przypięty z lewej.",
    w: W,
    h: H,
    duration: 12,
    gifFps: 20,
    still: 0,
    animated: true,
    keys: [0, 3, 6, 9, 11.9],
    html: page({ w: W, h: H, style: BG + style, body, script }),
  };
}

/* 04 · minimalna fioletowa linia (statyczny) */
function linia() {
  const u = 8.6;
  const style = `
#big{position:absolute;left:${1110 - 4.5 * u}px;top:${150 - (26.25 - 3) * u}px;width:${44 * u}px;height:${44 * u}px;overflow:visible}
#t1{position:absolute;left:84px;top:84px;font-size:66px;font-weight:500;letter-spacing:-.04em;line-height:1}
#t2{position:absolute;left:86px;top:172px;font-size:34px;color:${C.muted};letter-spacing:-.015em}
#hl{position:absolute;left:86px;top:232px;width:780px;height:1px;background:linear-gradient(90deg,${C.accent},rgba(139,108,255,.0))}
`;
  // znak jako sam kontur linii (podwójny obrys) w kolorze akcentu
  const outline = (w, color) =>
    [
      ...MARK.circles.map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" stroke="${color}" stroke-width="${w}"/>`),
      ...MARK.paths.map((d) => `<path d="${d}" stroke="${color}" stroke-width="${w}"/>`),
    ].join("");
  const d = MARK.dot;
  const body = `<div class="grid" style="opacity:.6"></div><div class="glow" style="left:820px;top:-170px;opacity:.9"></div>
<div id="c">
<svg id="big" viewBox="${MARK.viewBox}" fill="none">
  <g>${outline(5, C.accent)}</g><g>${outline(5 - 0.32, C.bg)}</g>
  <rect x="${d.x}" y="${d.y}" width="${d.size}" height="${d.size}" fill="${C.accent}"/>
</svg>
<div id="t1">afto.works${DOT}</div>
<div id="t2">Projektowanie stron i identyfikacji</div>
<div id="hl"></div>
</div>`;
  return {
    id: "baner-04-linia",
    name: "Fioletowa linia",
    desc: "Minimalny: duży monogram narysowany samym fioletowym konturem, z prawej przycięty; nazwa i opis z lewej.",
    w: W,
    h: H,
    duration: 1,
    still: 0,
    animated: false,
    keys: [0],
    html: page({ w: W, h: H, style: BG + style, body, script: "window.__render = () => {};" }),
  };
}

/* 05 · status + przycisk z kursorem */
function status() {
  const style = `
#st{position:absolute;left:84px;top:62px;display:flex;align-items:center;gap:14px;font-size:22px;color:${C.muted}}
#st .d{position:relative;width:12px;height:12px}
#st .d b{position:absolute;inset:0;border-radius:50%;background:${C.green}}
#t1{position:absolute;left:82px;top:108px;font-size:68px;font-weight:500;letter-spacing:-.04em;line-height:1}
#t2{position:absolute;left:84px;top:196px;font-size:30px;color:${C.muted};letter-spacing:-.01em}
#t2 i{display:inline-block;width:7px;height:7px;margin:0 14px;background:${C.accent};transform:translateY(-6px)}
#btn{position:absolute;right:84px;top:50%;margin-top:-44px;height:88px;display:flex;align-items:center;gap:18px;padding:0 12px 0 40px;border-radius:999px;font-size:34px;font-weight:500;letter-spacing:-.02em;background:${C.ink};color:${C.bg}}
#btn .ar{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:${C.accent};color:#fff;font-size:30px}
#cur{position:absolute;left:0;top:0;z-index:5}
#ring{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;border:2.5px solid ${C.accent2};opacity:0}
`;
  const body = `<div class="grid"></div><div class="glow" style="left:900px;top:-110px"></div>
<div id="c">
<div id="st"><span class="d"><b></b><b id="ping"></b></span>Dostępny · afto.works</div>
<div id="t1">Przyjmuję nowe projekty${DOT}</div>
<div id="t2">Strony<i></i>Sklepy<i></i>Identyfikacja<i></i>UI/UX</div>
<div id="btn"><span>Napisz do mnie</span><span class="ar" id="ar">↗</span></div>
</div>
<div id="cur"><span id="ring"></span><svg id="arrow" width="34" height="34" viewBox="0 0 18 18" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.6));transform-origin:2px 2px"><path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`;
  const script = `
const r = $("#btn").getBoundingClientRect(), bx = r.left + r.width * 0.42, by = r.top + r.height * 0.62;
const CLICK = 2.2;
const keys = [[0, 1560, 330], [0.9, 1560, 330], [CLICK - 0.05, bx, by], [CLICK + 1.0, bx, by], [CLICK + 2.1, 1560, 360]];
window.__render = (t) => {
  const c = track(t, keys, E.inOutCubic);
  $("#cur").style.transform = "translate(" + (c.x - 4) + "px," + (c.y - 3) + "px)";
  const hover = P(t, CLICK - 0.35, 0.3, E.outCubic) * (1 - P(t, CLICK + 1.1, 0.4, E.inOutCubic));
  const press = t >= CLICK && t < CLICK + 0.26 ? Math.sin(((t - CLICK) / 0.26) * Math.PI) : 0;
  css($("#btn"), { background: "rgb(" + Math.round(mix(239, 139, hover)) + "," + Math.round(mix(237, 108, hover)) + "," + Math.round(mix(245, 255, hover)) + ")", color: hover > 0.5 ? "#fff" : "${C.bg}", transform: "scale(" + (1 - press * 0.05) + ")", boxShadow: "0 24px 60px -18px rgba(139,108,255," + 0.7 * hover + ")" });
  css($("#ar"), { background: hover > 0.5 ? "#fff" : "${C.accent}", color: hover > 0.5 ? "${C.accent}" : "#fff", transform: "translate(" + hover * 3 + "px," + -hover * 3 + "px)" });
  $("#arrow").style.transform = "scale(" + (1 - press * 0.2) + ")";
  const rp = P(t, CLICK, 0.6, E.outCubic); css($("#ring"), { opacity: t >= CLICK ? 1 - rp : 0, transform: "scale(" + (0.3 + rp * 1.4) + ")" });
  const pg = (t % 1.5) / 1.5; css($("#ping"), { opacity: 0.7 * (1 - pg), transform: "scale(" + (1 + pg * 2) + ")" });
};`;
  return {
    id: "baner-05-status",
    name: "Status + przycisk",
    desc: "„Przyjmuję nowe projekty.” z zielonym statusem i listą usług; kursor najeżdża i klika „Napisz do mnie”.",
    w: W,
    h: H,
    duration: 4.8,
    still: 0.5,
    animated: true,
    keys: [0.5, 1.6, 2.1, 2.3, 3.4, 4.6],
    html: page({ w: W, h: H, style: BG + style, body, script }),
  };
}

export const banners = () => [haslo(), siatka(), uslugi(), linia(), status()];
