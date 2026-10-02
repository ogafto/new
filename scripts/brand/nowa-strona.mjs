// „Zapowiedź nowej strony” — 4 mini-historie 1280×720 (MP4 + GIF + kadr podglądu).
import { C, MARK, geoSvg, page } from "./lib.mjs";
import { GRAIN, KINO_CSS, ambient, chars } from "./kino.mjs";

const W = 1280;
const H = 720;
const GROUP = "Zapowiedź nowej strony";

const fade = (a, d = 0.8) => `const out = P(t, ${a}, ${d}, E.inOutCubic);`;
const markIn = (size, extra = "") => geoSvg(MARK).replace("<svg", `<svg width="${size}" height="${size}" ${extra}`);

/* ================= 01 · Szkło: przeglądarka składa nową stronę w 3D ================= */
function szklo() {
  const D = 10;
  const ww = 840;
  const wh = 430;
  const amb = ambient({
    w: W,
    h: H,
    D,
    seed: 21,
    particles: 50,
    floorTop: 0.74,
    aurora: [
      { x: 420, y: 250, r: 360, color: "rgba(139,108,255,.9)", a: 0.34, dx: 40, dy: 20 },
      { x: 940, y: 420, r: 330, color: "rgba(91,63,214,.9)", a: 0.3, dx: 50, dy: 24 },
      { x: 640, y: 120, r: 260, color: "rgba(180,162,255,.7)", a: 0.12, dx: 30, dy: 10 },
    ],
  });
  const style = `${KINO_CSS}
#cam{position:absolute;inset:0;perspective:1500px;perspective-origin:50% 42%}
#win{position:absolute;left:${(W - ww) / 2}px;top:${(H - wh) / 2 - 40}px;width:${ww}px;height:${wh}px;transform-style:preserve-3d}
#win>*{position:absolute}
#pane{inset:0;border-radius:26px}
.bar{left:0;right:0;top:0;height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 18px 0 22px;border-bottom:1px solid rgba(255,255,255,.07)}
.dots{display:flex;gap:8px}.dots i{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.16)}
.url{display:flex;align-items:center;gap:10px;height:32px;min-width:250px;padding:0 16px;border-radius:999px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);font-size:15px;color:${C.ink}}
.url svg{opacity:.5}
#caret{width:1.5px;height:16px;background:${C.accent2}}
#stat{display:flex;align-items:center;gap:8px;font-size:13px;color:${C.muted}}
#sd{position:relative;width:8px;height:8px;border-radius:50%;background:${C.green}}
#sp{position:absolute;inset:0;border-radius:50%;background:${C.green}}
.sk{background:linear-gradient(90deg,rgba(255,255,255,.05) 0%,rgba(255,255,255,.12) var(--k,50%),rgba(255,255,255,.05) 100%);border-radius:10px}
#nav{left:34px;right:34px;top:76px;height:28px;display:flex;align-items:center;justify-content:space-between}
#nav .l{font-size:21px;font-weight:500;letter-spacing:-.03em}
#nav .m{display:flex;gap:26px;font-size:14px;color:${C.muted}}
#nav .k{height:30px;padding:0 14px;border-radius:999px;background:${C.ink};color:${C.bg};font-size:13px;font-weight:500;display:flex;align-items:center}
#kick{left:34px;top:140px;display:inline-flex;align-items:center;gap:9px;height:28px;padding:0 13px;border-radius:999px;font-size:13px;color:${C.accent2};background:rgba(139,108,255,.12);box-shadow:inset 0 0 0 1px rgba(139,108,255,.35)}
#kick i{width:6px;height:6px;border-radius:50%;background:${C.accent2}}
#h1{left:34px;top:180px;font-size:50px;font-weight:500;letter-spacing:-.045em;line-height:1.02;white-space:nowrap}
#h1 .a{color:${C.accent2}}
#btn{left:34px;top:298px;height:42px;display:flex;align-items:center;gap:10px;padding:0 6px 0 18px;border-radius:999px;background:${C.ink};color:${C.bg};font-size:15px;font-weight:500}
#btn b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:${C.accent};color:#fff;font-weight:500}
.card{top:150px;width:150px;height:188px;border-radius:18px;overflow:hidden;box-shadow:0 30px 60px -25px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.1)}
#c1{left:452px;top:136px;background:linear-gradient(160deg,#2a2140,#100e18);display:grid;place-items:center}
#c2{left:640px;top:104px;background:linear-gradient(165deg,#c4b4ff,#6a4ff0 60%,#3b2a9a)}
#c3{left:598px;top:258px;width:204px;height:140px;background:linear-gradient(160deg,#f1ecff,#a48dff)}
.card .cap{position:absolute;left:14px;bottom:12px;font-size:12px;color:rgba(255,255,255,.85)}
#c3 .cap{color:rgba(20,16,40,.75)}
.skl{opacity:1}
#capt{position:absolute;left:0;right:0;top:${H / 2 + wh / 2 - 24}px;text-align:center}
#capt h2{font-size:62px;font-weight:500;letter-spacing:-.045em;line-height:1}
#capt p{margin-top:16px;font-size:21px;color:${C.muted}}
#capt p b{font-weight:500;color:${C.ink}}
`;
  const body = `${amb.html}
<div id="c" class="abs" style="inset:0"><div id="cam"><div id="win">
  <div id="pane" class="glass"></div>
  <div class="bar" id="bar"><span class="dots"><i></i><i></i><i></i></span>
    <span class="url"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span id="ut"></span><i id="caret"></i></span>
    <span id="stat"><span id="sd"><span id="sp"></span></span><span id="st">W budowie</span></span></div>
  <div class="sk skl" style="left:34px;top:80px;width:110px;height:20px" id="k1"></div>
  <div class="sk skl" style="left:620px;top:80px;width:186px;height:20px" id="k2"></div>
  <div class="sk skl" style="left:34px;top:180px;width:390px;height:46px" id="k3"></div>
  <div class="sk skl" style="left:34px;top:236px;width:300px;height:46px" id="k4"></div>
  <div class="sk skl" style="left:34px;top:298px;width:170px;height:42px;border-radius:999px" id="k5"></div>
  <div class="sk skl" style="left:452px;top:110px;width:350px;height:290px;border-radius:18px" id="k6"></div>
  <div id="nav"><span class="l">afto<span style="color:${C.accent}">.</span></span><span class="m"><span>Realizacje</span><span>Usługi</span><span>Proces</span></span><span class="k">Kontakt</span></div>
  <div id="kick"><i></i>Nowa odsłona</div>
  <div id="h1"><div>${chars("Strony, które")}</div><div>${chars("wyglądają")} <span class="a">${chars("drogo.")}</span></div></div>
  <div id="btn">Zobacz realizacje <b>↗</b></div>
  <div class="card" id="c1">${markIn(64)}<span class="cap">Identyfikacja</span></div>
  <div class="card" id="c2"><span class="cap">Sklep</span></div>
  <div class="card" id="c3"><span class="cap">Strona firmowa</span></div>
</div></div>
<div id="capt"><h2>${chars("Nowa strona.")}<span id="cdot" class="ch" style="color:${C.accent}"></span></h2><p id="cp"><b>afto.works</b> · już wkrótce</p></div>
</div>${GRAIN}`;
  const script = `${amb.js}
const URL_T = "afto.works", L = (sel) => $$(sel);
const h1 = L("#h1 .ch"), cap = L("#capt h2 .ch");
const layers = [["#bar", 12], ["#nav", 34], ["#kick", 60], ["#h1", 80], ["#btn", 100], ["#c1", 46], ["#c2", 70], ["#c3", 110]];
window.__render = (t) => {
  amb(t);
  ${fade(9.15, 0.85)}
  const ph = (t / 10) * Math.PI * 2;
  // kamera: okno wyłania się z głębi i obraca, odsłaniając warstwy (paralaksa)
  const inn = P(t, 0.1, 1.6, E.outExpo), orb = P(t, 0.2, 5.2, E.inOutCubic), up = P(t, 5.0, 1.4, E.inOutQuart);
  const ry = mix(30, -9, orb) + Math.sin(ph) * 1.5, rx = mix(14, 5, orb) + up * 2, tz = mix(-520, 0, inn) - out * 380, ty = -up * 46;
  const sc = 1 - up * 0.1;
  $("#win").style.transform = "translate3d(0," + ty + "px," + tz + "px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) scale(" + sc + ")";
  const vis = inn * (1 - out);
  $("#pane").style.opacity = vis; glint($("#pane"), t, 5.8, 1.4);
  $("#pane").style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.22),inset 0 0 0 1px rgba(" + (P(t, 6.3, 0.8) > 0 ? "139,108,255," + (0.09 + 0.4 * P(t, 6.3, 0.8)) : "255,255,255,.09") + "),0 60px 140px -40px rgba(0,0,0,.95),0 40px 120px -50px rgba(139,108,255," + (0.45 + 0.35 * P(t, 6.3, 0.8)) + ")";
  // szkielet: migotanie, potem znika gdy wchodzi treść
  const k = ((t * 0.9) % 1) * 160 - 30;
  [["#k1", 1.9], ["#k2", 1.9], ["#k3", 2.3], ["#k4", 2.3], ["#k5", 2.95], ["#k6", 3.3]].forEach(([s, a]) => { const e = $(s); e.style.setProperty("--k", k + "%"); e.style.opacity = vis * P(t, 0.5, 0.6, E.lin) * (1 - P(t, a, 0.35, E.lin)); });
  // warstwy treści: każda wjeżdża sprężyście z większej głębi (translateZ)
  const appear = { "#bar": 0.6, "#nav": 1.9, "#kick": 2.15, "#h1": 2.3, "#btn": 2.95, "#c1": 3.3, "#c2": 3.45, "#c3": 3.6 };
  layers.forEach(([s, z]) => {
    const a = appear[s], e = $(s), sp = t < a ? 0 : E.spring(clamp((t - a) / 0.9), 6.5, 0.55);
    const zz = z + (1 - sp) * 140;
    e.style.transform = "translateZ(" + zz.toFixed(1) + "px) translateY(" + ((1 - Math.min(1, sp)) * 14).toFixed(1) + "px)";
    e.style.opacity = (s === "#bar" ? P(t, a, 0.6, E.lin) : clamp((t - a) / 0.25)) * vis;
  });
  h1.forEach((el, i) => { const p = P(t, 2.3 + i * 0.022, 0.8, E.outExpo); css(el, { opacity: clamp((t - 2.3 - i * 0.022) / 0.3), transform: "translateY(" + (1 - p) * 0.35 + "em)", filter: "blur(" + (1 - p) * 6 + "px)" }); });
  // adres: wpisywany znak po znaku, potem status „Wkrótce online”
  const n = Math.max(0, Math.min(URL_T.length, Math.floor((t - 4.1) / 0.075)));
  $("#ut").textContent = URL_T.slice(0, n);
  $("#caret").style.opacity = t < 3.9 || t > 5.5 ? 0 : (Math.floor(t * 2.6) % 2 ? 0.2 : 1);
  const live = t >= 5.3;
  $("#st").textContent = live ? "Wkrótce online" : "W budowie";
  $("#st").style.color = live ? "${C.ink}" : "${C.muted}";
  $("#sd").style.background = live ? "${C.green}" : "#d8a64a";
  $("#sp").style.background = live ? "${C.green}" : "#d8a64a";
  const pg = ((t - 5.3) % 1.3) / 1.3; css($("#sp"), { opacity: live ? 0.7 * (1 - pg) : 0, transform: "scale(" + (1 + pg * 2) + ")" });
  // podpis pod oknem
  cap.forEach((el, i) => { const p = P(t, 5.5 + i * 0.035, 1.0, E.outExpo); css(el, { opacity: clamp((t - 5.5 - i * 0.035) / 0.35) * (1 - out), transform: "translateY(" + (1 - p) * 0.4 + "em)", filter: "blur(" + (1 - p) * 8 + "px)" }); });
  const cp = P(t, 6.2, 1.0, E.outExpo); css($("#cp"), { opacity: cp * (1 - out), transform: "translateY(" + (1 - cp) * 12 + "px)" });
};`;
  return {
    id: "zapowiedz-nowa-strona-01-szklo",
    title: "Szkło — nowa strona składa się w 3D",
    description: "Szklane okno przeglądarki wyłania się z głębi i obraca; szkielet ładowania zamienia się w warstwy nowej strony (paralaksa), adres wpisuje się „afto.works”, status zmienia się na „Wkrótce online”. Podpis: „Nowa strona. afto.works · już wkrótce”.",
    group: GROUP,
    w: W,
    h: H,
    duration: D,
    gifW: 960,
    gifH: 540,
    gifFps: 20,
    gifLossy: 14,
    still: 7.4,
    poster: true,
    keys: [0.5, 1.4, 2.2, 2.8, 3.6, 4.6, 5.6, 7.4],
    html: page({ w: W, h: H, style, body, script }),
  };
}

