// „Coś nadchodzi” — 6 zapowiedzi 1280×720, każda w innym świecie: tło, ruch, kompozycja, kolor, typografia, tempo.
// + wersje banerowe 1500×500 trzech z nich. Wszystko jest czystą funkcją czasu t i zapętla się bez szwu.
import { MARK, geoSvg, page } from "./lib.mjs";

const GROUP = "Coś nadchodzi";
const markSvg = (size, opts = {}) => geoSvg(MARK, opts).replace("<svg", `<svg width="${size}" height="${size}"`);
// litery w spanach (słowa nie łamią się)
const chars = (text, cls = "ch") =>
  text
    .split(" ")
    .map((w) => `<span style="display:inline-block;white-space:nowrap">${[...w].map((c) => `<span class="${cls}" style="display:inline-block">${c}</span>`).join("")}</span>`)
    .join(" ");

// deterministyczny generator liczb (ten sam przy każdym renderze)
const RNG = `function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}`;

const base = (o) => ({ group: GROUP, gifFps: 25, poster: true, ...o });

/* ===================================================================================
   01 · Płynny chrom — opalizujące metaliczne krople za matowym szkłem
   =================================================================================== */
function chrom({ w, h }) {
  const D = 8;
  const banner = w / h > 2.5;
  const s = Math.min(w / 1280, h / 720);
  const R = (v) => Math.round(v * (banner ? 0.95 : 1) * Math.max(s, 0.7));
  const blobs = [
    [0.27, 0.42, 250, "#7c3aed", 120, 60, 1, 1, 0.0],
    [0.62, 0.32, 200, "#ff2bd6", 150, 80, 1, -1, 1.7],
    [0.74, 0.7, 230, "#2563ff", 110, 70, -1, 1, 3.1],
    [0.45, 0.74, 140, "#00e5ff", 160, 50, 1, 2, 4.2],
    [0.16, 0.76, 160, "#ff5fb8", 90, 60, 2, 1, 2.4],
    [0.88, 0.24, 170, "#5b21ff", 80, 90, -1, -1, 5.0],
    [0.5, 0.2, 90, "#ff7af0", 220, 40, 1, 1, 0.8],
    [0.36, 0.18, 70, "#38bdf8", 180, 60, -2, 1, 2.2],
    [0.92, 0.82, 110, "#a855f7", 70, 80, 1, -1, 3.8],
  ];
  const cardW = banner ? 980 : 800;
  const cardH = banner ? 330 : 400;
  const fs = banner ? 132 : 124;
  const style = `
#bg{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 40%,#2a0a52 0%,#12041f 55%,#06010c 100%)}
#liq{position:absolute;inset:0}
#card{position:absolute;left:${(w - cardW) / 2}px;top:${(h - cardH) / 2}px;width:${cardW}px;height:${cardH}px;border-radius:40px;overflow:hidden;
  background:linear-gradient(150deg,rgba(255,255,255,.16),rgba(40,0,90,.22) 50%,rgba(20,0,60,.3));
  backdrop-filter:blur(34px) saturate(170%) brightness(.92);
  box-shadow:inset 0 1.5px 0 rgba(255,255,255,.55),inset 0 0 0 1px rgba(255,255,255,.22),inset 0 -30px 60px -40px rgba(255,255,255,.25),0 50px 120px -30px rgba(20,0,60,.75)}
#card::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent calc(var(--s,-40%) - 18%),rgba(255,255,255,.28) var(--s,-40%),transparent calc(var(--s,-40%) + 18%));mix-blend-mode:overlay}
#top{position:absolute;left:44px;right:44px;top:34px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:19px;font-weight:500}
#top .b{display:flex;align-items:center;gap:12px}
#top .p{height:34px;padding:0 16px;border-radius:999px;display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);font-size:15px}
#top .p i{width:7px;height:7px;border-radius:50%;background:#fff;box-shadow:0 0 10px #fff}
#hl{position:absolute;left:0;right:0;top:${banner ? 104 : 136}px;text-align:center;color:#fff;font-size:${fs}px;font-weight:600;letter-spacing:-.05em;line-height:1;text-shadow:0 6px 40px rgba(40,0,90,.55),0 1px 2px rgba(40,0,90,.35)}
#sub{position:absolute;left:0;right:0;bottom:${banner ? 34 : 44}px;text-align:center;color:rgba(255,255,255,.95);font-weight:500;text-shadow:0 2px 14px rgba(40,0,90,.6);font-size:${banner ? 21 : 22}px;letter-spacing:-.005em}
`;
  const body = `<div id="bg"></div>
<svg id="liq" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="goo" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${R(34)}" result="b"/>
      <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -11" result="g"/>
      <feGaussianBlur in="g" stdDeviation="${R(9)}" result="gb"/>
      <feSpecularLighting in="gb" surfaceScale="${R(10)}" specularConstant=".95" specularExponent="38" lighting-color="#ffffff" result="sp"><fePointLight id="lt" x="${w * 0.3}" y="${h * 0.2}" z="${R(380)}"/></feSpecularLighting>
      <feComposite in="sp" in2="g" operator="in" result="spi"/>
      <feComposite in="g" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0"/>
    </filter>
  </defs>
  <g filter="url(#goo)">${blobs.map((b, i) => `<circle id="b${i}" r="${R(b[2])}" fill="${b[3]}"/>`).join("")}</g>
</svg>
<div id="c" class="abs" style="inset:0">
  <div id="card">
    <div id="top"><span class="b">${markSvg(30, { ink: "#ffffff", accent: "#ffffff" })}afto.works</span><span class="p"><i></i>Zapowiedź</span></div>
    <div id="hl">${chars("Coś nadchodzi.")}</div>
    <div id="sub">Nowy projekt od afto. — szczegóły już wkrótce</div>
  </div>
</div>`;
  const script = `
const B = ${JSON.stringify(blobs.map(([x, y, , , ax, ay, kx, ky, ph]) => [x * w, y * h, ax * (banner ? 1.4 : 1), ay, kx, ky, ph]))};
const els = B.map((_, i) => $("#b" + i)), hl = $$("#hl .ch");
window.__render = (t) => {
  const ph = (t / ${D}) * Math.PI * 2;
  B.forEach(([x, y, ax, ay, kx, ky, p], i) => { els[i].setAttribute("cx", (x + Math.sin(ph * kx + p) * ax).toFixed(1)); els[i].setAttribute("cy", (y + Math.cos(ph * ky + p * 1.3) * ay).toFixed(1)); });
  $("#lt").setAttribute("x", (${w / 2} + Math.cos(ph) * ${w * 0.35}).toFixed(1)); $("#lt").setAttribute("y", (${h * 0.3} + Math.sin(ph) * ${h * 0.2}).toFixed(1));
  // szkło: wynurza się, potem rozpływa na końcu pętli
  const inn = P(t, 0.5, 1.4, E.outExpo), out = P(t, ${D} - 1.0, 0.85, E.inOutCubic);
  const card = $("#card");
  css(card, { opacity: inn * (1 - out), transform: "translateY(" + ((1 - inn) * 40 + out * -20) + "px) scale(" + (0.94 + 0.06 * inn + out * 0.04) + ") rotateX(" + (Math.sin(ph) * 2).toFixed(2) + "deg)", filter: "blur(" + ((1 - inn) * 12 + out * 14).toFixed(1) + "px)" });
  card.style.setProperty("--s", (-40 + 180 * P(t, 2.6, 1.8, E.inOutSine)).toFixed(1) + "%");
  // litery: elastycznie, jak krople
  hl.forEach((el, i) => { const a = 1.1 + i * 0.05, k = t < a ? 0 : E.spring(clamp((t - a) / 1.1), 7.5, 0.38); css(el, { opacity: clamp((t - a) / 0.2), transform: "translateY(" + ((1 - k) * 0.35).toFixed(3) + "em) scale(" + (0.3 + 0.7 * k).toFixed(3) + ")", filter: "blur(" + (Math.max(0, 1 - k) * 8).toFixed(1) + "px)" }); });
  const sb = P(t, 2.1, 1.0, E.outExpo); css($("#sub"), { opacity: sb, transform: "translateY(" + (1 - sb) * 12 + "px)" });
  $("#top").style.opacity = P(t, 1.0, 0.8);
};`;
  return base({
    id: banner ? "zapowiedz-01-chrom-1500x500" : "zapowiedz-01-chrom",
    title: banner ? "Płynny chrom — baner 1500 × 500" : "Płynny chrom",
    description: "Opalizujące krople płynnego metalu (fiolet, magenta, elektryczny błękit) łączą się i rozdzielają za matowym szkłem; hasło „Coś nadchodzi.” wskakuje elastycznie litera po literze.",
    w,
    h,
    duration: D,
    gifW: banner ? w : 960,
    gifH: banner ? h : 540,
    gifLossy: banner ? 24 : 18,
    // baner: płynny metal zmienia prawie cały kadr — 20 kl./s utrzymuje GIF < 12 MB bez utraty jakości
    ...(banner ? { gifFps: 20 } : {}),
    crf: 17,
    still: 4.4,
    keys: [0.3, 1.2, 1.7, 2.5, 3.4, 4.6, 6.0, 7.5],
    html: page({ w, h, style, body, script }),
  });
}

/* ===================================================================================
   02 · Zorza — wstęgi zorzy polarnej nad górami i jeziorem, wolno i filmowo
   =================================================================================== */
function zorza({ w, h }) {
  const D = 10;
  const banner = w / h > 2.5;
  const hz = Math.round(h * (banner ? 0.74 : 0.7)); // linia horyzontu (tafla jeziora)
  const style = `
#sky{position:absolute;inset:0;background:linear-gradient(to bottom,#010309 0%,#020a16 45%,#04202a ${(hz / h) * 100}%,#010407 100%)}
#cv{position:absolute;inset:0}
#mt{position:absolute;left:0;top:0}
#t{position:absolute;left:0;right:0;top:${banner ? h * 0.27 : h * 0.31}px;text-align:center;color:#effff9;font-weight:300;font-size:${banner ? 96 : 104}px;line-height:1;text-transform:uppercase;white-space:nowrap}
#t span{display:inline-block}
#st{position:absolute;left:0;right:0;top:${banner ? h * 0.27 + 128 : h * 0.31 + 140}px;text-align:center;color:rgba(225,255,245,.78);font-size:${banner ? 23 : 24}px;letter-spacing:.02em}
#ft{position:absolute;left:0;right:0;top:${hz + (h - hz) / 2 - 15}px;display:flex;justify-content:center;align-items:center;gap:14px;color:rgba(225,255,245,.8);font-size:16px;letter-spacing:.32em;text-transform:uppercase}
`;
  const mountain = (seed, yb, amp, col, n) => {
    let a = seed;
    const r = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([(i / n) * (w + 200) - 100, yb - r() * amp - (i % 2) * amp * 0.25]);
    return `<path d="M-100 ${hz}L${pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}L${w + 100} ${hz}Z" fill="${col}"/>`;
  };
  const body = `<div id="sky"></div><canvas id="cv" width="${w}" height="${h}"></canvas>
<svg id="mt" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <g id="m1">${mountain(17, hz - 6, h * 0.16, "#04141a", 18)}</g>
  <g id="m2">${mountain(91, hz + 2, h * 0.09, "#010508", 26)}</g>
</svg>
<div id="c" class="abs" style="inset:0">
  <div id="t">${[..."Wkrótce"].map((c) => `<span>${c}</span>`).join("")}</div>
  <div id="st">Nowe światło na horyzoncie.</div>
  <div id="ft">${markSvg(26, { ink: "#effff9", accent: "#3dffb0" })}<span>afto.works</span></div>
</div>`;
  const script = `${RNG}
const W = ${w}, H = ${h}, HZ = ${hz}, D = ${D};
const cv = $("#cv"), ctx = cv.getContext("2d");
const off = document.createElement("canvas"); off.width = W; off.height = HZ; const o = off.getContext("2d");
const R = rng(5);
const stars = Array.from({ length: ${banner ? 260 : 240} }, () => [R() * W, Math.pow(R(), 1.3) * HZ * 0.95, 0.4 + R() * 1.3, 0.25 + R() * 0.75, 1 + Math.floor(R() * 3), R() * 6.28]);
// wstęgi: [podstawa y, wys., f1, f2, faza, kolory dół/środek/góra]
const RIB = [
  [HZ * 0.62, HZ * 0.42, 0.0042, 0.011, 0.0, ["61,255,176", "0,214,255", "160,92,255"]],
  [HZ * 0.48, HZ * 0.36, 0.0031, 0.0083, 2.1, ["40,255,140", "0,180,255", "214,92,255"]],
  [HZ * 0.72, HZ * 0.3, 0.0057, 0.0124, 4.0, ["120,255,210", "60,120,255", "255,80,200"]],
];
window.__render = (t) => {
  const ph = (t / D) * Math.PI * 2;
  ctx.clearRect(0, 0, W, H);
  // gwiazdy (migotanie okresowe) + spadająca gwiazda raz na pętlę
  stars.forEach(([x, y, s, a, k, p]) => { ctx.globalAlpha = a * (0.55 + 0.45 * Math.sin(ph * k + p)); ctx.fillStyle = "#e9fbff"; ctx.fillRect(x, y, s, s); });
  ctx.globalAlpha = 1;
  const sh = P(t, 6.1, 0.7, E.inCubic);
  if (t > 6.1 && t < 6.85) { const x0 = W * 0.78 - sh * W * 0.3, y0 = HZ * 0.12 + sh * HZ * 0.16; const g = ctx.createLinearGradient(x0, y0, x0 + 140, y0 - 70); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.globalAlpha = Math.sin(sh * Math.PI); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 140, y0 - 70); ctx.stroke(); ctx.globalAlpha = 1; }
  // zorza
  o.clearRect(0, 0, W, HZ); o.globalCompositeOperation = "lighter";
  RIB.forEach(([yb, hh, f1, f2, p0, [c0, c1, c2]], r) => {
    for (let x = -30; x < W + 30; x += 3) {
      const y = yb + Math.sin(x * f1 + ph + p0) * HZ * 0.08 + Math.sin(x * f2 - ph * 2 + p0 * 1.7) * HZ * 0.035;
      const hgt = hh * (0.55 + 0.45 * Math.sin(x * f2 * 0.6 + ph + p0 * 2));
      const it = Math.pow(0.5 + 0.5 * Math.sin(x * f1 * 2.3 - ph + p0), 1.6) * (r === 1 ? 0.8 : 1);
      const g = o.createLinearGradient(0, y, 0, y - hgt);
      g.addColorStop(0, "rgba(" + c0 + "," + (0.0).toFixed(2) + ")");
      g.addColorStop(0.06, "rgba(" + c0 + "," + (0.85 * it).toFixed(3) + ")");
      g.addColorStop(0.35, "rgba(" + c1 + "," + (0.42 * it).toFixed(3) + ")");
      g.addColorStop(0.75, "rgba(" + c2 + "," + (0.22 * it).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + c2 + ",0)");
      o.fillStyle = g; o.fillRect(x, y - hgt, 3, hgt + 2);
    }
  });
  const rise = 0.55 + 0.45 * P(t, 0, 2.5, E.inOutSine) * (1 - P(t, D - 1.6, 1.6, E.inOutSine));
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = "blur(10px)"; ctx.globalAlpha = 0.95 * rise; ctx.drawImage(off, 0, Math.sin(ph) * 6);
  ctx.filter = "blur(2px)"; ctx.globalAlpha = 0.55 * rise; ctx.drawImage(off, 0, Math.sin(ph) * 6);
  ctx.filter = "none"; ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  // odbicie w jeziorze
  ctx.save(); ctx.translate(0, HZ * 2); ctx.scale(1, -1); ctx.globalAlpha = 0.5; ctx.filter = "blur(4px)"; ctx.drawImage(cv, 0, 0, W, HZ, 0, 0, W, HZ); ctx.restore();
  ctx.filter = "none"; ctx.globalAlpha = 1;
  const lake = ctx.createLinearGradient(0, HZ, 0, H); lake.addColorStop(0, "rgba(1,6,10,.15)"); lake.addColorStop(1, "rgba(1,4,7,.8)"); ctx.fillStyle = lake; ctx.fillRect(0, HZ, W, H - HZ);
  // delikatne fale na tafli
  for (let y = HZ + 4; y < H; y += 7) { ctx.globalAlpha = 0.05 + 0.05 * Math.sin(y * 0.3 + ph * 3); ctx.fillStyle = "#7fffe0"; ctx.fillRect(0, y, W, 1); }
  ctx.globalAlpha = 1;
  $("#m1").setAttribute("transform", "translate(" + (Math.sin(ph) * 8).toFixed(1) + " 0)");
  $("#m2").setAttribute("transform", "translate(" + (Math.sin(ph) * 16).toFixed(1) + " 0)");
  // napis: litery schodzą się z szerokiego światła (rozstrzelenie maleje), bardzo wolno
  const tin = P(t, 1.8, 3.2, E.outCubic), tout = P(t, D - 1.5, 1.2, E.inOutCubic);
  css($("#t"), { letterSpacing: (0.95 - 0.6 * tin + tout * 0.25).toFixed(3) + "em", opacity: P(t, 1.8, 2.0, E.inOutSine) * (1 - tout), textShadow: "0 0 " + (30 + 20 * Math.sin(ph * 2)).toFixed(1) + "px rgba(61,255,176,.55),0 0 90px rgba(120,80,255,.35)", paddingLeft: (0.95 - 0.6 * tin + tout * 0.25).toFixed(3) + "em" });
  const sp = P(t, 3.6, 1.8, E.inOutSine); css($("#st"), { opacity: sp * (1 - tout), transform: "translateY(" + (1 - sp) * 10 + "px)" });
  css($("#ft"), { opacity: P(t, 4.2, 1.6, E.inOutSine) * (1 - tout) });
};`;
  return base({
    id: banner ? "zapowiedz-02-zorza-1500x500" : "zapowiedz-02-zorza",
    title: banner ? "Zorza — baner 1500 × 500" : "Zorza",
    description: "Szmaragdowo-turkusowo-fioletowe wstęgi zorzy płyną nad gwiaździstym niebem i odbijają się w jeziorze; spadająca gwiazda, a „WKRÓTCE” wyłania się bardzo wolno z szerokiego rozstrzelenia. „Nowe światło na horyzoncie.”",
    w,
    h,
    duration: D,
    gifW: banner ? w : 960,
    gifH: banner ? h : 540,
    gifLossy: banner ? 28 : 22,
    crf: 18,
    still: 5.6,
    keys: [0.5, 1.8, 3.0, 4.2, 5.6, 6.4, 7.6, 9.6],
    html: page({ w, h, style, body, script }),
  });
}