/* ================= 02 · Światło: szklana płytka ze znakiem + odliczanie ================= */
function swiatlo() {
  const D = 9.5;
  const S = 270;
  const cx = W / 2;
  const cy = 300;
  const R = 196;
  const amb = ambient({
    w: W,
    h: H,
    D,
    seed: 33,
    particles: 56,
    floorTop: 0.76,
    aurora: [
      { x: cx, y: cy, r: 330, color: "rgba(139,108,255,.95)", a: 0.4, dx: 18, dy: 12 },
      { x: 260, y: 600, r: 300, color: "rgba(91,63,214,.9)", a: 0.22, dx: 40, dy: 20 },
      { x: 1050, y: 140, r: 280, color: "rgba(91,63,214,.9)", a: 0.2, dx: 40, dy: 20 },
    ],
  });
  const circ = 2 * Math.PI * R;
  const style = `${KINO_CSS}
#cam{position:absolute;inset:0;perspective:1100px;perspective-origin:50% ${cy}px}
#slab{position:absolute;left:${cx - S / 2}px;top:${cy - S / 2}px;width:${S}px;height:${S}px;border-radius:${S * 0.26}px}
#slab svg{position:absolute;left:50%;top:50%;width:${S * 0.56}px;height:${S * 0.56}px;margin:${-S * 0.28}px 0 0 ${-S * 0.28}px;overflow:visible}
#rim{position:absolute;inset:0;border-radius:inherit;padding:1.5px;background:conic-gradient(from var(--a,0deg),transparent,rgba(230,224,255,.95) 10%,transparent 22%,transparent 55%,rgba(139,108,255,.8) 66%,transparent 78%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
#ring{position:absolute;left:${cx - R - 10}px;top:${cy - R - 10}px;width:${2 * R + 20}px;height:${2 * R + 20}px;overflow:visible}
#laser{position:absolute;top:0;bottom:0;left:0;width:2px;background:linear-gradient(to bottom,transparent,rgba(235,230,255,.95) 25%,rgba(235,230,255,.95) 75%,transparent);box-shadow:0 0 18px 4px rgba(139,108,255,.55)}
#lglow{position:absolute;top:-10%;bottom:-10%;left:0;width:420px;margin-left:-210px;background:radial-gradient(closest-side,rgba(139,108,255,.28),transparent)}
#burst{position:absolute;left:${cx}px;top:${cy}px;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:radial-gradient(closest-side,rgba(220,212,255,.9),rgba(139,108,255,.35) 45%,transparent);pointer-events:none}
#shock{position:absolute;left:${cx - R - 10}px;top:${cy - R - 10}px;width:${2 * R + 20}px;height:${2 * R + 20}px;border-radius:50%;border:2px solid ${C.accent2};pointer-events:none}
#cd{position:absolute;left:${cx - 120}px;top:${cy + R + 34}px;width:240px;height:64px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:16px;font-size:17px;color:${C.muted}}
#digits{position:relative;width:52px;height:40px;perspective:300px}
#digits span{position:absolute;inset:0;display:grid;place-items:center;font-size:34px;font-weight:500;color:${C.ink};letter-spacing:-.02em;font-variant-numeric:tabular-nums;backface-visibility:hidden;transform-origin:50% 50% -20px}
#fin{position:absolute;left:0;right:0;top:${cy + R + 22}px;text-align:center}
#fin h2{font-size:60px;font-weight:500;letter-spacing:-.045em;line-height:1}
#fin p{margin-top:14px;font-size:20px;color:${C.muted}}
#fin p b{font-weight:500;color:${C.ink}}
`;
  const body = `${amb.html}
<div id="c" class="abs" style="inset:0">
  <div id="lglow"></div>
  <svg id="ring" viewBox="0 0 ${2 * R + 20} ${2 * R + 20}" fill="none">
    <circle cx="${R + 10}" cy="${R + 10}" r="${R}" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/>
    ${[0, 1, 2].map((i) => `<path d="M${R + 10 + R * Math.sin((i * 2 * Math.PI) / 3)} ${R + 10 - R * Math.cos((i * 2 * Math.PI) / 3)}m0 -7v14" transform="rotate(${i * 120} ${R + 10 + R * Math.sin((i * 2 * Math.PI) / 3)} ${R + 10 - R * Math.cos((i * 2 * Math.PI) / 3)})" stroke="rgba(255,255,255,.25)" stroke-width="1.5"/>`).join("")}
    <circle id="arc" cx="${R + 10}" cy="${R + 10}" r="${R}" stroke="${C.accent}" stroke-width="3" stroke-linecap="round" transform="rotate(-90 ${R + 10} ${R + 10})" stroke-dasharray="0 ${circ}" style="filter:drop-shadow(0 0 8px rgba(139,108,255,.9))"/>
  </svg>
  <span id="shock" style="opacity:0"></span>
  <div id="cam"><div id="slab" class="glass">${markIn(100).replace(/ width="100" height="100"/, "")}<div id="rim"></div></div></div>
  <div id="burst"></div>
  <div id="cd" class="glass"><span>Start za</span><span id="digits"><span id="d0">03</span><span id="d1">02</span><span id="d2">01</span></span></div>
  <div id="fin"><h2>${chars("Nowa strona")} <span style="color:${C.accent2}">${chars("już wkrótce")}</span><span class="ch" style="color:${C.accent}">.</span></h2><p id="fp"><b>afto.works</b> · coś się szykuje</p></div>
  <div id="laser"></div>
</div>${GRAIN}`;
  const script = `${amb.js}
const CIRC = ${circ}, strokes = $$("#slab [data-s]"), dot = $("#slab .dot"), ds = [$("#d0"), $("#d1"), $("#d2")], fin = $$("#fin h2 .ch");
const T = [3.1, 4.1, 5.1], GO = 6.1;
window.__render = (t) => {
  amb(t);
  ${fade(8.75, 0.75)}
  const ph = (t / ${D}) * Math.PI * 2;
  // laser przechodzi przez kadr i „zapala” płytkę
  const lx = mix(-80, ${W} + 80, P(t, 0.25, 1.9, E.inOutSine));
  const lv = P(t, 0.25, 0.3, E.lin) * (1 - P(t, 1.85, 0.3, E.lin));
  css($("#laser"), { transform: "translateX(" + lx + "px)", opacity: lv }); css($("#lglow"), { transform: "translateX(" + lx + "px)", opacity: lv });
  const lit = P(t, 1.05, 1.2, E.outExpo);
  const lift = P(t, GO, 1.3, E.inOutQuart);
  const ry = mix(-38, -10, P(t, 0.6, 5.5, E.inOutCubic)) + Math.sin(ph) * 3 + lift * 10, rx = 8 + Math.cos(ph) * 3 - lift * 4;
  css($("#slab"), { opacity: lit * (1 - out), transform: "translateY(" + (-lift * 34) + "px) translateZ(" + (mix(-160, 0, lit) - out * 200) + "px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) scale(" + (1 - lift * 0.08) + ")", filter: "blur(" + ((1 - lit) * 8 + out * 6).toFixed(2) + "px)" });
  $("#rim").style.setProperty("--a", (t / ${D}) * 720 + 40 + "deg");
  glint($("#slab"), t, GO + 0.2, 1.2);
  // znak: świecące linie, które gasną do bieli
  strokes.forEach((s) => { const i = +s.dataset.s; draw(s, P(t, 1.4 + i * 0.28, 1.1, E.inOutQuart)); });
  const glow = Math.exp(-Math.pow((t - 2.5) / 1.1, 2));
  $("#slab svg").style.filter = "drop-shadow(0 0 " + (14 * glow).toFixed(1) + "px rgba(180,162,255," + (0.95 * glow).toFixed(2) + "))";
  const dp = t < 2.55 ? 0 : E.outBack(clamp((t - 2.55) / 0.55), 2.4);
  dot.setAttribute("transform", "scale(" + Math.max(0, dp) + ")");
  const bl = (t >= 2.55 ? Math.exp(-(t - 2.55) * 2.4) : 0) + (t >= GO ? Math.exp(-(t - GO) * 2.0) * 1.3 : 0);
  css($("#burst"), { opacity: Math.min(1, bl), transform: "translateY(" + (-lift * 34) + "px) scale(" + (8 + bl * 46) + ")" });
  // pierścień odliczania
  const prog = clamp(P(t, T[0], 0.8, E.inOutCubic) / 3 + P(t, T[1], 0.8, E.inOutCubic) / 3 + P(t, T[2], 0.8, E.inOutCubic) / 3);
  $("#arc").setAttribute("stroke-dasharray", (prog * CIRC).toFixed(1) + " " + CIRC);
  const rv = P(t, 2.4, 0.8, E.lin) * (1 - P(t, GO + 0.1, 0.5, E.lin));
  css($("#ring"), { opacity: rv * (1 - out), transform: "rotate(" + (Math.sin(ph) * 2).toFixed(2) + "deg)" });
  const sk = P(t, GO, 1.1, E.outCubic); css($("#shock"), { opacity: t < GO ? 0 : 0.8 * (1 - sk), transform: "scale(" + (1 + sk * 0.5) + ")" });
  // cyfry obracają się jak na tablicy
  ds.forEach((d, i) => { const a = T[i] - 0.35, b = i < 2 ? T[i + 1] - 0.35 : GO; const pin = P(t, a, 0.6, E.outCubic), pout = P(t, b, 0.5, E.inOutCubic); css(d, { opacity: t < a ? 0 : 1 - pout, transform: "rotateX(" + ((1 - pin) * 90 - pout * 90) + "deg)" }); });
  const cdv = P(t, 2.6, 0.8, E.outExpo) * (1 - P(t, GO, 0.45, E.inOutCubic));
  css($("#cd"), { opacity: cdv, transform: "translateY(" + (1 - P(t, 2.6, 0.8, E.outExpo)) * 16 + "px) scale(" + (1 - (1 - cdv) * 0.04) + ")" });
  fin.forEach((el, i) => { const a = GO + 0.35 + i * 0.03, p = P(t, a, 1.0, E.outExpo); css(el, { opacity: clamp((t - a) / 0.35) * (1 - out), transform: "translateY(" + (1 - p) * 0.4 + "em)", filter: "blur(" + (1 - p) * 8 + "px)" }); });
  const fp = P(t, GO + 1.0, 1.0, E.outExpo); css($("#fp"), { opacity: fp * (1 - out), transform: "translateY(" + (1 - fp) * 12 + "px)" });
};`;
  return {
    id: "zapowiedz-nowa-strona-02-swiatlo",
    title: "Światło — znak w szkle i odliczanie",
    description: "Laser przecina ciemność i zapala szklaną płytkę ze znakiem; linie „af.” świecą i gasną do bieli, pierścień odlicza 03 · 02 · 01, fala światła i hasło „Nowa strona już wkrótce.”",
    group: GROUP,
    w: W,
    h: H,
    duration: D,
    gifW: 960,
    gifH: 540,
    gifFps: 20,
    gifLossy: 14,
    still: 7.6,
    poster: true,
    keys: [0.8, 1.6, 2.6, 3.5, 4.6, 5.6, 6.4, 7.6],
    html: page({ w: W, h: H, style, body, script }),
  };
}