/* ===================================================================================
   03 · Neon / synth — siatka w perspektywie, słońce, linie skanowania, cięcia z glitchem
   =================================================================================== */
function neon({ w, h }) {
  const D = 8;
  const banner = w / h > 2.5;
  const hz = Math.round(h * (banner ? 0.6 : 0.56));
  const big = banner ? 210 : 250;
  const style = `
#sky{position:absolute;inset:0;background:linear-gradient(to bottom,#07000f 0%,#1a0033 ${(hz / h) * 60}%,#5c0050 ${(hz / h) * 100 - 1}%,#0a0012 ${(hz / h) * 100}%,#05000b 100%)}
#sun{position:absolute;left:50%;top:${hz - (banner ? 250 : 210)}px;width:${banner ? 400 : 360}px;height:${banner ? 400 : 360}px;margin-left:${banner ? -200 : -180}px;border-radius:50%;
  background:linear-gradient(to bottom,#ffe14d 0%,#ff9a3d 35%,#ff2e97 70%,#b100ff 100%);
  -webkit-mask-image:linear-gradient(to bottom,#000 0 46%,transparent 46% 50%,#000 50% 60%,transparent 60% 64.5%,#000 64.5% 73%,transparent 73% 78.5%,#000 78.5% 85%,transparent 85% 91%,#000 91%);
  filter:drop-shadow(0 0 40px rgba(255,46,151,.8))}
#cv{position:absolute;inset:0}
#scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);mix-blend-mode:multiply}
#vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 80% at 50% 50%,transparent 55%,rgba(0,0,0,.7))}
.cd{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
.cond{display:inline-block;transform:skewX(-9deg) scaleX(.8);font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:.86;white-space:nowrap}
.chrome{background:linear-gradient(to bottom,#ffffff 0%,#d9f6ff 38%,#00e5ff 49%,#ff2e97 51%,#ffb3e0 70%,#7a00ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(255,46,151,.55))}
.outl{color:transparent;-webkit-text-stroke:2px #ff2e97;filter:drop-shadow(0 0 10px rgba(255,46,151,.8))}
#c3 .stack{position:relative}
#c3 .echo{position:absolute;left:0;right:0;top:0}
#neonmark{filter:drop-shadow(0 0 8px #00f0ff) drop-shadow(0 0 22px #00f0ff)}
#nm .t{font-size:${banner ? 86 : 96}px;font-weight:300;color:#ffe9f6;letter-spacing:-.02em;text-shadow:0 0 6px #ff2e97,0 0 18px #ff2e97,0 0 42px #ff2e97}
#badge{margin-top:26px;display:inline-block;padding:10px 18px;background:#00f0ff;color:#08000f;font-weight:900;font-size:24px;letter-spacing:.24em;text-transform:uppercase;box-shadow:0 0 30px rgba(0,240,255,.8)}
#corner{position:absolute;left:44px;top:34px;color:#00f0ff;font-size:16px;letter-spacing:.3em;text-transform:uppercase;text-shadow:0 0 10px #00f0ff}
#corner2{position:absolute;right:44px;top:34px;color:#ff2e97;font-size:16px;letter-spacing:.3em;text-shadow:0 0 10px #ff2e97;font-variant-numeric:tabular-nums}
`;
  const body = `<div id="sky"></div><div id="sunwrap" style="position:absolute;left:0;right:0;top:0;height:${hz}px;overflow:hidden"><div id="sun"></div></div><canvas id="cv" width="${w}" height="${h}"></canvas>
<div id="c" class="abs" style="inset:0">
  <div class="cd" id="c1"><span class="cond chrome" style="font-size:${big}px">Nowy</span></div>
  <div class="cd" id="c2"><span class="cond chrome" style="font-size:${big * 0.86}px">Rozdział</span></div>
  <div class="cd" id="c3"><div class="stack">${[3, 2, 1].map((k) => `<div class="echo" data-k="${k}" style="text-align:center"><span class="cond outl" style="font-size:${big * 0.72}px">Nowy<br>rozdział</span></div>`).join("")}<div style="position:relative;text-align:center"><span class="cond chrome" style="font-size:${big * 0.72}px">Nowy<br>rozdział</span></div></div></div>
  <div class="cd" id="c4"><div id="nm" style="display:flex;align-items:center;gap:30px">${markSvg(banner ? 110 : 124, { id: "neonmark", ink: "#9ff8ff", accent: "#ff2e97" })}<span class="t">afto.works</span></div><span id="badge">Wkrótce</span></div>
  <div id="corner">afto.works</div><div id="corner2">REC ● <span id="tc">00:00</span></div>
</div>
<div id="scan"></div><div id="vig"></div>`;
  const script = `
const W = ${w}, H = ${h}, HZ = ${hz}, D = ${D};
const cv = $("#cv"), ctx = cv.getContext("2d");
// cięcia montażowe co takt (120 BPM)
const CUTS = [0.5, 1.5, 2.5, 4.5, 7.3];
const cards = [$("#c1"), $("#c2"), $("#c3"), $("#c4")];
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
window.__render = (t) => {
  const ph = (t / D) * Math.PI * 2, fr = Math.round(t * 30);
  ctx.clearRect(0, 0, W, H);
  // siatka podłogi: linie poziome płyną do widza (16 przejść na pętlę)
  const ground = H - HZ, rate = 16 / D, phs = (t * rate) % 1;
  ctx.lineWidth = 2;
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? "rgba(140,250,255,.95)" : "rgba(0,240,255,.35)"; ctx.lineWidth = pass ? 1.4 : 6;
    ctx.beginPath();
    for (let j = 0; j < 26; j++) { const z = j + 1 - phs; const y = HZ + ground * (1.1 / z); if (y > H + 4) continue; ctx.moveTo(0, y); ctx.lineTo(W, y); }
    for (let i = -24; i <= 24; i++) { ctx.moveTo(W / 2 + i * 6, HZ); ctx.lineTo(W / 2 + i * W * 0.11, H + ground * 0.4); }
    ctx.stroke();
  }
  const hg = ctx.createLinearGradient(0, HZ - 30, 0, HZ + 60); hg.addColorStop(0, "rgba(255,46,151,0)"); hg.addColorStop(0.4, "rgba(255,46,151,.55)"); hg.addColorStop(1, "rgba(255,46,151,0)"); ctx.fillStyle = hg; ctx.fillRect(0, HZ - 30, W, 90);
  // zachód słońca przy neonowym znaku, wschód w pustej końcówce pętli
  const set = P(t, 4.4, 1.3, E.inOutCubic) * (1 - P(t, 7.25, 0.75, E.inOutCubic));
  $("#sun").style.transform = "translateY(" + (set * ${banner ? 170 : 150} + Math.sin(ph) * 4).toFixed(1) + "px)";
  // która plansza
  let idx = -1; for (let i = 0; i < 4; i++) if (t >= CUTS[i] && t < CUTS[i + 1]) idx = i;
  let g = 0; CUTS.forEach((c) => { const d = Math.abs(t - c); if (d < 0.14) g = Math.max(g, 1 - d / 0.14); });
  cards.forEach((el, i) => {
    if (i !== idx) { el.style.opacity = 0; return; }
    const local = t - CUTS[i];
    // glitch: przesunięcie warstw RGB + pocięcie na paski
    const gx = g * (hash(fr) * 2 - 1) * 26;
    const sl = g > 0.05 ? "polygon(" + Array.from({ length: 6 }, (_, k) => { const y0 = k * 16.6, y1 = y0 + 16.6, dx = (hash(fr * 7 + k) * 2 - 1) * g * 8; return (dx) + "% " + y0 + "%," + (100 + dx) + "% " + y0 + "%," + (100 + dx) + "% " + y1 + "%," + dx + "% " + y1 + "%"; }).join(",") + ")" : "none";
    css(el, { opacity: 1, transform: "translateX(" + gx.toFixed(1) + "px) scale(" + (1 + 0.04 * Math.exp(-local * 3)) + ")", clipPath: sl, filter: g > 0.05 ? "drop-shadow(" + (-10 * g).toFixed(1) + "px 0 rgba(0,240,255,.9)) drop-shadow(" + (10 * g).toFixed(1) + "px 0 rgba(255,46,151,.9))" : "none" });
  });
  // echo napisu w planszy 3
  $$("#c3 .echo").forEach((e) => { const k = +e.dataset.k, p = P(t, 2.55 + k * 0.08, 0.6, E.outCubic); css(e, { transform: "translateY(" + (k * 22 * p).toFixed(1) + "px)", opacity: (0.9 - k * 0.25) * p }); });
  // neon: mruga przy zapaleniu
  const on = t > 4.5 ? (t < 4.95 ? (hash(fr * 3) > 0.45 ? 1 : 0.25) : 0.92 + 0.08 * Math.sin(t * 40)) : 0;
  $("#nm").style.opacity = on;
  $("#badge").style.opacity = t > 5.3 ? (Math.floor((t - 5.3) * 2) % 2 ? 0.35 : 1) : 0;
  const s = Math.floor(t), f = Math.floor((t % 1) * 30); $("#tc").textContent = "00:0" + s + ":" + String(f).padStart(2, "0");
};`;
  return base({
    id: banner ? "zapowiedz-03-neon-1500x500" : "zapowiedz-03-neon",
    title: banner ? "Neon / synth — baner 1500 × 500" : "Neon / synth",
    description: "Retro synth: różowo-cyjanowa siatka pędzi do widza pod pociętym słońcem, linie skanowania; twarde cięcia w takt z glitchem RGB — „NOWY” → „ROZDZIAŁ” → chromowane „NOWY ROZDZIAŁ” z echem → neonowy znak af. i migające „WKRÓTCE”.",
    w,
    h,
    duration: D,
    gifW: banner ? w : 960,
    gifH: banner ? h : 540,
    gifLossy: 20,
    crf: 18,
    still: 6.5, // plakietka „WKRÓTCE” w jasnej fazie mrugania
    keys: [0.3, 0.8, 1.6, 2.6, 3.6, 4.6, 5.6, 6.6],
    html: page({ w, h, style, body, script }),
  });
}

/* ===================================================================================
   04 · Druk / edytorial — kremowy papier, pomarańcz i czerń, rastry, maski, pieczątka
   =================================================================================== */
function druk() {
  const w = 1280;
  const h = 720;
  const D = 8.5;
  const OR = "#ff4d12";
  const INK = "#17110c";
  const style = `
#paper{position:absolute;inset:0;background:#f3e8d3}
#paper::after{content:"";position:absolute;inset:0;opacity:.5;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .45 0 0 0 0 .35 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.ink{color:${INK}}
.rule{position:absolute;height:1.5px;background:${INK};transform-origin:0 50%}
#bar{position:absolute;left:56px;right:56px;top:34px;display:flex;justify-content:space-between;font-size:15px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${INK}}
#bar span{display:inline-block}
.big{position:absolute;left:50px;font-weight:800;letter-spacing:-.065em;line-height:.82;white-space:nowrap}
.mk{position:relative;display:inline-block;overflow:hidden;padding:0 .04em .1em 0}
.mk .tx{display:inline-block}
.mk .blk{position:absolute;inset:0 0 .06em 0;background:${OR};transform-origin:0 50%}
#ht{position:absolute;left:868px;top:104px;width:330px;height:330px;border-radius:50%;
  background:radial-gradient(circle at center,${OR} 0 4.4px,transparent 4.9px) 0 0/12px 12px;
  -webkit-mask-image:radial-gradient(circle at 36% 34%,#000 0 38%,rgba(0,0,0,.8) 58%,rgba(0,0,0,.45) 72%,transparent 72.5%)}
#htc{position:absolute;left:868px;top:104px;width:330px;height:330px;border-radius:50%;border:1.5px solid ${INK}}
#stamp{position:absolute;left:1086px;top:330px;width:150px;height:150px}
#col{position:absolute;left:916px;top:478px;width:300px;font-size:17px;line-height:1.45;color:${INK}}
#col p{overflow:hidden}
#col p span{display:block}
#foot{position:absolute;left:56px;right:56px;top:652px;display:flex;justify-content:space-between;align-items:center;color:${INK}}
#foot .l{font-size:26px;font-weight:700;letter-spacing:-.02em}
#foot .r{display:flex;align-items:center;gap:16px;font-size:15px;font-weight:600;letter-spacing:.14em}
#wipe{position:absolute;top:0;bottom:0;left:0;width:100%;background:${OR};transform-origin:0 50%}
.reg{position:absolute;width:22px;height:22px}
`;
  const reg = (x, y) => `<svg class="reg" style="left:${x - 11}px;top:${y - 11}px" viewBox="0 0 22 22" fill="none" stroke="${INK}" stroke-width="1"><circle cx="11" cy="11" r="6"/><path d="M11 0v22M0 11h22"/></svg>`;
  const body = `<div id="paper"></div>
<div id="c" class="abs" style="inset:0">
  <div id="bar"><span id="b1">afto.works</span><span id="b2">Zapowiedź — Nr 01</span><span id="b3">Wydanie specjalne</span></div>
  <div class="rule" id="r1" style="left:56px;right:56px;top:66px"></div>
  <div class="big ink" id="L1" style="top:96px;font-size:268px"><span class="mk"><span class="tx">Nowy</span><span class="blk"></span></span></div>
  <div class="big" id="L2" style="top:318px;font-size:268px;color:${OR}"><span class="mk"><span class="tx">projekt<span style="color:${INK}">.</span></span><span class="blk" style="background:${INK}"></span></span></div>
  <div id="ht"></div><div id="htc"></div>
  <svg id="stamp" viewBox="0 0 150 150"><defs><path id="cp" d="M75 75m-56 0a56 56 0 1 1 112 0a56 56 0 1 1 -112 0"/></defs>
    <circle cx="75" cy="75" r="72" fill="${INK}"/><g id="ring"><text font-family="Satoshi" font-weight="700" font-size="15" letter-spacing="3.1" fill="#f3e8d3"><textPath href="#cp">WKRÓTCE • WKRÓTCE • WKRÓTCE •</textPath></text></g>
    <svg x="49" y="48" width="52" height="52" viewBox="${MARK.viewBox}" fill="none">${geoSvg(MARK, { ink: "#f3e8d3", accent: OR }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg></svg>
  <div id="col"><p><span>Pracujemy nad czymś nowym.</span></p><p><span>Premiera wkrótce — szczegóły</span></p><p><span>pokażemy jako pierwsi tutaj.</span></p></div>
  <div class="rule" id="r2" style="left:56px;right:56px;top:630px"></div>
  <div id="foot"><span class="l" id="fl">Premiera wkrótce.</span><span class="r" id="fr">${markSvg(30, { ink: INK, accent: OR })}<span>01 / 01</span></span></div>
  ${reg(28, 20)}${reg(1252, 20)}${reg(28, 700)}${reg(1252, 700)}
</div>
<div id="wipe"></div>`;
  const script = `
const D = ${D};
const Q = (t, a, d) => P(t, a, d, E.outQuart);
// maska edytorska: blok wjeżdża z lewej, zakrywa, zjeżdża w prawo odsłaniając tekst
function mask(el, t, a) { const blk = el.querySelector(".blk"), tx = el.querySelector(".tx"); const p1 = P(t, a, 0.32, E.inOutQuart), p2 = P(t, a + 0.36, 0.32, E.inOutQuart); blk.style.transformOrigin = p1 < 1 ? "0 50%" : "100% 50%"; blk.style.transform = "scaleX(" + (p1 < 1 ? p1 : 1 - p2) + ")"; tx.style.opacity = t >= a + 0.33 ? 1 : 0; }
window.__render = (t) => {
  ["#b1", "#b2", "#b3"].forEach((s, i) => { const p = Q(t, 0.25 + i * 0.08, 0.35); css($(s), { opacity: p, transform: "translateY(" + (1 - p) * -10 + "px)" }); });
  $("#r1").style.transform = "scaleX(" + Q(t, 0.15, 0.6) + ")"; $("#r2").style.transform = "scaleX(" + Q(t, 0.3, 0.6) + ")";
  mask($("#L1 .mk"), t, 0.55); mask($("#L2 .mk"), t, 0.95);
  // raster rośnie i powoli się obraca; pieczątka kręci się (1 obrót na pętlę)
  const hp = P(t, 1.6, 0.7, E.outBack); css($("#ht"), { transform: "scale(" + hp + ") rotate(" + (t / D) * 90 + "deg)" });
  css($("#htc"), { opacity: Q(t, 1.75, 0.3), transform: "scale(" + (0.9 + 0.1 * Q(t, 1.75, 0.4)) + ")" });
  const sp = P(t, 2.3, 0.45, E.outBack); css($("#stamp"), { transform: "scale(" + sp + ") rotate(" + (-30 * (1 - sp)) + "deg)" });
  $("#ring").setAttribute("transform", "rotate(" + ((t / D) * 360).toFixed(2) + " 75 75)");
  $$("#col span").forEach((e, i) => { const p = Q(t, 2.6 + i * 0.12, 0.45); e.style.transform = "translateY(" + (1 - p) * 110 + "%)"; });
  css($("#fl"), { opacity: Q(t, 3.1, 0.3), transform: "translateX(" + (1 - Q(t, 3.1, 0.4)) * -20 + "px)" });
  css($("#fr"), { opacity: Q(t, 3.25, 0.3) });
  // przejście jak odwrócenie strony: pomarańczowa plansza przelatuje, zostaje pusta kartka
  const w1 = P(t, D - 0.95, 0.42, E.inOutQuart), w2 = P(t, D - 0.5, 0.42, E.inOutQuart);
  const wp = $("#wipe"); wp.style.transformOrigin = w1 < 1 ? "0 50%" : "100% 50%"; wp.style.transform = "scaleX(" + (w1 < 1 ? w1 : 1 - w2) + ")";
  $("#c").style.visibility = t > D - 0.55 ? "hidden" : "visible";
};`;
  return base({
    id: "zapowiedz-04-druk",
    title: "Druk / edytorial",
    description: "Jasna, drukowana estetyka: kremowy papier z fakturą, pomarańcz i czerń, ogromne „Nowy projekt.” odsłaniane blokowymi maskami, raster w kole, obracająca się pieczątka „WKRÓTCE” ze znakiem, kolumna tekstu; pętla zamyka się jak przewrócenie strony.",
    w,
    h,
    duration: D,
    gifW: 960,
    gifH: 540,
    gifLossy: 10,
    crf: 16,
    still: 5.2,
    keys: [0.4, 0.75, 1.15, 1.8, 2.6, 3.6, 5.2, 8.0],
    html: page({ w, h, style, body, script }),
  });
}