/* ================= 03 · Kinetyka: typografia w ruchu ================= */
function kinetyka() {
  const D = 9;
  const amb = ambient({
    w: W,
    h: H,
    D,
    seed: 41,
    particles: 40,
    floor: false,
    aurora: [
      { x: 640, y: 360, r: 420, color: "rgba(139,108,255,.8)", a: 0.22, dx: 60, dy: 30 },
      { x: 200, y: 120, r: 260, color: "rgba(91,63,214,.9)", a: 0.18, dx: 40, dy: 20 },
    ],
  });
  const ghosts = [
    ["STRONY", 70, 250, -0.6, 0.05],
    ["SKLEPY", 330, 330, 0.9, 0.04],
    ["IDENTYFIKACJA", 560, 160, -1.2, 0.035],
  ];
  const style = `${KINO_CSS}
.gw{position:absolute;left:0;white-space:nowrap;font-weight:600;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:1.2px rgba(239,237,245,.5);line-height:1}
#cam{position:absolute;inset:0;perspective:900px}
.sc{position:absolute;left:0;right:0;text-align:center;transform-style:preserve-3d}
#s1{top:200px;font-size:132px;font-weight:500;letter-spacing:-.05em;line-height:1}
#s1 .ch{transform-origin:50% 70%}
#dots{display:inline-flex;gap:14px;margin-left:14px;vertical-align:baseline}
#dots i{display:inline-block;width:22px;height:22px;background:${C.accent};box-shadow:0 0 20px rgba(139,108,255,.8)}
#s2{top:150px;font-size:210px;font-weight:500;letter-spacing:-.06em;line-height:.9}
#s2 .row{position:relative;display:block;white-space:nowrap;width:max-content;margin:0 auto}
#s2 .ol{color:transparent;-webkit-text-stroke:1.5px rgba(239,237,245,.35)}
#s2 .fl{position:absolute;inset:0;color:${C.ink}}
#s2 .edge{position:absolute;top:-6%;bottom:-6%;width:3px;background:linear-gradient(to bottom,transparent,#fff 20%,#fff 80%,transparent);box-shadow:0 0 22px 6px rgba(139,108,255,.7)}
#s3{top:250px}
#s3 .row{display:flex;align-items:center;justify-content:center;gap:34px}
#s3 h2{font-size:104px;font-weight:500;letter-spacing:-.05em;line-height:1}
#line{position:absolute;left:50%;top:410px;height:2px;width:560px;margin-left:-280px;background:linear-gradient(90deg,transparent,${C.accent} 20%,${C.accent2} 50%,${C.accent} 80%,transparent);transform-origin:50% 50%;box-shadow:0 0 18px rgba(139,108,255,.7)}
#tag{position:absolute;left:0;right:0;top:448px;text-align:center}
`;
  const body = `${amb.html}
${ghosts.map(([wd, y, , , op], i) => `<div class="gw" id="g${i}" style="top:${y}px;font-size:${[260, 200, 150][i]}px;opacity:${op}">${wd}</div>`).join("")}
<div id="c" class="abs" style="inset:0"><div id="cam">
  <div class="sc" id="s1"><div>${chars("Coś się")}</div><div>${chars("szykuje")}<span id="dots"><i></i><i></i><i></i></span></div></div>
  <div class="sc" id="s2">
    <span class="row" id="r1"><span class="ol">Nowa</span><span class="fl" id="f1">Nowa</span><span class="edge" id="e1"></span></span>
    <span class="row" id="r2"><span class="ol">odsłona<span style="-webkit-text-stroke-color:rgba(139,108,255,.6)">.</span></span><span class="fl" id="f2">odsłona<span style="color:${C.accent}">.</span></span><span class="edge" id="e2"></span></span>
  </div>
  <div class="sc" id="s3"><div class="row">${markIn(118, 'id="mk"')}<h2>${chars("afto.works")}</h2></div></div>
  <div id="line"></div>
  <div id="tag"><span class="chip" id="chip"><span class="dotc"></span>Nowa strona · wkrótce online</span></div>
</div></div>${GRAIN}`;
  const script = `${amb.js}
const G = ${JSON.stringify(ghosts.map(([, , x, v]) => [x, v]))};
const s1 = $$("#s1 .ch"), dots = $$("#dots i"), s3c = $$("#s3 h2 .ch"), mk = $$("#mk [data-s]"), mkd = $("#mk .dot");
const r1w = $("#r1").offsetWidth, r2w = $("#r2").offsetWidth;
const env = (t) => P(t, 0, 1.0, E.lin) * (1 - P(t, ${D} - 1.0, 1.0, E.lin));
window.__render = (t) => {
  amb(t);
  ${fade(8.2, 0.8)}
  // tło: wielkie słowa-duchy w trzech planach, różne prędkości (paralaksa)
  G.forEach(([x, v], i) => { $("#g" + i).style.transform = "translateX(" + (x + v * 60 * t - 120) + "px)"; $("#g" + i).style.visibility = env(t) > 0 ? "visible" : "hidden"; $("#g" + i).style.filter = "blur(" + [0, 1, 2][i] + "px)"; $("#g" + i).style.opacity = [0.06, 0.045, 0.035][i] * env(t); });
  // scena 1: litery nadlatują z głębi; „kropki” marki migają kolejno
  const z1 = P(t, 2.55, 0.6, E.inCubic);
  css($("#s1"), { transform: "translateZ(" + (z1 * 700) + "px)", opacity: 1 - z1, filter: "blur(" + z1 * 14 + "px)" });
  s1.forEach((el, i) => { const a = 0.25 + i * 0.045, p = P(t, a, 1.0, E.outExpo); css(el, { opacity: clamp((t - a) / 0.3), transform: "translateZ(" + ((1 - p) * -600).toFixed(1) + "px) rotateX(" + ((1 - p) * 40).toFixed(1) + "deg)", filter: "blur(" + ((1 - p) * 10).toFixed(1) + "px)" }); });
  dots.forEach((d, i) => { const a = 1.0 + i * 0.12; const on = t < a ? 0 : E.outBack(clamp((t - a) / 0.4), 2.5); const blink = t > 1.6 ? 0.45 + 0.55 * Math.max(0, Math.sin((t - 1.6) * 5 - i * 0.9)) : 1; css(d, { transform: "scale(" + on + ")", opacity: blink }); });
  // scena 2: kontur wypełnia się światłem (krawędź z poświatą)
  const s2in = P(t, 2.85, 0.7, E.outExpo), s2out = P(t, 5.25, 0.55, E.inOutCubic);
  css($("#s2"), { opacity: P(t, 2.85, 0.4, E.lin) * (1 - s2out), transform: "translateZ(" + ((1 - s2in) * -500 + s2out * 120) + "px) translateY(" + (-s2out * 40) + "px)", filter: "blur(" + ((1 - s2in) * 10 + s2out * 10) + "px)" });
  [[1, r1w, 3.2], [2, r2w, 3.55]].forEach(([k, w, a]) => { const p = P(t, a, 1.3, E.inOutCubic); $("#f" + k).style.clipPath = "inset(-10% " + ((1 - p) * 100).toFixed(2) + "% -10% 0)"; css($("#e" + k), { left: (p * w - 1.5) + "px", opacity: p > 0.002 && p < 0.998 ? 1 : 0 }); });
  // scena 3: znak + nazwa, linia i plakietka
  const s3in = t > 5.6;
  $("#s3").style.opacity = s3in ? 1 - out : 0;
  mk.forEach((s) => draw(s, P(t, 5.65 + +s.dataset.s * 0.18, 0.85, E.inOutQuart)));
  const dp = t < 6.3 ? 0 : E.outBack(clamp((t - 6.3) / 0.5), 2.4); mkd.setAttribute("transform", "scale(" + Math.max(0, dp) + ")");
  s3c.forEach((el, i) => { const a = 5.85 + i * 0.04, p = P(t, a, 0.9, E.outExpo); css(el, { opacity: clamp((t - a) / 0.3), transform: "translateX(" + (1 - p) * -0.25 + "em)", filter: "blur(" + (1 - p) * 8 + "px)" }); });
  const lp = P(t, 6.4, 1.1, E.outExpo); css($("#line"), { transform: "scaleX(" + lp + ")", opacity: (s3in ? 1 : 0) * (1 - out) });
  const cp = P(t, 6.8, 1.0, E.outExpo); css($("#chip"), { opacity: cp * (1 - out), transform: "translateY(" + (1 - cp) * 14 + "px)" });
  $("#chip .dotc").style.opacity = 0.55 + 0.45 * Math.cos(t * 4);
};`;
  return {
    id: "zapowiedz-nowa-strona-03-kinetyka",
    title: "Kinetyka — „Coś się szykuje…”",
    description: "Typografia w ruchu: „Coś się szykuje” nadlatuje z głębi z migającymi kropkami marki, przelot kamery przez tekst, kontur „Nowa odsłona.” wypełnia się światłem, finał: znak + „afto.works” i „Nowa strona · wkrótce online”. W tle słowa-duchy w trzech planach.",
    group: GROUP,
    w: W,
    h: H,
    duration: D,
    gifW: 960,
    gifH: 540,
    gifFps: 20,
    gifLossy: 14,
    still: 7.6,
    poster: true,
    keys: [0.6, 1.5, 2.7, 3.5, 4.3, 5.4, 6.4, 7.6],
    html: page({ w: W, h: H, style, body, script }),
  };
}

/* ================= 04 · Powiadomienie: telefon dostaje wiadomość od afto. ================= */
function powiadomienie() {
  const D = 10;
  const PW = 300;
  const PH = 616;
  const amb = ambient({
    w: W,
    h: H,
    D,
    seed: 57,
    particles: 44,
    floorTop: 0.8,
    aurora: [
      { x: 640, y: 330, r: 360, color: "rgba(139,108,255,.9)", a: 0.3, dx: 30, dy: 16 },
      { x: 980, y: 260, r: 320, color: "rgba(91,63,214,.9)", a: 0.22, dx: 50, dy: 20 },
    ],
  });
  const icon = (s) => `<span class="ai" style="width:${s}px;height:${s}px;border-radius:${s * 0.26}px">${markIn(s * 0.62)}</span>`;
  const style = `${KINO_CSS}
#cam{position:absolute;inset:0;perspective:1400px}
#ph{position:absolute;left:${W / 2 - PW / 2}px;top:${(H - PH) / 2}px;width:${PW}px;height:${PH}px;border-radius:54px;transform-style:preserve-3d}
#frame{position:absolute;inset:0;border-radius:54px;background:linear-gradient(145deg,#3a3846,#15141b 30%,#0c0c10 60%,#2c2a36);box-shadow:0 70px 120px -40px rgba(0,0,0,.95),0 0 60px -12px rgba(139,108,255,.55),inset 0 0 0 1.5px rgba(255,255,255,.2),inset 2px 2px 0 rgba(255,255,255,.12)}
#scr{position:absolute;inset:9px;border-radius:46px;overflow:hidden;background:radial-gradient(70% 45% at 20% 75%,rgba(139,108,255,.55),transparent 70%),radial-gradient(80% 50% at 90% 25%,rgba(91,63,214,.6),transparent 70%),radial-gradient(120% 80% at 50% 0%,#241c44,#0d0b18 60%,#07070a)}
#wall{position:absolute;left:50%;top:63%;width:220px;height:220px;margin:-110px 0 0 -110px;opacity:.09}
#scr::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.1),transparent 35%);pointer-events:none}
#isl{position:absolute;left:50%;top:13px;width:96px;height:28px;margin-left:-48px;border-radius:20px;background:#000}
#time{position:absolute;left:0;right:0;top:62px;text-align:center;font-size:78px;font-weight:500;letter-spacing:-.04em;color:rgba(239,237,245,.92);line-height:1}
#date{position:absolute;left:0;right:0;top:44px;text-align:center;font-size:15px;color:rgba(239,237,245,.7)}
.nt{position:absolute;left:12px;right:12px;top:178px;padding:13px 14px;border-radius:22px;display:flex;gap:11px;align-items:flex-start;background:rgba(40,36,58,.55);backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 18px 40px -20px rgba(0,0,0,.8)}
.ai{flex:none;display:grid;place-items:center;background:linear-gradient(160deg,#1b1a24,#0b0b0f);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.nt .tx{min-width:0;flex:1}
.nt .hd{display:flex;justify-content:space-between;font-size:11.5px;color:rgba(239,237,245,.6)}
.nt .ti{margin-top:2px;font-size:14.5px;font-weight:500;color:${C.ink};letter-spacing:-.01em}
.nt .bd{margin-top:1px;font-size:13px;color:rgba(239,237,245,.75);line-height:1.3}
#tap{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.35);box-shadow:0 0 0 1px rgba(255,255,255,.5);pointer-events:none}
#app{position:absolute;inset:0;background:radial-gradient(90% 55% at 50% 42%,#1d1733,#0a0910 70%);display:flex;flex-direction:column;align-items:center;justify-content:center}
#app .t1{margin-top:26px;font-size:30px;font-weight:500;letter-spacing:-.035em}
#app .t2{margin-top:4px;font-size:15px;color:${C.muted}}
#bar{margin-top:26px;width:120px;height:3px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden}
#bar i{display:block;height:100%;background:${C.accent};box-shadow:0 0 10px ${C.accent}}
#side{position:absolute;left:640px;top:220px}
#side h2{font-size:76px;font-weight:500;letter-spacing:-.05em;line-height:1.02;white-space:nowrap}
#side h2 .a{color:${C.accent2}}
#side p{margin-top:22px;font-size:21px;color:${C.muted};line-height:1.45}
#side .chip{margin-top:26px}
#rings span{position:absolute;left:${W / 2}px;top:${H / 2}px;border-radius:60px;border:1.5px solid rgba(180,162,255,.6);pointer-events:none}
`;
  const body = `${amb.html}
<div id="c" class="abs" style="inset:0">
<div id="rings">${[0, 1].map((i) => `<span id="rg${i}" style="width:${PW}px;height:${PH}px;margin:${-PH / 2}px 0 0 ${-PW / 2}px;opacity:0"></span>`).join("")}</div>
<div id="cam"><div id="ph"><div id="frame"></div><div id="scr">
  ${geoSvg(MARK, { id: "wall", ink: "#c9bcff", accent: "#b4a2ff" })}<div id="isl"></div><div id="date">Dzień premiery</div><div id="time">9:41</div>
  <div class="nt" id="n1">${icon(38)}<div class="tx"><div class="hd"><span>afto.works</span><span>teraz</span></div><div class="ti">Coś się szykuje.</div><div class="bd">Pracujemy nad nową stroną.</div></div></div>
  <div class="nt" id="n2">${icon(38)}<div class="tx"><div class="hd"><span>afto.works</span><span>teraz</span></div><div class="ti">Nowa strona jest prawie gotowa</div><div class="bd">Bądź pierwszy — dotknij, aby zobaczyć.</div></div></div>
  <div id="app">${markIn(92, 'id="am"')}<div class="t1">Nowa strona</div><div class="t2">już wkrótce</div><div id="bar"><i></i></div></div>
  <span id="tap"></span>
</div></div></div>
<div id="side"><h2>${chars("Nowa strona.")}<br><span class="a">${chars("Już wkrótce.")}</span></h2><p id="sp">Pierwsi dowiedzą się o starcie.<br>Zajrzyj na <b style="color:${C.ink};font-weight:500">afto.works</b></p></div>
</div>${GRAIN}`;
  const script = `${amb.js}
const side = $$("#side h2 .ch"), am = $$("#am [data-s]"), amd = $("#am .dot");
const N1 = 1.0, N2 = 2.4, TAP = 4.0, OPEN = 4.25, MOVE = 4.7;
window.__render = (t) => {
  amb(t);
  ${fade(9.2, 0.8)}
  const ph = (t / 10) * Math.PI * 2;
  // telefon: wjazd z głębi, unoszenie się, przesunięcie w lewo przy otwarciu
  const inn = P(t, 0.05, 1.5, E.outExpo), mv = P(t, MOVE, 1.5, E.inOutQuart);
  let buzz = 0; [N1, N2].forEach((a) => { if (t >= a && t < a + 0.45) buzz += Math.sin((t - a) * 70) * (1 - (t - a) / 0.45) * 1.4; });
  const ry = mix(-22, 16, mv) + Math.sin(ph) * 3, rx = 6 + Math.cos(ph) * 2;
  css($("#ph"), { opacity: inn * (1 - out), transform: "translateX(" + (-mv * 290) + "px) translateY(" + (Math.sin(ph * 2) * 6) + "px) translateZ(" + ((1 - inn) * -500 - out * 300) + "px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) rotateZ(" + buzz.toFixed(2) + "deg)", filter: "blur(" + ((1 - inn) * 8 + out * 6).toFixed(2) + "px)" });
  [N1, N2].forEach((a, i) => { const r = P(t, a, 1.1, E.outCubic); css($("#rg" + i), { opacity: t < a ? 0 : 0.6 * (1 - r) * (1 - mv), transform: "scale(" + (1 + r * 0.22) + ")" }); });
  // powiadomienia: zjeżdżają z góry z rozmyciem, starsze przesuwa się w dół
  const n1 = t < N1 ? 0 : E.spring(clamp((t - N1) / 0.9), 7, 0.6), n2 = t < N2 ? 0 : E.spring(clamp((t - N2) / 0.9), 7, 0.6);
  const press = t >= TAP && t < TAP + 0.3 ? Math.sin(((t - TAP) / 0.3) * Math.PI) : 0;
  css($("#n1"), { opacity: clamp((t - N1) / 0.25), transform: "translateY(" + ((1 - n1) * -60 + n2 * 92) + "px) scale(" + (1 - n2 * 0.04) + ")", filter: "blur(" + (1 - Math.min(1, n1)) * 6 + "px)" });
  css($("#n2"), { opacity: clamp((t - N2) / 0.25), transform: "translateY(" + ((1 - n2) * -60) + "px) scale(" + (1 - press * 0.04) + ")", filter: "blur(" + (1 - Math.min(1, n2)) * 6 + "px)" });
  css($("#time"), { opacity: 1 - P(t, OPEN, 0.3, E.lin) });
  css($("#date"), { opacity: 1 - P(t, OPEN, 0.3, E.lin) });
  // dotknięcie
  const tv = P(t, TAP - 0.3, 0.2, E.lin) * (1 - P(t, TAP + 0.25, 0.2, E.lin));
  css($("#tap"), { left: "150px", top: "232px", opacity: tv, transform: "scale(" + (1 - press * 0.25) + ")" });
  // aplikacja: rozwija się z powiadomienia na cały ekran
  const op = P(t, OPEN, 0.7, E.inOutQuart);
  css($("#app"), { opacity: P(t, OPEN, 0.25, E.lin), clipPath: "inset(" + mix(178, 0, op) + "px " + mix(12, 0, op) + "px " + mix(360, 0, op) + "px " + mix(12, 0, op) + "px round " + mix(22, 46, op) + "px)" });
  am.forEach((el) => draw(el, P(t, OPEN + 0.4 + +el.dataset.s * 0.2, 0.9, E.inOutQuart)));
  const dp = t < OPEN + 1.1 ? 0 : E.outBack(clamp((t - OPEN - 1.1) / 0.5), 2.4); amd.setAttribute("transform", "scale(" + Math.max(0, dp) + ")");
  $("#bar i").style.width = P(t, OPEN + 0.9, 3.4, E.inOutCubic) * 92 + "%";
  // tekst obok
  side.forEach((el, i) => { const a = MOVE + 0.6 + i * 0.035, p = P(t, a, 1.0, E.outExpo); css(el, { opacity: clamp((t - a) / 0.35) * (1 - out), transform: "translateY(" + (1 - p) * 0.4 + "em)", filter: "blur(" + (1 - p) * 8 + "px)" }); });
  const sp = P(t, MOVE + 1.6, 1.0, E.outExpo); css($("#sp"), { opacity: sp * (1 - out), transform: "translateY(" + (1 - sp) * 12 + "px)" });
};`;
  return {
    id: "zapowiedz-nowa-strona-04-powiadomienie",
    title: "Powiadomienie — telefon dostaje wiadomość",
    description: "Telefon w 3D na ekranie blokady („Dzień premiery”, 9:41) dostaje powiadomienia od afto.works: „Coś się szykuje.” → „Nowa strona jest prawie gotowa”. Dotknięcie otwiera ekran startowy ze znakiem, telefon odjeżdża w bok, obok „Nowa strona. Już wkrótce.”",
    group: GROUP,
    w: W,
    h: H,
    duration: D,
    gifW: 960,
    gifH: 540,
    gifFps: 20,
    gifLossy: 14,
    still: 7.8,
    poster: true,
    keys: [0.6, 1.4, 2.8, 3.9, 4.6, 5.4, 6.6, 7.8],
    html: page({ w: W, h: H, style, body, script }),
  };
}

export const teasers = () => [szklo(), swiatlo(), kinetyka(), powiadomienie()];