/* ===================================================================================
   05 · Cząsteczki — tysiące punktów składa się w znak af., wybucha i układa w napis
   =================================================================================== */
function czasteczki() {
  const w = 1280;
  const h = 720;
  const D = 9;
  const style = `
#bg{position:absolute;inset:0;background:radial-gradient(70% 70% at 50% 50%,#16081f 0%,#07040a 60%,#020203 100%)}
#cv{position:absolute;inset:0}
#lab{position:absolute;left:0;right:0;top:560px;text-align:center;font-size:18px;letter-spacing:.42em;text-transform:uppercase;color:#d8ff7a;padding-left:.42em}
#lab b{color:#b48cff;font-weight:500}
`;
  const body = `<div id="bg"></div><canvas id="cv" width="${w}" height="${h}"></canvas><div id="lab">afto<b>.</b>works</div>`;
  const script = `${RNG}
const W = ${w}, H = ${h}, D = ${D};
const cv = $("#cv"), ctx = cv.getContext("2d");
let PTS = null;
function sample(drawFn, step) {
  const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  drawFn(g); const d = g.getImageData(0, 0, W, H).data, out = [];
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) { const a = d[(y * W + x) * 4 + 3]; if (a > 128) out.push([x, y, d[(y * W + x) * 4] < 200 ? 1 : 0]); }
  return out;
}
function init() {
  // cele: znak af. (kropka oznaczona innym kolorem) i dwuwierszowy napis
  const mark = sample((g) => {
    const s = 8.6, ox = W / 2 - 22 * s, oy = H / 2 - 25 * s - 20;
    g.setTransform(s, 0, 0, s, ox, oy); g.lineWidth = 5; g.strokeStyle = "#fff";
    g.beginPath(); g.arc(${MARK.circles[0].cx}, ${MARK.circles[0].cy}, ${MARK.circles[0].r}, 0, Math.PI * 2); g.stroke();
    ${JSON.stringify(MARK.paths)}.forEach((d) => g.stroke(new Path2D(d)));
    g.fillStyle = "#c6ff3d"; g.fillRect(${MARK.dot.x}, ${MARK.dot.y}, ${MARK.dot.size}, ${MARK.dot.size});
  }, 4);
  const text = sample((g) => { g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "700 118px Satoshi"; g.fillText("Coś nowego", W / 2, 300); g.fillText("się szykuje", W / 2, 420); }, 4);
  const N = Math.max(mark.length, text.length), R = rng(11);
  const sh = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  sh(text);
  PTS = Array.from({ length: N }, (_, i) => {
    const m = mark[i % mark.length], tx = text[i % text.length];
    const ang = R() * Math.PI * 2, rad = 150 + Math.pow(R(), 1.6) * 330;
    return { m, tx, ang, rad, el: 0.5 + R() * 0.55, k: R() < 0.5 ? 1 : -1, wob: R() * 6.28, dl: R() * 0.5, lime: m[2] === 1 ? 1 : R() < 0.24 ? 1 : 0, s: 1.7 + R() * 1.8 };
  });
}
function swarm(p, t) { const ph = (t / D) * Math.PI * 2; const a = p.ang + ph * p.k; const r = p.rad * (1 + 0.12 * Math.sin(ph * 2 + p.wob)); return [W / 2 + Math.cos(a) * r * 1.35, H / 2 + Math.sin(a) * r * 0.62 * p.el]; }
window.__render = (t) => {
  if (!PTS) init();
  ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  const breath = 1 + 0.015 * Math.sin(t * 5);
  PTS.forEach((p) => {
    const [sx, sy] = swarm(p, t);
    const toM = P(t, 1.3 + p.dl, 1.5, E.inOutCubic), toT = P(t, 4.3 + p.dl * 0.6, 1.5, E.inOutQuart), back = P(t, 7.2 + p.dl * 0.5, 1.2, E.inOutCubic); // kończy się przed końcem pętli
    let x, y;
    if (t < 4.3 + p.dl * 0.6) { const mx = W / 2 + (p.m[0] - W / 2) * breath, my = H / 2 + (p.m[1] - H / 2) * breath; x = mix(sx, mx, toM); y = mix(sy, my, toM); }
    else if (t < 7.2 + p.dl * 0.5) {
      // wybuch: łuk na zewnątrz między znakiem a napisem
      const bx = p.m[0] + Math.cos(p.ang) * 260 * Math.sin(toT * Math.PI), by = p.m[1] + Math.sin(p.ang) * 200 * Math.sin(toT * Math.PI);
      x = mix(bx, p.tx[0], toT); y = mix(by, p.tx[1], toT);
    } else { x = mix(p.tx[0], sx, back); y = mix(p.tx[1], sy, back); }
    const settle = toM * (1 - toT) + toT * (1 - back);
    ctx.fillStyle = p.lime ? "rgba(198,255,61," + (0.75 + 0.25 * settle) + ")" : "rgba(160,96,255," + (0.8 + 0.2 * settle) + ")";
    const s = p.s * (0.9 + 0.3 * (1 - settle));
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
  });
  // poświata (bloom)
  ctx.filter = "blur(4px)"; ctx.globalAlpha = 0.9; ctx.drawImage(cv, 0, 0); ctx.filter = "blur(18px)"; ctx.globalAlpha = 0.8; ctx.drawImage(cv, 0, 0); ctx.filter = "none"; ctx.globalAlpha = 1;
  const l = P(t, 5.6, 0.9, E.outCubic) * (1 - P(t, 7.2, 0.6, E.inOutCubic));
  css($("#lab"), { opacity: l, letterSpacing: (0.42 + (1 - l) * 0.3).toFixed(3) + "em" });
};`;
  return base({
    id: "zapowiedz-05-czasteczki",
    title: "Cząsteczki",
    description: "Tysiące fioletowych i limonkowych cząsteczek krąży w roju, składa się w znak af. z limonkową kropką, wybucha łukiem i układa w napis „Coś nowego się szykuje”, po czym wraca do roju; z poświatą.",
    w,
    h,
    duration: D,
    gifW: 960,
    gifH: 540,
    gifLossy: 26,
    crf: 21,
    still: 6.4,
    keys: [0.6, 1.8, 2.8, 3.8, 4.8, 5.4, 6.4, 8.0],
    html: page({ w, h, style, body, script }),
  });
}

/* ===================================================================================
   06 · Warp — skok w nadprzestrzeń, odliczanie 3-2-1, błysk i „Już wkrótce.”
   =================================================================================== */
function warp() {
  const w = 1280;
  const h = 720;
  const D = 9;
  const style = `
#bg{position:absolute;inset:0;background:radial-gradient(60% 60% at 50% 50%,#0a1240 0%,#030616 55%,#01020a 100%)}
#cv{position:absolute;inset:0}
#num{position:absolute;inset:0;display:grid;place-items:center}
#num span{position:absolute;font-size:300px;font-weight:700;letter-spacing:-.04em;background:linear-gradient(to bottom,#ffffff,#9fc2ff 55%,#6f4cff);-webkit-background-clip:text;background-clip:text;color:transparent}
#flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#ffffff 0%,#cfe0ff 30%,rgba(120,150,255,.6) 60%,rgba(80,60,255,0) 100%);pointer-events:none}
#rev{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
#rev .hl{position:relative;font-size:150px;font-weight:700;letter-spacing:-.05em;line-height:1;white-space:nowrap}
#rev .hl span{position:absolute;left:0;top:0}
#rev .hl .w{position:relative;color:#fff}
#rev .hl .cy{color:#00d9ff;mix-blend-mode:screen}
#rev .hl .mg{color:#7c4dff;mix-blend-mode:screen}
#rev .sub{margin-top:26px;display:flex;align-items:center;gap:14px;font-size:20px;letter-spacing:.3em;text-transform:uppercase;color:#bcd3ff}
#rev .mk{margin-bottom:28px}
`;
  const body = `<div id="bg"></div><canvas id="cv" width="${w}" height="${h}"></canvas>
<div id="c" class="abs" style="inset:0">
  <div id="num"><span id="n3">3</span><span id="n2">2</span><span id="n1">1</span></div>
  <div id="rev"><div class="mk" id="rmk">${markSvg(84, { ink: "#ffffff", accent: "#4d8bff" })}</div>
    <div class="hl"><span class="cy">Już wkrótce.</span><span class="mg">Już wkrótce.</span><span class="w">Już wkrótce.</span></div>
    <div class="sub" id="rsub"><span>afto.works</span><span style="opacity:.5">·</span><span>coś nowego</span></div></div>
</div><div id="flash"></div>`;
  const script = `${RNG}
const W = ${w}, H = ${h}, D = ${D}, CX = W / 2, CY = H / 2;
const cv = $("#cv"), ctx = cv.getContext("2d");
const R = rng(23), N = 900, ZR = 1;
const stars = Array.from({ length: N }, () => { const a = R() * Math.PI * 2, r = 0.04 + Math.pow(R(), 0.6) * 1.2; return [Math.cos(a) * r, Math.sin(a) * r * 0.75, R(), R()]; });
// prędkość: rejs → skok (2.9–3.6 s) → hamowanie; całkowita droga = wielokrotność głębokości → bez szwu
const JUMP = 3.0;
const speed = (t) => 0.35 + 7.5 * Math.exp(-Math.pow((t - (JUMP + 0.3)) / 0.32, 2)) + 1.6 * Math.exp(-Math.pow((t - (JUMP + 0.9)) / 0.6, 2));
const STEPS = 2000; const cum = [0]; for (let i = 1; i <= STEPS; i++) { const t0 = ((i - 0.5) / STEPS) * D; cum.push(cum[i - 1] + speed(t0) * (D / STEPS)); }
const K = Math.round(cum[STEPS]) / cum[STEPS];
const dist = (t) => { const f = (t / D) * STEPS, i = Math.floor(f); return (cum[Math.min(i, STEPS)] + (cum[Math.min(i + 1, STEPS)] - cum[Math.min(i, STEPS)]) * (f - i)) * K; };
window.__render = (t) => {
  ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  const sp = speed(t) * K, d = dist(t), shake = Math.exp(-Math.max(0, t - JUMP - 0.5) * 3) * (t > JUMP + 0.5 ? 1 : 0);
  const sx = Math.sin(t * 90) * 6 * shake, sy = Math.cos(t * 77) * 4 * shake;
  stars.forEach(([x, y, z0, c]) => {
    let z = ((z0 - d) % ZR + ZR) % ZR; z = z * 0.98 + 0.02;
    const len = Math.min(0.5, sp * 0.03), z2 = Math.min(1, z + len);
    const f = 420;
    const x1 = CX + sx + (x / z) * f, y1 = CY + sy + (y / z) * f, x2 = CX + sx + (x / z2) * f, y2 = CY + sy + (y / z2) * f;
    if (x1 < -50 || x1 > W + 50 || y1 < -50 || y1 > H + 50) return;
    const a = Math.min(1, (1 - z) * 1.4);
    ctx.strokeStyle = c < 0.55 ? "rgba(61,123,255," + a + ")" : c < 0.85 ? "rgba(140,108,255," + a + ")" : "rgba(220,235,255," + a + ")";
    ctx.lineWidth = Math.max(0.6, (1 - z) * 3.2);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });
  // jasny środek tunelu
  const core = 0.25 + 0.75 * Math.exp(-Math.pow((t - JUMP - 0.3) / 0.35, 2));
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 340); g.addColorStop(0, "rgba(160,190,255," + 0.55 * core + ")"); g.addColorStop(1, "rgba(60,40,255,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  // odliczanie: cyfry pędzą na widza
  [["#n3", 0.25], ["#n2", 1.15], ["#n1", 2.05]].forEach(([s, a]) => { const l = clamp((t - a) / 0.9), p = E.inCubic(l); css($(s), { opacity: t < a || l >= 1 ? 0 : Math.min(1, l * 6) * (1 - Math.pow(l, 4)), transform: "scale(" + (0.6 + p * 1.9).toFixed(3) + ")", filter: "blur(" + (p * 7).toFixed(1) + "px) drop-shadow(0 0 18px rgba(61,123,255,.9)) drop-shadow(0 0 50px rgba(111,76,255,.7))" }); });
  // błysk
  $("#flash").style.opacity = Math.exp(-Math.pow((t - JUMP - 0.55) / 0.16, 2)) * 0.95;
  // napis: aberracja chromatyczna zbiega się do zera
  const r = P(t, JUMP + 0.6, 1.5, E.outExpo), out = P(t, D - 1.1, 0.8, E.inOutCubic);
  const ab = (1 - r) * 34 + 2.5;
  css($("#rev"), { opacity: (t > JUMP + 0.55 ? 1 : 0) * (1 - out), transform: "scale(" + (1.35 - 0.35 * r + out * 0.06) + ")", filter: "blur(" + ((1 - r) * 6 + out * 8).toFixed(1) + "px)" });
  $("#rev .cy").style.transform = "translateX(" + -ab + "px)"; $("#rev .mg").style.transform = "translateX(" + ab + "px)";
  css($("#rmk"), { opacity: P(t, JUMP + 1.2, 0.8), transform: "translateY(" + (1 - P(t, JUMP + 1.2, 0.9, E.outExpo)) * 16 + "px)" });
  css($("#rsub"), { opacity: P(t, JUMP + 1.5, 0.8), letterSpacing: (0.3 + (1 - P(t, JUMP + 1.5, 1.2, E.outExpo)) * 0.3).toFixed(3) + "em" });
};`;
  return base({
    id: "zapowiedz-06-warp",
    title: "Warp",
    description: "Elektrycznie niebieskie i fioletowe smugi gwiazd pędzą na widza; cyfry 3-2-1 nadlatują z tunelu, skok w nadprzestrzeń, biały błysk i „Już wkrótce.” z aberracją chromatyczną, która zbiega się w ostry napis.",
    w,
    h,
    duration: D,
    gifW: 960,
    gifH: 540,
    gifLossy: 18,
    crf: 18,
    still: 5.6,
    keys: [0.5, 1.4, 2.3, 3.2, 3.55, 4.2, 5.6, 8.4],
    html: page({ w, h, style, body, script }),
  });
}

export const comingSoon = () => [
  chrom({ w: 1280, h: 720 }),
  zorza({ w: 1280, h: 720 }),
  neon({ w: 1280, h: 720 }),
  druk(),
  czasteczki(),
  warp(),
  chrom({ w: 1500, h: 500 }),
  zorza({ w: 1500, h: 500 }),
  neon({ w: 1500, h: 500 }),
];
