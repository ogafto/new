// „Premiera” — 6 animacji w stylu filmu premierowego produktu (UI szybuje i sprężyście wskakuje na miejsce,
// płynne ruchy kamery po interfejsie, czyste plansze tytułowe), w języku wizualnym strony afto.
// Każda w dwóch formatach: 1280×720 i przekomponowany baner 1500×500.
import { MARK, geoSvg, page } from "./lib.mjs";

const GROUP = "Premiera";
const V = "#8b6cff";
const V2 = "#b4a2ff";
const INK = "#efedf5";
const MUTED = "#9b98a8";
const DIM = "#615e6e";
const GREEN = "#34d399";
const mark = (s, o = {}) => geoSvg(MARK, o).replace("<svg", `<svg width="${s}" height="${s}"`);
const ICON = {
  spark: "M12 3l1.8 5.6L19.5 10l-5.7 1.6L12 17l-1.8-5.4L4.5 10l5.7-1.4z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  inbox: "M4 13l2.5-8h11L20 13v6H4zM4 13h5l1 2h4l1-2h5",
  users: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a7 7 0 0114 0v1M17 11a3 3 0 100-6M22 21v-1a5 5 0 00-4-4.9",
  wallet: "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H3zM3 7l12-3v3M16 13.5h2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  check: "M5 12.5l4.5 4.5L19 7.5",
  play: "M8 5v14l11-7z",
  move: "M5 3l13 6.2-5.6 1.6L10 16.5z",
  ellipse: "M12 4a8 8 0 100 16 8 8 0 000-16z",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  rect: "M4 7h16v10H4z",
  text: "M5 6V4h14v2M12 4v16M9 20h6",
  drop: "M14 4l6 6M17 7L7 17l-3 1 1-3L15 5M12.5 9.5l2 2",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
};
const icon = (d, s = 18, c = "currentColor", sw = 1.7) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const RNG = `function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}`;

/* ------------------------------------------------------------------ szkielet ------------------------------------------------------------------ */

const KIT_CSS = `
#bg{position:absolute;inset:0;background:#07070a;overflow:hidden}
#bg .dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px);background-size:26px 26px;-webkit-mask-image:radial-gradient(ellipse 70% 70% at 50% 45%,#000 20%,transparent 75%)}
#bg .gl{position:absolute;border-radius:50%;pointer-events:none}
#frame{position:absolute}
#cam{position:absolute;left:0;top:0;transform-origin:0 0}
.card{position:absolute;border-radius:20px;background:linear-gradient(165deg,rgba(255,255,255,.075),rgba(255,255,255,.025));backdrop-filter:blur(22px) saturate(150%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.09),0 30px 70px -30px rgba(0,0,0,.85);overflow:hidden;color:${INK}}
.lbl{font-size:13px;color:${MUTED};letter-spacing:.01em}
.pill{display:inline-flex;align-items:center;gap:7px;height:26px;padding:0 11px;border-radius:999px;font-size:12.5px;font-weight:500;white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:999px;font-weight:500;white-space:nowrap}
.num{font-variant-numeric:tabular-nums;letter-spacing:-.03em}
.line{height:8px;border-radius:5px;background:rgba(255,255,255,.12)}
#cur{position:absolute;left:0;top:0;z-index:50;pointer-events:none}
#cur .rp{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:2px solid ${V2};opacity:0}
#title{position:absolute;color:${INK}}
#title .kick{display:inline-flex;align-items:center;gap:10px;height:36px;padding:0 16px 0 13px;border-radius:999px;font-size:15px;letter-spacing:.02em;background:rgba(139,108,255,.12);box-shadow:inset 0 0 0 1px rgba(139,108,255,.4);color:${V2}}
#title .kick i{width:7px;height:7px;border-radius:50%;background:${V2};box-shadow:0 0 12px ${V}}
#title h1{font-weight:500;letter-spacing:-.05em;line-height:1.02}
#title .m{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .03em .12em;margin:0 -.03em -.12em}
#title .m>span{display:inline-block}
#title .a{color:${V2}}
#title .sub{display:flex;align-items:center;gap:12px;color:${MUTED};font-size:20px}
#title .sub b{color:${INK};font-weight:500}
`;

/**
 * Scena premierowa. `board` = { w, h, css, html, js } — interfejs w swoich współrzędnych; js definiuje story(t).
 * cam: [[t, fx, fy, zoom]] — ruch kamery po interfejsie (16:9; w banerze złagodzony).
 * cur: { keys: [[t,x,y]], clicks: [t] } — kursor w układzie interfejsu.
 * title: { kick, lines: [html...], sub } — plansza tytułowa od TT.
 */
function launch({ slug, n, name, desc, D = 9, TT = 6.0, board, cam = [], cur = null, title, wide, extra = {} }) {
  const W = wide ? 1500 : 1280;
  const H = wide ? 500 : 720;
  const BW = board.w;
  const BH = board.h;
  const sc = wide ? Math.min(450 / BH, 800 / BW) : Math.min(1180 / BW, 660 / BH);
  const FW = BW * sc;
  const FH = BH * sc;
  const FX = wide ? 50 : (W - FW) / 2; // baner: interfejs startuje na środku, przy planszy zjeżdża w lewo
  const FX0 = (W - FW) / 2;
  const FY = (H - FH) / 2;
  const tl = wide
    ? `left:${FX + FW + 64}px;right:56px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:${18}px`
    : `left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:26px`;
  const fs = wide ? 58 : 92;
  // słowa: „*słowo” = kolor akcentu, „słowo^” = fioletowa kropka na końcu
  const words = (line) =>
    line
      .split(" ")
      .map((w) => {
        const acc = w.startsWith("*");
        let x = acc ? w.slice(1) : w;
        x = x.endsWith("^") ? `${x.slice(0, -1)}<span class="a">.</span>` : x;
        return `<span class="m"><span class="w${acc ? " a" : ""}">${x}</span></span>`;
      })
      .join(" ");
  const style = `${KIT_CSS}
#title{${tl}}
#title h1{font-size:${fs}px}
${board.css}`;
  const body = `<div id="bg"><div class="dots"></div>
  <div class="gl" id="g1" style="left:${W * 0.18 - 380}px;top:${H * 0.3 - 380}px;width:760px;height:760px;background:radial-gradient(closest-side,rgba(139,108,255,.30),transparent)"></div>
  <div class="gl" id="g2" style="left:${W * 0.8 - 420}px;top:${H * 0.75 - 420}px;width:840px;height:840px;background:radial-gradient(closest-side,rgba(110,70,255,.24),transparent)"></div>
  <div class="gl" id="g3" style="left:${W * 0.55 - 300}px;top:${-300}px;width:600px;height:600px;background:radial-gradient(closest-side,rgba(180,162,255,.12),transparent)"></div>
</div>
<div id="c" class="abs" style="inset:0">
  <div id="frame" style="left:${wide ? FX0 : FX}px;top:${FY}px;width:${FW}px;height:${FH}px"><div id="cam" style="width:${BW}px;height:${BH}px">
    ${board.html}
    ${cur ? `<div id="cur"><span class="rp"></span><svg id="arrow" width="26" height="26" viewBox="0 0 18 18" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.6));transform-origin:2px 2px"><path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" stroke-width="1.2" stroke-linejoin="round"/></svg></div>` : ""}
  </div></div>
  <div id="title"><span class="kick" id="tk"><i></i>${title.kick}</span><h1>${title.lines.map((l) => `<div>${words(l)}</div>`).join("")}</h1><div class="sub" id="ts">${mark(28)}<span>${title.sub}</span></div></div>
</div>`;
  const script = `${RNG}
const WIDE = ${!!wide}, D = ${D}, TT = ${TT}, BW = ${BW}, BH = ${BH}, SC = ${sc}, FW = ${FW}, FH = ${FH}, FX0 = ${FX0}, FX1 = ${FX};
const CAM = ${JSON.stringify(cam)}, CUR = ${JSON.stringify(cur)};
const camEl = $("#cam");
// sprężyste wejście elementu
function pop(el, t, a, o) { o = o || {}; const y = o.y ?? 18, s0 = o.s ?? 0.92, d = o.d ?? 0.9; const k = t < a ? 0 : E.spring(clamp((t - a) / d), o.k ?? 7, o.z ?? 0.55); el.style.opacity = clamp((t - a) / 0.22); el.style.transform = (o.pre || "") + "translateY(" + ((1 - k) * y).toFixed(2) + "px) scale(" + (s0 + (1 - s0) * k).toFixed(4) + ")"; return k; }
function typeIn(el, txt, t, a, cps) { const n = Math.max(0, Math.min(txt.length, Math.floor((t - a) * cps))); el.textContent = txt.slice(0, n); return n; }
const fmtPL = (v, dec) => v.toLocaleString("pl-PL", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
function camera(t) {
  if (!CAM.length) return [BW / 2, BH / 2, 1];
  if (t <= CAM[0][0]) return CAM[0].slice(1);
  for (let i = 0; i < CAM.length - 1; i++) { const a = CAM[i], b = CAM[i + 1]; if (t <= b[0]) { const k = E.inOutCubic(clamp((t - a[0]) / (b[0] - a[0]))); return [mix(a[1], b[1], k), mix(a[2], b[2], k), mix(a[3], b[3], k)]; } }
  return CAM[CAM.length - 1].slice(1);
}
const tW = $$("#title .w"), tK = $("#tk"), tS = $("#ts");
window.__render = (t) => {
  const ph = (t / D) * Math.PI * 2;
  $("#g1").style.transform = "translate(" + Math.sin(ph) * 40 + "px," + Math.cos(ph) * 24 + "px)";
  $("#g2").style.transform = "translate(" + Math.cos(ph) * 50 + "px," + Math.sin(ph * 2) * 20 + "px)";
  const out = P(t, D - 0.75, 0.7, E.inOutCubic);
  // kamera: w banerze ruch złagodzony (cały interfejs zostaje w kadrze)
  let [fx, fy, z] = camera(t);
  if (WIDE) { fx = mix(BW / 2, fx, 0.3); fy = mix(BH / 2, fy, 0.3); z = 1 + (z - 1) * 0.25; }
  const tt = P(t, TT, 0.9, E.inOutQuart);
  if (!WIDE) z *= 1 - 0.06 * tt;
  const s = SC * z;
  camEl.style.transform = "translate(" + (FW / 2 - fx * s).toFixed(2) + "px," + (FH / 2 - fy * s).toFixed(2) + "px) scale(" + s.toFixed(5) + ")";
  // interfejs: w 16:9 ustępuje planszy tytułowej, w banerze zostaje obok
  const fr = $("#frame");
  if (!WIDE) css(fr, { opacity: 1 - tt, filter: "blur(" + (tt * 10).toFixed(1) + "px)" });
  else css(fr, { left: mix(FX0, FX1, tt).toFixed(1) + "px", opacity: 1 - out, filter: "blur(" + (out * 8).toFixed(1) + "px)" });
  if (CUR) {
    const c = track(t, CUR.keys, E.inOutCubic);
    let press = 0; CUR.clicks.forEach((k) => { if (t >= k && t < k + 0.24) press = Math.sin(((t - k) / 0.24) * Math.PI); });
    const vis = P(t, CUR.keys[1] ? CUR.keys[1][0] - 0.3 : 0, 0.25) * (1 - P(t, CUR.hide ?? TT - 0.4, 0.3));
    css($("#cur"), { transform: "translate(" + (c.x - 3) + "px," + (c.y - 2) + "px)", opacity: vis });
    $("#arrow").style.transform = "scale(" + (1 - press * 0.2) + ")";
    let rp = -1; CUR.clicks.forEach((k) => { if (t >= k && t < k + 0.6) rp = (t - k) / 0.6; });
    css($("#cur .rp"), { opacity: rp < 0 ? 0 : 1 - rp, transform: "scale(" + (0.3 + Math.max(0, rp) * 1.4) + ")" });
  }
  story(t);
  // plansza tytułowa
  css(tK, { opacity: P(t, TT + 0.1, 0.3) * (1 - out), transform: "translateY(" + (1 - pop2(t, TT + 0.1)) * 14 + "px) scale(" + (0.9 + 0.1 * pop2(t, TT + 0.1)) + ")" });
  tW.forEach((el, i) => { const a = TT + 0.25 + i * 0.07, p = P(t, a, 1.0, E.outExpo); css(el, { opacity: clamp((t - a) / 0.25) * (1 - out), transform: "translateY(" + ((1 - p) * 0.9).toFixed(3) + "em)", filter: "blur(" + ((1 - p) * 6 + out * 8).toFixed(1) + "px)" }); });
  css(tS, { opacity: P(t, TT + 0.85, 0.8) * (1 - out), transform: "translateY(" + (1 - P(t, TT + 0.85, 0.9, E.outExpo)) * 10 + "px)" });
};
function pop2(t, a) { return t < a ? 0 : E.spring(clamp((t - a) / 0.9), 7, 0.55); }
${board.js}`;
  return {
    id: wide ? `premiera-${n}-${slug}-1500x500` : `premiera-${n}-${slug}`,
    title: wide ? `${name} — baner 1500 × 500` : name,
    description: desc,
    group: GROUP,
    w: W,
    h: H,
    duration: D,
    gifW: wide ? W : 960,
    gifH: wide ? H : 540,
    gifFps: 25,
    gifLossy: extra.gifLossy ?? 14,
    crf: 17,
    poster: true,
    // kadr podglądu: w 16:9 gotowy interfejs (bardziej obrazowy), w banerze interfejs + plansza
    still: wide ? TT + 1.6 : TT - 0.5,
    keys: [0.6, 1.4, 2.4, 3.2, 4.2, 5.2, TT + 0.2, TT + 1.6],
    html: page({ w: W, h: H, style, body, script }),
    ...extra,
  };
}


/* ======================================== 01 · Przedstawiamy: prompt → storyboard → strona ======================================== */
function s1(wide) {
  const BW = 1100;
  const BH = 640;
  const prompt = "Zaprojektuj stronę dla kawiarni w Krakowie…";
  const cards = [
    ["01", "Strona główna"],
    ["02", "Menu"],
    ["03", "Galeria"],
    ["04", "Kontakt"],
  ];
  const cw = 232;
  const gap = 24;
  const row0 = (BW - (cw * 4 + gap * 3)) / 2;
  const site = { x: 170, y: 168, w: 760, h: 440 };
  const dest = [
    [site.x + 22, site.y + 62, site.w - 44, 196],
    [site.x + 22, site.y + 272, 230, 146],
    [site.x + 265, site.y + 272, 230, 146],
    [site.x + 508, site.y + 272, 230, 146],
  ];
  const warm = ["linear-gradient(150deg,#3b2417,#1a110c)", "linear-gradient(150deg,#d9a066,#7a4a2a)", "linear-gradient(150deg,#f1d3b0,#b8794a)"];
  const mini = [
    `<div class="mini"><div class="line" style="width:60%;height:10px;background:rgba(255,255,255,.5)"></div><div class="line" style="width:42%;margin-top:6px"></div><div class="btn" style="margin-top:10px;height:18px;width:56px;background:${V}"></div></div>
     <div class="full"><div style="font-size:12px;color:rgba(255,255,255,.7);letter-spacing:.14em;text-transform:uppercase">Kawiarnia Ziarno</div><div style="margin-top:8px;font-size:34px;font-weight:500;letter-spacing:-.04em;line-height:1">Kawa, która ma charakter.</div><div class="btn" style="margin-top:14px;height:34px;padding:0 16px;background:${INK};color:#120c08;font-size:13px">Zarezerwuj stolik</div></div>`,
    `<div class="mini menu">${["Espresso", "Flat white", "Sernik"].map((n, i) => `<div style="display:flex;justify-content:space-between;font-size:12px;margin-top:${i ? 7 : 0}px"><span>${n}</span><span style="color:${V2}">${[9, 14, 16][i]} zł</span></div>`).join("")}</div>`,
    `<div class="mini tiles"><span style="background:${warm[1]}"></span><span style="background:${warm[2]}"></span><span style="background:${warm[2]}"></span><span style="background:${warm[1]}"></span></div>`,
    `<div class="mini"><div style="height:58px;border-radius:10px;background:linear-gradient(135deg,rgba(139,108,255,.35),rgba(139,108,255,.08));position:relative"><span style="position:absolute;left:46%;top:30%;width:12px;height:12px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${V2}"></span></div><div class="line" style="width:70%;margin-top:10px"></div><div class="line" style="width:45%;margin-top:6px"></div></div>`,
  ];
  const css = `
#pr{left:150px;top:44px;width:800px;height:84px;border-radius:22px;display:flex;align-items:center;padding:0 16px 0 26px;gap:16px}
#pr .tx{flex:1;font-size:22px;letter-spacing:-.01em;white-space:nowrap;overflow:hidden}
#pr .car{display:inline-block;width:2px;height:24px;margin-left:2px;vertical-align:-4px;background:${V2}}
#gen{height:52px;padding:0 22px;background:${V};color:#fff;font-size:17px;box-shadow:0 12px 30px -10px rgba(139,108,255,.8)}
#gen .sp{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff}
.sb{width:${cw}px;height:176px;padding:14px}
.sb .hd{display:flex;align-items:center;justify-content:space-between}
.sb .nb{font-size:12px;color:${V2};font-weight:500}
.sb .body{position:absolute;left:14px;right:14px;top:44px;bottom:14px;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.03);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.sb .body.hero{background:${warm[0]}}
.mini{position:absolute;inset:12px}
.full{position:absolute;inset:22px;opacity:0}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.tiles span{border-radius:7px}
#site{left:${site.x}px;top:${site.y}px;width:${site.w}px;height:${site.h}px;border-radius:22px}
#site .bar{height:46px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.07)}
#site .bar i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.16)}
#site .url{margin-left:auto;margin-right:auto;height:26px;padding:0 14px;border-radius:999px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);font-size:13px;color:${MUTED}}
#done{left:${site.x + site.w - 190}px;top:${site.y - 18}px}
`;
  const html = `
<div class="card" id="site"><div class="bar"><i></i><i></i><i></i><span class="url"><span style="width:7px;height:7px;border-radius:50%;background:${GREEN}"></span>kawiarnia-ziarno.pl</span></div></div>
<div class="card" id="pr">${icon(ICON.spark, 26, V2, 1.6)}<span class="tx"><span id="pt"></span><span class="car" id="car"></span></span><span class="btn" id="gen"><span id="gl">Generuj</span></span></div>
${cards.map(([nb, lab], i) => `<div class="card sb" id="sb${i}"><div class="hd"><span class="lbl">${lab}</span><span class="nb">${nb}</span></div><div class="body${i === 0 ? " hero" : ""}">${mini[i]}</div></div>`).join("")}
<span class="pill" id="done" style="background:rgba(52,211,153,.12);color:#a7f3d0;box-shadow:inset 0 0 0 1px rgba(52,211,153,.35)">${icon(ICON.check, 13, "#a7f3d0", 2.4)}Gotowe w 12 s</span>
`;
  const js = `
const PROMPT = ${JSON.stringify(prompt)}, ROW0 = ${row0}, CW = ${cw}, GAP = ${gap}, DEST = ${JSON.stringify(dest)};
const CLICK = 2.45, AS = 4.25;
function story(t) {
  pop($("#pr"), t, 0.15, { y: 24 });
  typeIn($("#pt"), PROMPT, t, 0.55, 24);
  $("#car").style.opacity = t > 2.6 ? 0 : (Math.floor(t * 2.5) % 2 ? 0.2 : 1);
  const busy = t >= CLICK && t < 3.6, ok = t >= 3.6;
  $("#gl").textContent = busy ? "Generuję…" : ok ? "Gotowe" : "Generuj";
  const press = t >= CLICK && t < CLICK + 0.24 ? Math.sin(((t - CLICK) / 0.24) * Math.PI) : 0;
  css($("#gen"), { transform: "scale(" + (1 - press * 0.06) + ")", background: ok ? "#1fb57f" : "${V}" });
  // karty scenorysu wskakują po kolei, potem układają się w gotową stronę
  for (let i = 0; i < 4; i++) {
    const el = $("#sb" + i), a = 2.75 + i * 0.22;
    const k = P(t, AS + i * 0.08, 1.0, E.inOutQuart);
    const x0 = ROW0 + i * (CW + GAP), y0 = 196, [x1, y1, w1, h1] = DEST[i];
    css(el, { left: mix(x0, x1, k) + "px", top: mix(y0, y1, k) + "px", width: mix(CW, w1, k) + "px", height: mix(176, h1, k) + "px", padding: mix(14, 0, k) + "px" });
    pop(el, t, a, { y: 30, s: 0.85 });
    el.querySelector(".hd").style.opacity = 1 - k;
    const b = el.querySelector(".body"); css(b, { top: mix(44, 0, k) + "px", left: mix(14, 0, k) + "px", right: mix(14, 0, k) + "px", bottom: mix(14, 0, k) + "px" });
    el.style.boxShadow = k > 0.98 ? "none" : "";
    el.style.background = "rgba(255,255,255," + (0.05 * (1 - k)).toFixed(3) + ")";
    if (i === 0) { el.querySelector(".mini").style.opacity = 1 - P(t, AS + 0.3, 0.4); el.querySelector(".full").style.opacity = P(t, AS + 0.55, 0.5); }
  }
  pop($("#site"), t, AS - 0.05, { y: 0, s: 0.97, d: 1.2 });
  pop($("#done"), t, 5.15, { y: 10 });
  $("#pr").style.opacity = Math.min(+$("#pr").style.opacity, 1 - P(t, AS, 0.5) * 0.65);
}`;
  return launch({
    slug: "przedstawiamy",
    n: "01",
    name: "Przedstawiamy afto.",
    desc: "Okno polecenia wpisuje „Zaprojektuj stronę dla kawiarni w Krakowie…”, kursor klika „Generuj”, karty scenorysu wskakują po kolei i składają się w gotową stronę („Gotowe w 12 s”) → „Przedstawiamy: afto. Nowa odsłona.”",
    D: 9,
    TT: 6.0,
    board: { w: BW, h: BH, css, html, js },
    cam: [
      [0, 550, 90, 1.38],
      [2.2, 600, 100, 1.3],
      [2.9, 550, 260, 1.05],
      [4.1, 550, 290, 1.0],
      [5.3, 550, 380, 1.07],
    ],
    cur: { keys: [[0, 1160, 560], [1.7, 1160, 560], [2.4, 892, 96], [2.9, 892, 96], [3.6, 1170, 420]], clicks: [2.45], hide: 3.5 },
    title: { kick: "Przedstawiamy", lines: ["afto^", "*Nowa *odsłona."], sub: "<b>afto.works</b> · już wkrótce" },
    wide,
  });
}

/* ======================================== 02 · Panel: pulpit buduje się sam ======================================== */
function s2(wide) {
  const BW = 1100;
  const BH = 640;
  const pts = [8, 10, 9, 13, 12, 15, 14, 18, 17, 21, 19, 24, 23, 27];
  const cw = 540;
  const ch = 150;
  const path = pts.map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * cw).toFixed(1)} ${(ch - (v / 30) * ch).toFixed(1)}`).join(" ");
  const nav = [
    [ICON.grid, "Pulpit"],
    [ICON.inbox, "Zapytania"],
    [ICON.users, "Klienci"],
    [ICON.wallet, "Finanse"],
    [ICON.chart, "Analityka"],
  ];
  const kpis = [
    ["Przychód w tym miesiącu", 18640, " zł", "+12%"],
    ["Nowe zapytania", 24, "", "+8"],
    ["Konwersja", 4.8, "%", "+0,6 pp"],
  ];
  const css = `
#side{left:0;top:0;width:200px;height:640px;padding:22px 14px}
#side .lg{display:flex;align-items:center;gap:10px;font-size:19px;font-weight:500;padding-left:8px}
#side .nv{margin-top:28px;display:flex;flex-direction:column;gap:4px}
#side .it{display:flex;align-items:center;gap:12px;height:40px;padding:0 12px;border-radius:12px;font-size:14.5px;color:${MUTED}}
#side .it.on{background:rgba(255,255,255,.07);color:${INK};box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
#top{left:224px;top:0;width:876px;height:56px;display:flex;align-items:center;justify-content:space-between;position:absolute}
#top h3{font-size:24px;font-weight:500;letter-spacing:-.03em}
#top .r{display:flex;align-items:center;gap:12px}
#top .sr{width:220px;height:38px;border-radius:999px;display:flex;align-items:center;gap:10px;padding:0 14px;color:${DIM};font-size:13.5px;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
#top .av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,${V},#5b3fd6);font-size:13px;font-weight:500}
.kpi{top:76px;width:284px;height:124px;padding:18px 20px}
.kpi .v{margin-top:12px;font-size:34px;font-weight:500}
.kpi .d{position:absolute;right:18px;top:16px;background:rgba(52,211,153,.12);color:#a7f3d0}
.kpi svg{position:absolute;right:18px;bottom:18px}
#chart{left:224px;top:216px;width:580px;height:262px;padding:20px}
#chart .hd{display:flex;justify-content:space-between;align-items:center}
#chart h4,#list h4,#gantt h4{font-size:16px;font-weight:500;letter-spacing:-.01em}
#chart svg{position:absolute;left:20px;top:84px;overflow:visible}
#tip{position:absolute;top:0;left:0;padding:8px 12px;border-radius:12px;background:#15151c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 12px 30px -10px rgba(0,0,0,.8);font-size:12.5px;white-space:nowrap}
#tip b{display:block;font-size:15px;font-weight:500;margin-top:2px}
#list{left:816px;top:216px;width:284px;height:262px;padding:20px}
#list .rw{display:flex;align-items:center;justify-content:space-between;margin-top:16px;font-size:14px}
#gantt{left:224px;top:490px;width:876px;height:150px;padding:20px}
#gantt .tr{position:absolute;left:150px;right:20px;height:22px;border-radius:7px}
#gantt .tn{position:absolute;left:20px;font-size:13px;color:${MUTED}}
#toast{left:744px;top:70px;width:340px;height:78px;display:flex;align-items:center;gap:14px;padding:0 18px;background:linear-gradient(165deg,rgba(40,40,52,.92),rgba(22,22,30,.92));box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 0 1px rgba(52,211,153,.35),0 30px 60px -20px rgba(0,0,0,.9),0 0 50px -10px rgba(52,211,153,.35)}
#toast .ic{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(52,211,153,.16)}
#toast .t1{font-size:16px;font-weight:500}
#toast .t2{font-size:13px;color:${MUTED};margin-top:2px}
#toast .pb{position:absolute;left:0;bottom:0;height:2px;background:${GREEN}}
`;
  const spark = (seed) => {
    const p = Array.from({ length: 9 }, (_, i) => 4 + ((Math.sin(i * 1.7 + seed) + 1) / 2) * 14 + i * 1.2);
    return `<svg width="84" height="30" viewBox="0 0 84 30" fill="none"><path class="spk" d="${p.map((v, i) => `${i ? "L" : "M"}${i * 10.5} ${30 - v}`).join(" ")}" stroke="${V2}" stroke-width="1.8" pathLength="1"/></svg>`;
  };
  const html = `
<div class="card" id="side"><div class="lg">${mark(26)}afto.</div><div class="nv">${nav.map(([d, l], i) => `<div class="it${i === 0 ? " on" : ""}" id="nv${i}">${icon(d, 18)}${l}</div>`).join("")}</div></div>
<div id="top"><h3>Dzień dobry</h3><div class="r"><span class="sr">${icon(ICON.search, 15)}Szukaj…</span><span class="av">af.</span></div></div>
${kpis.map(([l], i) => `<div class="card kpi" id="k${i}" style="left:${224 + i * 296}px"><div class="lbl">${l}</div><div class="v num" id="kv${i}">0</div><span class="pill d">${kpis[i][3]}</span>${spark(i * 2)}</div>`).join("")}
<div class="card" id="chart"><div class="hd"><div><h4>Przychód — 30 dni</h4><div class="lbl" style="margin-top:3px">Wszystkie projekty</div></div><span class="pill" style="background:rgba(139,108,255,.14);color:${V2}">Ten miesiąc</span></div>
  <svg width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${V}" stop-opacity=".45"/><stop offset="1" stop-color="${V}" stop-opacity="0"/></linearGradient><clipPath id="cl"><rect id="clr" width="0" height="${ch + 10}" y="-5"/></clipPath></defs>
  ${[0, 1, 2, 3].map((i) => `<line x1="0" x2="${cw}" y1="${(i * ch) / 3}" y2="${(i * ch) / 3}" stroke="rgba(255,255,255,.06)"/>`).join("")}
  <path d="${path} L${cw} ${ch} L0 ${ch}Z" fill="url(#ag)" clip-path="url(#cl)"/><path id="ln" d="${path}" stroke="${V2}" stroke-width="2.5" pathLength="1" fill="none"/>
  <line id="vl" y1="0" y2="${ch}" stroke="rgba(255,255,255,.2)" stroke-dasharray="3 4"/><circle id="hp" r="6" fill="#fff" stroke="${V}" stroke-width="3"/></svg>
  <div id="tip"><span style="color:${MUTED}">Tydzień 3</span><b class="num" id="tipv">4 980 zł</b></div></div>
<div class="card" id="list"><h4>Ostatnie projekty</h4>${[
    ["Kawiarnia Ziarno", "Online", GREEN],
    ["Studio Forma", "W toku", V2],
    ["Nordic Living", "Projekt", "#f5c264"],
    ["Atelier Mila", "Wycena", MUTED],
  ]
    .map(([n, s, c], i) => `<div class="rw" id="lr${i}"><span>${n}</span><span class="pill" style="background:rgba(255,255,255,.05);color:${c}"><span style="width:6px;height:6px;border-radius:50%;background:${c}"></span>${s}</span></div>`)
    .join("")}</div>
<div class="card" id="gantt"><h4>Harmonogram</h4>${[
    ["Projekt", 0, 0.34, V],
    ["Wdrożenie", 0.28, 0.42, "#6f4cff"],
    ["Premiera", 0.72, 0.2, GREEN],
  ]
    .map(([n, x, wd, c], i) => `<span class="tn" style="top:${56 + i * 30}px">${n}</span><span class="tr" id="gb${i}" style="top:${54 + i * 30}px;margin-left:${x * 100}%;width:${wd * 85}%;background:linear-gradient(90deg,${c},${c}aa);transform-origin:0 50%"></span>`)
    .join("")}</div>
<div class="card" id="toast"><span class="ic">${icon(ICON.check, 20, GREEN, 2.4)}</span><div><div class="t1">Wpłata 1 299 zł</div><div class="t2">Faktura nr 14 · opłacona</div></div><span class="pb" id="tpb"></span></div>
`;
  const js = `
const KV = ${JSON.stringify(kpis.map((k) => [k[1], k[2]]))}, PTS = ${JSON.stringify(pts)}, CWc = ${cw}, CHc = ${ch};
function story(t) {
  pop($("#side"), t, 0.1, { y: 0, s: 0.98 });
  for (let i = 0; i < 5; i++) pop($("#nv" + i), t, 0.3 + i * 0.06, { y: 8 });
  pop($("#top"), t, 0.35, { y: 10 });
  for (let i = 0; i < 3; i++) {
    pop($("#k" + i), t, 0.6 + i * 0.14, { y: 26 });
    const [to, suf] = KV[i], v = to * P(t, 0.9 + i * 0.14, 1.5, E.outCubic);
    $("#kv" + i).textContent = (i === 2 ? fmtPL(v, 1) : fmtPL(Math.round(v))) + suf;
    $$("#k" + i + " .spk").forEach((s) => draw(s, P(t, 1.0 + i * 0.14, 1.2, E.inOutCubic)));
  }
  pop($("#chart"), t, 1.15, { y: 26 });
  pop($("#list"), t, 1.3, { y: 26 });
  pop($("#gantt"), t, 1.45, { y: 26 });
  for (let i = 0; i < 4; i++) pop($("#lr" + i), t, 1.6 + i * 0.1, { y: 10 });
  for (let i = 0; i < 3; i++) { const k = P(t, 1.9 + i * 0.15, 0.9, E.outExpo); $("#gb" + i).style.transform = "scaleX(" + k + ")"; }
  const dl = P(t, 1.6, 1.5, E.inOutCubic);
  draw($("#ln"), dl); $("#clr").setAttribute("width", (dl * CWc).toFixed(1));
  // punkt najechania przesuwa się po wykresie
  const hp = P(t, 3.1, 1.7, E.inOutCubic), fi = 4 + hp * 8, i0 = Math.floor(fi), f = fi - i0;
  const v = PTS[i0] + (PTS[Math.min(i0 + 1, PTS.length - 1)] - PTS[i0]) * f, x = (fi / (PTS.length - 1)) * CWc, y = CHc - (v / 30) * CHc;
  const hv = P(t, 3.0, 0.3) * (1 - P(t, 5.5, 0.3));
  $("#hp").setAttribute("cx", x); $("#hp").setAttribute("cy", y); $("#hp").style.opacity = hv;
  $("#vl").setAttribute("x1", x); $("#vl").setAttribute("x2", x); $("#vl").style.opacity = hv;
  css($("#tip"), { opacity: hv, transform: "translate(" + (x + 30) + "px," + (y + 44) + "px)" });
  $("#tipv").textContent = fmtPL(Math.round(v * 180)) + " zł";
  // powiadomienie o wpłacie
  const tk = t < 4.25 ? 0 : E.spring(clamp((t - 4.25) / 0.9), 7, 0.6);
  css($("#toast"), { opacity: clamp((t - 4.25) / 0.2), transform: "translateX(" + ((1 - tk) * 120).toFixed(1) + "px)" });
  $("#tpb").style.width = (1 - P(t, 4.4, 1.6, E.lin)) * 100 + "%";
}`;
  return launch({
    slug: "panel",
    n: "02",
    name: "Twój panel",
    desc: "Panel administracyjny składa się sam: menu, karty KPI sprężyście wskakują, liczby doliczają się, wykres rysuje się z punktem najechania, harmonogram rośnie, a z prawej wjeżdża powiadomienie „Wpłata 1 299 zł” → „Twój panel. Wszystko w jednym miejscu.”",
    D: 9,
    TT: 6.0,
    board: { w: BW, h: BH, css, html, js },
    cam: [
      [0, 640, 170, 1.2],
      [1.4, 660, 170, 1.16],
      [2.6, 520, 330, 1.18],
      [3.8, 820, 200, 1.2],
      [5.1, 550, 320, 1.0],
    ],
    title: { kick: "Panel klienta", lines: ["Twój panel.", "*Wszystko *w *jednym *miejscu."], sub: "<b>afto.works</b> · już wkrótce" },
    wide,
    extra: {},
  });
}

/* ======================================== 03 · Oś czasu: od pomysłu do premiery ======================================== */
function s3(wide) {
  const BW = 1100;
  const BH = 640;
  const clips = [
    ["Strony", 0.0, 0.27, "linear-gradient(90deg,#8b6cff,#7656f0)"],
    ["Sklepy", 0.27, 0.23, "linear-gradient(90deg,#6f4cff,#5b3fd6)"],
    ["Identyfikacja", 0.5, 0.27, "linear-gradient(90deg,#b4a2ff,#9278ff)"],
    ["UI/UX", 0.77, 0.23, "linear-gradient(90deg,#a855f7,#8b5cf6)"],
  ];
  const TLX = 150;
  const TLW = 870;
  const scr = [
    // Strony
    `<div class="sc" id="sc0"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-weight:500">forma<span style="color:${V}">.</span></b><span style="display:flex;gap:14px;font-size:12px;color:${MUTED}"><span>Oferta</span><span>Realizacje</span><span>Kontakt</span></span></div>
      <div style="display:flex;gap:22px;margin-top:30px;align-items:center"><div style="flex:1"><div style="font-size:36px;font-weight:500;letter-spacing:-.045em;line-height:1">Strona, która<br><span style="color:${V2}">sprzedaje.</span></div><div class="btn" style="margin-top:18px;height:36px;padding:0 16px;background:${INK};color:#07070a;font-size:13px">Umów rozmowę</div></div><div style="width:210px;height:170px;border-radius:16px;background:linear-gradient(150deg,#c4b4ff,#5b3fd6)"></div></div></div>`,
    // Sklepy
    `<div class="sc" id="sc1"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-weight:500">Sklep Vela</b><span style="position:relative">${icon("M5 7h14l-1.5 11h-11zM9 7a3 3 0 016 0", 20)}<span id="cb" style="position:absolute;right:-8px;top:-6px;width:17px;height:17px;border-radius:50%;background:${V};font-size:10px;display:grid;place-items:center">2</span></span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px">${[
        ["Sukienka Mila", "249 zł", "linear-gradient(160deg,#f0b6d0,#a8466f)"],
        ["Torba Nord", "189 zł", "linear-gradient(160deg,#d8c6a8,#7b5f3c)"],
        ["Szal Vela", "129 zł", "linear-gradient(160deg,#c4b4ff,#6a4ff0)"],
      ]
        .map(([n, p, g]) => `<div><div style="height:130px;border-radius:12px;background:${g}"></div><div style="display:flex;justify-content:space-between;margin-top:9px;font-size:13px"><span>${n}</span><span style="color:${V2}">${p}</span></div></div>`)
        .join("")}</div></div>`,
    // Identyfikacja
    `<div class="sc" id="sc2" style="display:flex;gap:26px;align-items:center"><div style="flex:1;height:250px;border-radius:16px;background:#f2efe8;color:#14110d;display:flex;flex-direction:column;justify-content:center;align-items:center"><div style="font-size:54px;font-weight:700;letter-spacing:-.06em">forma<span style="color:#ff5b2e">.</span></div><div style="font-size:12px;letter-spacing:.3em;margin-top:6px">STUDIO WNĘTRZ</div></div>
      <div style="width:170px"><div class="lbl">Kolory</div><div style="display:flex;gap:8px;margin-top:10px">${["#14110d", "#f2efe8", "#ff5b2e", "#c9b79c"].map((c) => `<span style="width:32px;height:32px;border-radius:9px;background:${c};box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)"></span>`).join("")}</div>
      <div class="lbl" style="margin-top:20px">Krój</div><div style="font-size:38px;font-weight:500;margin-top:4px">Aa</div><div style="margin-top:14px;height:68px;border-radius:10px;background:#14110d;transform:rotate(-6deg);box-shadow:0 12px 24px -10px rgba(0,0,0,.8)"></div></div></div>`,
    // UI/UX
    `<div class="sc" id="sc3" style="display:flex;gap:28px;justify-content:center;align-items:center">${[0, 1, 2]
      .map(
        (i) => `<div style="width:140px;height:262px;border-radius:24px;padding:12px;background:#111018;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14);${i === 1 ? "transform:translateY(-12px);box-shadow:inset 0 0 0 1.5px rgba(180,162,255,.6),0 20px 40px -16px rgba(139,108,255,.6)" : ""}">
          <div style="height:${[70, 110, 50][i]}px;border-radius:12px;background:${["linear-gradient(150deg,#8b6cff,#4c2fd0)", "linear-gradient(150deg,#c4b4ff,#7656f0)", "rgba(255,255,255,.08)"][i]}"></div>
          ${[0, 1, 2].map((k) => `<div class="line" style="margin-top:10px;width:${[80, 60, 70][k]}%"></div>`).join("")}<div class="btn" style="margin-top:14px;height:26px;width:100%;background:${i === 1 ? V : "rgba(255,255,255,.1)"};font-size:11px">${["Dalej", "Zamów", "Gotowe"][i]}</div></div>`,
      )
      .join(`<span style="color:${DIM};font-size:22px">→</span>`)}</div>`,
  ];
  const css = `
#pv{left:220px;top:16px;width:660px;height:372px;border-radius:24px}
#pv .bar{height:40px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.07)}
#pv .bar i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.16)}
#pv .bar .lb{margin-left:auto;font-size:12px;color:${MUTED}}
#pv .scw{position:absolute;left:0;right:0;top:40px;bottom:0;overflow:hidden}
.sc{position:absolute;inset:24px 28px;font-size:15px}
#tr{left:220px;top:398px;width:660px;height:30px;display:flex;align-items:center;gap:14px;position:absolute}
#play{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:${INK};color:#07070a}
#tc{font-size:13px;color:${MUTED}}
#tl{left:40px;top:444px;width:1020px;height:184px;border-radius:22px}
#tl .ru{position:absolute;left:${TLX}px;width:${TLW}px;top:14px;height:20px}
#tl .ru span{position:absolute;top:0;font-size:11px;color:${DIM};transform:translateX(-50%)}
#tl .ru i{position:absolute;bottom:0;width:1px;height:5px;background:rgba(255,255,255,.2)}
#tl .tn{position:absolute;left:22px;font-size:13px;color:${MUTED};display:flex;align-items:center;gap:8px}
.clip{position:absolute;top:48px;height:48px;border-radius:11px;padding:0 14px;display:flex;align-items:center;font-size:14px;font-weight:500;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3);transform-origin:0 50%;overflow:hidden;white-space:nowrap}
.wav{position:absolute;top:110px;height:30px;left:${TLX}px;width:${TLW}px;display:flex;align-items:center;gap:2px}
.wav i{flex:1;border-radius:2px;background:rgba(139,108,255,.45)}
.kf{position:absolute;top:150px;width:10px;height:10px;transform:rotate(45deg);background:${V2}}
#ph{position:absolute;top:8px;bottom:12px;width:2px;background:#fff;box-shadow:0 0 12px rgba(180,162,255,.9)}
#ph::before{content:"";position:absolute;left:-7px;top:-2px;width:16px;height:14px;border-radius:4px 4px 8px 8px;background:#fff}
`;
  const wav = Array.from({ length: 120 }, (_, i) => 4 + Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)) * 24 + ((i * 7919) % 5));
  const html = `
<div class="card" id="pv"><div class="bar"><i></i><i></i><i></i><span class="lb" id="pvl">Podgląd · Strony</span></div><div class="scw">${scr.join("")}</div></div>
<div id="tr"><span id="play">${icon(ICON.play, 14, "#07070a", 0)}</span><span class="num" id="tc">00:00</span><span class="lbl" style="margin-left:auto">Od pomysłu do premiery · 4 etapy</span></div>
<div class="card" id="tl">
  <div class="ru">${Array.from({ length: 9 }, (_, i) => `<span style="left:${(i / 8) * 100}%">${i}s</span>`).join("")}${Array.from({ length: 33 }, (_, i) => `<i style="left:${(i / 32) * 100}%"></i>`).join("")}</div>
  <span class="tn" style="top:62px">${icon(ICON.grid, 14)}Etapy</span><span class="tn" style="top:116px">${icon(ICON.chart, 14)}Rytm</span><span class="tn" style="top:146px">${icon(ICON.spark, 14)}Kamienie</span>
  ${clips.map(([l, x, w, g], i) => `<div class="clip" id="cl${i}" style="left:${TLX + x * TLW + 2}px;width:${w * TLW - 4}px;background:${g}">${l}</div>`).join("")}
  <div class="wav">${wav.map((v) => `<i style="height:${v.toFixed(0)}px"></i>`).join("")}</div>
  ${[0.12, 0.38, 0.63, 0.9].map((x, i) => `<span class="kf" id="kf${i}" style="left:${TLX + x * TLW}px"></span>`).join("")}
  <div id="ph" style="left:${TLX}px"></div>
</div>`;
  const js = `
const CL = ${JSON.stringify(clips.map((c) => [c[0], c[1], c[2]]))}, TLX = ${TLX}, TLW = ${TLW};
const PLAY = 0.95, P0 = 1.1, P1 = 5.7;
function story(t) {
  pop($("#pv"), t, 0.15, { y: 24 });
  pop($("#tl"), t, 0.25, { y: 30 });
  pop($("#tr"), t, 0.4, { y: 10 });
  CL.forEach((c, i) => { const el = $("#cl" + i), k = t < 0.45 + i * 0.12 ? 0 : E.spring(clamp((t - 0.45 - i * 0.12) / 0.9), 7, 0.6); css(el, { opacity: clamp((t - 0.45 - i * 0.12) / 0.2), transform: "scaleX(" + (0.4 + 0.6 * k).toFixed(4) + ")" }); });
  $$(".wav i").forEach((e, i) => (e.style.opacity = clamp((t - 0.7 - i * 0.004) / 0.2)));
  // głowica odtwarzania
  const p = P(t, P0, P1 - P0, E.inOutSine), x = TLX + p * TLW;
  $("#ph").style.left = x + "px";
  $$(".kf").forEach((e, i) => { const kx = [0.12, 0.38, 0.63, 0.9][i]; const hit = p > kx ? Math.exp(-Math.pow((p - kx) * 30, 2)) : 0; e.style.transform = "rotate(45deg) scale(" + (1 + hit * 0.8) + ")"; e.style.opacity = 0.5 + 0.5 * (p > kx ? 1 : 0); });
  const sec = p * 8; $("#tc").textContent = "00:0" + Math.floor(sec) + "," + String(Math.floor((sec % 1) * 10));
  const press = t >= PLAY && t < PLAY + 0.24 ? Math.sin(((t - PLAY) / 0.24) * Math.PI) : 0;
  $("#play").style.transform = "scale(" + (1 - press * 0.15) + ")";
  // podgląd: aktywny klip
  let cur = 0; CL.forEach((c, i) => { if (p >= c[1]) cur = i; });
  CL.forEach((c, i) => {
    // przejście: wjazd z prawej z rozmyciem
    const el = $("#sc" + i), enter = i === cur ? P(t, enterT[i], 0.6, E.outExpo) : 0;
    css(el, { opacity: Math.min(1, enter * 1.5), transform: "translateX(" + ((1 - enter) * 40).toFixed(1) + "px)", filter: "blur(" + ((1 - enter) * 6).toFixed(1) + "px)" });
  });
  $("#pvl").textContent = "Podgląd · " + CL[cur][0];
  CL.forEach((c, i) => { $("#cl" + i).style.boxShadow = i === cur && t > P0 ? "inset 0 1px 0 rgba(255,255,255,.3),0 0 0 2px #fff,0 10px 30px -8px rgba(139,108,255,.9)" : "inset 0 1px 0 rgba(255,255,255,.3)"; });
}
// moment wejścia każdego klipu (kiedy głowica przekracza jego początek) — z odwrócenia easingu inOutSine
const enterT = CL.map((c, i) => i === 0 ? 0.3 : P0 + (Math.acos(1 - 2 * c[1]) / Math.PI) * (P1 - P0));`;
  return launch({
    slug: "os-czasu",
    n: "03",
    name: "Oś czasu",
    desc: "Edytor z osią czasu: klipy „Strony · Sklepy · Identyfikacja · UI/UX” wskakują na ścieżkę, kursor klika odtwarzanie, głowica przesuwa się, a okno podglądu zmienia się z każdym klipem (strona, sklep, identyfikacja, ekrany aplikacji) → „Od pomysłu do premiery.”",
    D: 9,
    TT: 6.1,
    board: { w: BW, h: BH, css, html, js },
    cam: [
      [0, 550, 520, 1.25],
      [0.9, 330, 470, 1.22],
      [1.8, 550, 230, 1.12],
      [4.6, 560, 250, 1.1],
      [5.6, 550, 320, 1.0],
    ],
    cur: { keys: [[0, 520, 720], [0.4, 520, 720], [0.9, 236, 414], [1.3, 236, 414], [1.9, 420, 720]], clicks: [0.95], hide: 1.7 },
    title: { kick: "Proces", lines: ["Od pomysłu", "*do *premiery."], sub: "<b>afto.works</b> · strony · sklepy · identyfikacja · UI/UX" },
    wide,
  });
}

/* ======================================== 04 · Portfolio: przelot nad kartami w 3D ======================================== */
function s4(wide) {
  const BW = 1100;
  const BH = 640;
  const projects = [
    ["Kawiarnia Ziarno", "Strona · menu", "linear-gradient(150deg,#3b2417,#c58b52)"],
    ["Studio Forma", "Identyfikacja", "linear-gradient(150deg,#c4b4ff,#5b3fd6)"],
    ["Nordic Living", "Sklep", "linear-gradient(150deg,#cfe9f1,#4f8fa8)"],
    ["Atelier Mila", "Strona · rezerwacje", "linear-gradient(150deg,#f6c6d6,#b5476f)"],
    ["Kancelaria Lex", "Strona firmowa", "linear-gradient(150deg,#1f2a44,#b8975a)"],
    ["FitLab", "Aplikacja · UI", "linear-gradient(150deg,#d9ff6b,#2c3a10)"],
    ["Pracownia Glina", "Sklep", "linear-gradient(150deg,#f0b48f,#9a4a2b)"],
    ["Moda Vela", "Sklep · kampania", "linear-gradient(150deg,#ff7ad9,#6d1bb0)"],
    ["Ogrody Zieleń", "Strona", "linear-gradient(150deg,#9be0b0,#1f6b46)"],
    ["Hotel Orla", "Rezerwacje", "linear-gradient(150deg,#9ec5ff,#2546a8)"],
    ["Piekarnia Kłos", "Identyfikacja", "linear-gradient(150deg,#f4dfae,#a57a2c)"],
    ["Apteka Plus", "Strona", "linear-gradient(150deg,#a8f0e0,#1d8a78)"],
  ];
  const cols = 4;
  const PW = 380;
  const PH = 250;
  const G = 44;
  const gw = cols * PW + (cols - 1) * G;
  const gh = 3 * PH + 2 * G;
  const T = 1; // karta, w którą wjeżdża kamera („Studio Forma”)
  const css = `
#vp{position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;perspective:1300px;perspective-origin:50% 40%;overflow:visible}
#plane{position:absolute;left:${(BW - gw) / 2}px;top:${(BH - gh) / 2}px;width:${gw}px;height:${gh}px;transform-style:preserve-3d;transform-origin:50% 50%}
.pc{position:absolute;width:${PW}px;height:${PH}px;border-radius:22px;padding:12px;background:linear-gradient(165deg,rgba(255,255,255,.09),rgba(255,255,255,.03));box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.1),0 40px 60px -30px rgba(0,0,0,.9)}
.pc .th{position:absolute;left:12px;right:12px;top:12px;bottom:56px;border-radius:14px;overflow:hidden}
.pc .th i{position:absolute;left:18px;bottom:16px;right:40%;height:9px;border-radius:5px;background:rgba(255,255,255,.75)}
.pc .th b{position:absolute;left:18px;bottom:32px;width:46%;height:16px;border-radius:6px;background:rgba(255,255,255,.9)}
.pc .th u{position:absolute;right:16px;top:16px;width:64px;height:24px;border-radius:999px;background:rgba(255,255,255,.35)}
.pc .cp{position:absolute;left:22px;right:22px;bottom:16px;display:flex;justify-content:space-between;align-items:baseline}
.pc .cp span:first-child{font-size:17px;font-weight:500}
#case{position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;border-radius:30px;overflow:hidden;opacity:0;background:${projects[T][2]}}
#case .in{position:absolute;inset:0;padding:54px 60px;background:linear-gradient(90deg,rgba(7,7,10,.78),rgba(7,7,10,.15) 70%)}
#case .k{font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.75)}
#case h2{margin-top:16px;font-size:72px;font-weight:500;letter-spacing:-.05em;line-height:.98}
#case .tg{margin-top:22px;display:flex;gap:10px}
#case .tg span{height:34px;padding:0 15px;border-radius:999px;display:flex;align-items:center;font-size:14px;background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
#case .sh{position:absolute;right:56px;bottom:56px;display:flex;gap:16px}
#case .sh i{width:150px;height:110px;border-radius:16px;background:rgba(255,255,255,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3)}
`;
  const html = `
<div id="vp"><div id="plane">${projects
    .map(([n, tg, g], i) => {
      const x = (i % cols) * (PW + G);
      const y = Math.floor(i / cols) * (PH + G);
      return `<div class="pc" id="pc${i}" style="left:${x}px;top:${y}px"><div class="th" style="background:${g}"><u></u><b></b><i></i></div><div class="cp"><span>${n}</span><span class="lbl">${tg}</span></div></div>`;
    })
    .join("")}</div></div>
<div id="case"><div class="in"><div class="k">Realizacja · Identyfikacja</div><h2 id="ch">${projects[T][0]}</h2><div class="tg"><span>Logo</span><span>System kolorów</span><span>Strona www</span></div></div><div class="sh"><i></i><i></i><i></i></div></div>`;
  const js = `
const NC = ${projects.length}, COLS = ${cols}, PWc = ${PW}, PHc = ${PH}, Gc = ${G}, GW = ${gw}, GH = ${gh}, TGT = ${T};
const R0 = rng(4), FL = Array.from({ length: NC }, () => [R0() * 6.28, 6 + R0() * 10]);
function story(t) {
  const ph = (t / D) * Math.PI * 2;
  // przelot: płaszczyzna pochylona, kamera sunie po skosie, potem prostuje się i wjeżdża w jedną kartę
  const fly = P(t, 0, 4.6, E.inOutSine), push = P(t, 4.3, 1.3, E.inOutQuart);
  const tx = mix(260, -180, fly), ty = mix(140, -60, fly);
  const tcx = (TGT % COLS) * (PWc + Gc) + PWc / 2 - GW / 2, tcy = Math.floor(TGT / COLS) * (PHc + Gc) + PHc / 2 - GH / 2;
  const zs = mix(1, ${BW} / PWc, push);
  const rx = mix(50, 0, push), rz = mix(-16, 0, push);
  const X = mix(tx, -tcx * zs, push), Y = mix(ty, -tcy * zs, push), Z = mix(-120 + Math.sin(ph) * 20, 0, push);
  $("#plane").style.transform = "translate3d(" + X.toFixed(1) + "px," + Y.toFixed(1) + "px," + Z.toFixed(1) + "px) rotateX(" + rx.toFixed(2) + "deg) rotateZ(" + rz.toFixed(2) + "deg) scale(" + zs.toFixed(4) + ")";
  for (let i = 0; i < NC; i++) {
    const el = $("#pc" + i), a = 0.15 + (i % COLS) * 0.08 + Math.floor(i / COLS) * 0.12;
    const k = t < a ? 0 : E.spring(clamp((t - a) / 1.0), 6.5, 0.55);
    const [p0, amp] = FL[i];
    el.style.opacity = clamp((t - a) / 0.3) * (i === TGT ? 1 : 1 - push);
    el.style.transform = "translateZ(" + ((1 - k) * -200 + Math.sin(ph + p0) * amp * (1 - push)).toFixed(1) + "px)";
  }
  // rozwinięta realizacja
  const cs = P(t, 5.2, 0.35, E.inOutSine);
  css($("#case"), { opacity: cs });
  css($("#case .in"), { transform: "translateY(" + (1 - P(t, 5.3, 0.9, E.outExpo)) * 20 + "px)" });
  $$("#case .sh i").forEach((e, i) => pop(e, t, 5.5 + i * 0.1, { y: 20 }));
}`;
  return launch({
    slug: "portfolio",
    n: "04",
    name: "Nowe portfolio",
    desc: "Kamera sunie nad pochyloną w 3D siatką kart realizacji (kawiarnia, studio, sklepy, hotel…), które unoszą się delikatnie; płaszczyzna prostuje się, a jedna karta rozwija na cały kadr w stronę realizacji → „Nowe portfolio. Już wkrótce.”",
    D: 9,
    TT: 6.2,
    board: { w: BW, h: BH, css, html, js },
    title: { kick: "Portfolio", lines: ["Nowe portfolio.", "*Już *wkrótce."], sub: "<b>afto.works</b> · wybrane realizacje" },
    wide,
    extra: { gifLossy: 24, gifFps: 20, ...(wide ? {} : { still: 5.95 }) }, // cała płaszczyzna kart jest w ruchu — 20 kl./s trzyma GIF < 12 MB
  });
}

/* ======================================== 05 · Narzędzie projektowe: znak składa się z kształtów ======================================== */
function s5(wide) {
  const BW = 1100;
  const BH = 640;
  const u = 8.4; // px na jednostkę siatki znaku
  const AX = 210;
  const AY = 92;
  const AWd = 560;
  const AHt = 440;
  // znak w artboardzie: środek (22,25) → środek artboardu
  const ox = AX + AWd / 2 - 22 * u;
  const oy = AY + AHt / 2 - 25 * u;
  const P2 = (x, y) => [ox + x * u, oy + y * u];
  const sw = ["#ffffff", "#9b98a8", "#8b6cff", "#c6ff3d", "#ff6b4a", "#3d7bff"];
  const tools = [ICON.move, ICON.ellipse, ICON.pen, ICON.rect, ICON.text, ICON.drop];
  const [c0x, c0y] = P2(16 - 11.5, 31 - 11.5);
  const css = `
#tb{left:0;top:150px;width:58px;height:330px;border-radius:18px;padding:10px 0;display:flex;flex-direction:column;align-items:center;gap:8px}
#tb .tl{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:${MUTED}}
#ab{position:absolute;left:${AX}px;top:${AY}px;width:${AWd}px;height:${AHt}px;border-radius:6px;background:#0e0e13;box-shadow:0 0 0 1px rgba(255,255,255,.1),0 40px 80px -40px rgba(0,0,0,.9);background-image:radial-gradient(rgba(255,255,255,.08) 1px,transparent 1.2px);background-size:${u * 2}px ${u * 2}px}
#abl{position:absolute;left:${AX}px;top:${AY - 26}px;font-size:13px;color:${MUTED}}
#art{position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;overflow:visible;pointer-events:none}
#rp{left:870px;top:0;width:230px;height:640px;padding:18px}
#rp h5{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${DIM};font-weight:500}
#rp .ly{margin-top:12px;display:flex;flex-direction:column;gap:4px}
#rp .ly div{height:34px;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:10px;font-size:14px;color:${MUTED}}
#rp .pr{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
#rp .pr span{height:34px;border-radius:9px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;font-size:13px;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
#rp .pr span b{font-weight:500;color:${INK}}
#rp .sw{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}
#rp .sw span{width:26px;height:26px;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
#ring{position:absolute;width:34px;height:34px;border-radius:10px;border:2px solid #fff;pointer-events:none}
.bb{fill:none;stroke:${V};stroke-width:1.5}
.hd{fill:#fff;stroke:${V};stroke-width:1.5}
.sz{font-size:11px;font-family:Satoshi}
#tag{position:absolute;padding:5px 9px;border-radius:7px;background:${V};font-size:12px;font-weight:500;color:#fff;white-space:nowrap}
#grp{position:absolute;padding:0 12px;height:30px;border-radius:999px;display:flex;align-items:center;gap:8px;font-size:13px;background:#15151c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 12px 30px -10px rgba(0,0,0,.8)}
`;
  const handles = (id) => `<g id="${id}">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect class="hd" data-h="${i}" width="8" height="8" rx="1.5"/>`).join("")}<rect class="bb" data-b="1"/></g>`;
  const html = `
<div class="card" id="tb">${tools.map((d, i) => `<span class="tl" id="tool${i}">${icon(d, 20)}</span>`).join("")}</div>
<div id="abl">af. — znak · ${AWd} × ${AHt}</div><div id="ab"></div>
<svg id="art" viewBox="0 0 ${BW} ${BH}">
  <g id="guides" stroke="#ff4fd8" stroke-width="1" stroke-dasharray="4 4" opacity="0"><line id="gH" x1="${AX}" x2="${AX + AWd}"/><line id="gV" y1="${AY}" y2="${AY + AHt}"/></g>
  <g transform="translate(${ox} ${oy}) scale(${u})" fill="none">
    <circle id="mc" cx="16" cy="31" r="9" stroke="${INK}" stroke-width="5"/>
    <path id="ms" d="${MARK.paths[0]}" stroke="${INK}" stroke-width="5" pathLength="1"/>
    <path id="mb" d="${MARK.paths[1]}" stroke="${INK}" stroke-width="5" pathLength="1"/>
    <rect id="md" x="${MARK.dot.x}" y="${MARK.dot.y}" width="5" height="5" fill="#ffffff"/>
  </g>
  ${[
    [25, 42.5],
    [25, 17],
    [32, 10],
    [39.5, 10],
  ]
    .map(([x, y], i) => {
      const [px, py] = P2(x, y);
      return `<rect class="hd" id="an${i}" x="${px - 5}" y="${py - 5}" width="10" height="10" rx="2"/>`;
    })
    .join("")}
  ${handles("bx")}
  <rect id="mq" fill="rgba(139,108,255,.1)" stroke="${V}" stroke-width="1" stroke-dasharray="5 4"/>
</svg>
<span id="tag">0 × 0</span>
<div class="card" id="rp"><h5>Warstwy</h5><div class="ly">${["Grupa · af.", "Kropka", "Belka", "Trzon", "Brzuszek"].map((l, i) => `<div id="ly${i}">${icon(i === 0 ? ICON.grid : ICON.rect, 14)}${l}</div>`).join("")}</div>
  <h5 style="margin-top:22px">Właściwości</h5><div class="pr"><span>X <b class="num" id="pX">0</b></span><span>Y <b class="num" id="pY">0</b></span><span>W <b class="num" id="pW">0</b></span><span>H <b class="num" id="pH">0</b></span></div>
  <h5 style="margin-top:22px">Wypełnienie</h5><div class="sw">${sw.map((c, i) => `<span id="sw${i}" style="background:${c}"></span>`).join("")}</div>
  <div id="hex" class="num" style="margin-top:12px;font-size:14px;color:${MUTED}">#FFFFFF</div></div>
<span id="ring"></span>
<span id="grp">${icon(ICON.grid, 14)}Zgrupowano · af.</span>`;
  // klucze kursora (współrzędne interfejsu)
  const swx = (i) => 870 + 18 + i * 34 + 13;
  const [cE0x, cE0y] = [c0x, c0y];
  const [cE1x, cE1y] = P2(16 + 11.5, 31 + 11.5);
  const nodes = [
    [25, 42.5],
    [25, 17],
    [32, 10],
    [39.5, 10],
  ].map(([x, y]) => P2(x, y));
  const [b0x, b0y] = P2(25, 24);
  const [b1x, b1y] = P2(34.5, 24);
  const [d0x, d0y] = P2(34.5, 37.5);
  const [d1x, d1y] = P2(39.5, 42.5);
  const js = `
const U = ${u}, OX = ${ox}, OY = ${oy};
const SWX = ${JSON.stringify([0, 1, 2, 3, 4, 5].map(swx))};
const C0 = [${cE0x}, ${cE0y}], C1 = [${cE1x}, ${cE1y}], ND = ${JSON.stringify(nodes)}, B0 = [${b0x}, ${b0y}], B1 = [${b1x}, ${b1y}], D0 = [${d0x}, ${d0y}], D1 = [${d1x}, ${d1y}];
function setBox(g, x0, y0, x1, y1, vis) {
  const xs = [x0, (x0 + x1) / 2, x1], ys = [y0, (y0 + y1) / 2, y1];
  const pos = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];
  g.querySelectorAll("[data-h]").forEach((h, i) => { h.setAttribute("x", xs[pos[i][0]] - 4); h.setAttribute("y", ys[pos[i][1]] - 4); });
  const b = g.querySelector("[data-b]"); b.setAttribute("x", Math.min(x0, x1)); b.setAttribute("y", Math.min(y0, y1)); b.setAttribute("width", Math.abs(x1 - x0)); b.setAttribute("height", Math.abs(y1 - y0));
  g.style.opacity = vis;
}
function tagAt(x, y, txt, vis) { css($("#tag"), { left: x + "px", top: y + "px", opacity: vis }); $("#tag").textContent = txt; }
function story(t) {
  pop($("#tb"), t, 0.1, { y: 0, s: 0.96 });
  pop($("#rp"), t, 0.2, { y: 0, s: 0.98 });
  pop($("#ab"), t, 0.05, { y: 0, s: 0.98 });
  $("#abl").style.opacity = P(t, 0.3, 0.5);
  // narzędzie aktywne
  const tool = t < 0.7 ? 0 : t < 1.85 ? 1 : t < 2.85 ? 2 : t < 3.75 ? 3 : t < 4.6 ? 5 : 0;
  for (let i = 0; i < 6; i++) { const e = $("#tool" + i); e.style.background = i === tool ? "${V}" : "transparent"; e.style.color = i === tool ? "#fff" : "${MUTED}"; }
  // 1) elipsa przeciągana kursorem
  const e1 = P(t, 0.95, 0.7, E.inOutCubic);
  const ex = mix(C0[0], C1[0], e1), ey = mix(C0[1], C1[1], e1);
  const r = Math.max(0, ((ex - C0[0]) / U - 5) / 2);
  $("#mc").setAttribute("r", r.toFixed(2)); $("#mc").setAttribute("cx", (C0[0] - OX) / U + 2.5 + r); $("#mc").setAttribute("cy", (C0[1] - OY) / U + 2.5 + r);
  $("#mc").style.opacity = t > 0.95 ? 1 : 0;
  // 2) pióro: trzon z punktami
  const sp = P(t, 2.0, 0.8, E.inOutCubic); draw($("#ms"), sp);
  ND.forEach((_, i) => $("#an" + i).style.opacity = (t > 1.95 + i * 0.2 ? 1 : 0) * (1 - P(t, 3.0, 0.3)));
  // 3) prostokąt: belka + linie pomocnicze (przyciąganie)
  const bp = P(t, 3.0, 0.5, E.inOutCubic); draw($("#mb"), bp);
  const gv = P(t, 2.95, 0.15) * (1 - P(t, 3.6, 0.25));
  $("#guides").style.opacity = gv; $("#gH").setAttribute("y1", B0[1]); $("#gH").setAttribute("y2", B0[1]); $("#gV").setAttribute("x1", B1[0]); $("#gV").setAttribute("x2", B1[0]);
  // 4) kropka
  const dp = t < 3.55 ? 0 : E.outBack(clamp((t - 3.55) / 0.4), 2.2);
  $("#md").setAttribute("transform", "translate(37 40) scale(" + Math.max(0, dp) + ") translate(-37 -40)");
  // pipeta: kolor z próbnika
  const picked = t >= 4.35;
  $("#md").setAttribute("fill", picked ? "${V}" : "#ffffff");
  $("#hex").textContent = picked ? "#8B6CFF" : "#FFFFFF"; $("#hex").style.color = picked ? "${V2}" : "${MUTED}";
  const sw = $("#sw2").getBoundingClientRect(), cr = camEl.getBoundingClientRect(), sc = cr.width / BW;
  css($("#ring"), { left: (sw.left - cr.left) / sc - 4 + "px", top: (sw.top - cr.top) / sc - 4 + "px", opacity: P(t, 4.3, 0.15) * (1 - P(t, 5.0, 0.3)), transform: "scale(" + (1 + (1 - P(t, 4.3, 0.4, E.outBack)) * 0.4) + ")" });
  // ramka zaznaczenia i etykieta wymiarów — podąża za bieżącym kształtem
  let box = null, lab = "";
  if (t > 0.9 && t < 1.95) { box = [C0[0], C0[1], ex, ey]; lab = Math.round((ex - C0[0]) / U * 8) + " × " + Math.round((ey - C0[1]) / U * 8); }
  else if (t >= 2.9 && t < 3.5) { box = [B0[0], B0[1] - 2.5 * U, mix(B0[0], B1[0], bp), B0[1] + 2.5 * U]; lab = "x: 200 · y: 192"; }
  else if (t >= 3.55 && t < 4.65) { box = [D0[0], D0[1], D1[0], D1[1]]; lab = "40 × 40"; }
  else if (t >= 4.75) { const g = P(t, 4.75, 0.5, E.outExpo); box = [mix(C0[0] - 40, C0[0], g), mix(ND[3][1] - 2.5 * U - 40, ND[3][1] - 2.5 * U, g), mix(D1[0] + 40, D1[0], g), mix(C1[1] + 40, C1[1], g)]; lab = "Grupa af."; }
  if (box) { setBox($("#bx"), box[0], box[1], box[2], box[3], 1); tagAt(Math.max(box[0], box[2]) + 10, Math.max(box[1], box[3]) + 8, lab, 1); }
  else { $("#bx").style.opacity = 0; $("#tag").style.opacity = 0; }
  // zaznaczenie prostokątem (marquee) przy grupowaniu
  const mq = P(t, 4.65, 0.35, E.inOutCubic), mv = t > 4.62 && t < 4.95 ? 1 : 0;
  const m0 = [C0[0] - 40, ND[3][1] - 60]; $("#mq").setAttribute("x", m0[0]); $("#mq").setAttribute("y", m0[1]); $("#mq").setAttribute("width", (D1[0] + 40 - m0[0]) * mq); $("#mq").setAttribute("height", (C1[1] + 40 - m0[1]) * mq); $("#mq").style.opacity = mv;
  css($("#grp"), { left: (C0[0] + C1[0]) / 2 + 40 + "px", top: C1[1] + 56 + "px" }); pop($("#grp"), t, 5.05, { y: 10 });
  // warstwy i właściwości
  const LY = [4.75, 3.55, 3.0, 2.0, 0.95];
  LY.forEach((a, i) => { const e = $("#ly" + i); pop(e, t, a, { y: 6 }); const on = (i === 4 && t < 1.95) || (i === 3 && t >= 2 && t < 2.9) || (i === 2 && t >= 2.9 && t < 3.55) || (i === 1 && t >= 3.55 && t < 4.7) || (i === 0 && t >= 4.75); e.style.background = on ? "rgba(139,108,255,.16)" : "transparent"; e.style.color = on ? "${INK}" : "${MUTED}"; });
  if (box) { $("#pX").textContent = Math.round((Math.min(box[0], box[2]) - ${AX}) / 1); $("#pY").textContent = Math.round(Math.min(box[1], box[3]) - ${AY}); $("#pW").textContent = Math.round(Math.abs(box[2] - box[0])); $("#pH").textContent = Math.round(Math.abs(box[3] - box[1])); }
}`;
  return launch({
    slug: "projekt",
    n: "05",
    name: "Coś się projektuje",
    desc: "Jak w narzędziu do projektowania: kursor rysuje elipsę, piórem trzon z punktami, prostokątem belkę z liniami przyciągania, dodaje kropkę i pipetą pobiera fiolet z próbnika; zaznaczenie i „Zgrupowano · af.” → „Coś nowego się projektuje.”",
    D: 9,
    TT: 6.0,
    board: { w: BW, h: BH, css, html, js },
    cam: [
      [0, 490, 330, 1.18],
      [3.5, 520, 330, 1.18],
      [4.1, 760, 420, 1.12],
      [4.6, 620, 380, 1.1],
      [5.4, 550, 320, 1.0],
    ],
    cur: {
      keys: [
        [0, 1180, 700],
        [0.5, 29, 236],
        [0.75, 29, 236],
        [0.95, c0x, c0y],
        [1.65, cE1x, cE1y],
        [1.85, 29, 284],
        [2.0, nodes[0][0], nodes[0][1]],
        [2.25, nodes[1][0], nodes[1][1]],
        [2.55, nodes[2][0], nodes[2][1]],
        [2.8, nodes[3][0], nodes[3][1]],
        [2.95, b0x, b0y],
        [3.45, b1x, b1y],
        [3.6, d1x, d1y],
        [4.0, swx(2), 446],
        [4.35, swx(2), 446],
        [4.62, c0x - 40, nodes[3][1] - 60],
        [4.98, d1x + 40, cE1y + 40],
        [5.6, 1180, 700],
      ],
      clicks: [0.6, 0.95, 2.0, 2.25, 2.55, 2.8, 2.95, 4.35],
      hide: 5.5,
    },
    title: { kick: "Studio", lines: ["Coś nowego", "*się *projektuje."], sub: "<b>afto.works</b> · identyfikacja · strony · UI" },
    wide,
  });
}

/* ======================================== 06 · Start: lista kontrolna, pierścień, publikacja ======================================== */
function s6(wide) {
  const BW = 1100;
  const BH = 640;
  const items = [
    ["Projekt", "Zatwierdzony"],
    ["Kod", "Przetestowany"],
    ["SEO", "Meta i mapa strony"],
    ["Domena", "afto.works · SSL"],
  ];
  const R = 58;
  const circ = 2 * Math.PI * R;
  const css = `
#pub{left:270px;top:16px;width:560px;height:608px;border-radius:28px}
#pub .hd{position:absolute;left:28px;right:28px;top:24px;display:flex;align-items:center;gap:12px}
#pub .hd .fv{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#111018;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
#pub .hd .nm{font-size:18px;font-weight:500}
#pub .hd .ur{font-size:13px;color:${MUTED}}
#st{margin-left:auto}
#rg{position:absolute;left:28px;top:96px;right:28px;height:150px;display:flex;align-items:center;gap:28px;padding:0 6px}
#rg .pc{font-size:46px;font-weight:500}
.ck{position:absolute;left:28px;right:28px;height:52px;border-radius:14px;display:flex;align-items:center;gap:14px;padding:0 16px;background:rgba(255,255,255,.03);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.ck .ic{position:relative;width:26px;height:26px}
.ck .ic .sp{position:absolute;inset:0;border-radius:50%;border:2.5px solid rgba(255,255,255,.15);border-top-color:${V2}}
.ck .ic .ok{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center;background:${V}}
.ck .ic .wt{position:absolute;inset:3px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.25)}
.ck .nm{font-size:16px;font-weight:500}
.ck .mt{margin-left:auto;font-size:13px;color:${MUTED}}
#go{position:absolute;left:28px;right:28px;bottom:26px;height:58px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:18px;font-weight:500;overflow:hidden}
#go .fl{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.25)}
#go .lb{position:relative;display:flex;align-items:center;gap:10px}
#cf{position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;pointer-events:none;overflow:visible}
#live{left:880px;top:90px;width:200px;padding:16px}
#live .u{margin-top:8px;font-size:15px;font-weight:500}
`;
  const html = `
<div class="card" id="pub">
  <div class="hd"><span class="fv">${mark(26)}</span><div><div class="nm">Nowa strona</div><div class="ur">afto.works</div></div><span class="pill" id="st"><span id="sd" style="width:7px;height:7px;border-radius:50%"></span><span id="stl">Szkic</span></span></div>
  <div id="rg"><svg width="${2 * R + 16}" height="${2 * R + 16}" viewBox="0 0 ${2 * R + 16} ${2 * R + 16}"><circle cx="${R + 8}" cy="${R + 8}" r="${R}" stroke="rgba(255,255,255,.08)" stroke-width="10" fill="none"/><circle id="ra" cx="${R + 8}" cy="${R + 8}" r="${R}" stroke="url(#rgr)" stroke-width="10" fill="none" stroke-linecap="round" transform="rotate(-90 ${R + 8} ${R + 8})" stroke-dasharray="0 ${circ}" style="filter:drop-shadow(0 0 8px rgba(139,108,255,.8))"/><defs><linearGradient id="rgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${V2}"/><stop offset="1" stop-color="${V}"/></linearGradient></defs></svg>
    <div><div class="lbl">Gotowość do startu</div><div class="pc num" id="pct">0%</div><div class="lbl" id="pcs" style="margin-top:2px">Sprawdzam…</div></div></div>
  ${items.map(([n, m], i) => `<div class="ck" id="ck${i}" style="top:${256 + i * 60}px"><span class="ic"><span class="wt"></span><span class="sp"></span><span class="ok">${icon(ICON.check, 15, "#fff", 2.6)}</span></span><span class="nm">${n}</span><span class="mt">${m}</span></div>`).join("")}
  <div id="go"><span class="fl" id="gof"></span><span class="lb" id="gol">Publikuj</span></div>
</div>
<div class="card" id="live"><div class="lbl">Status</div><div class="u" id="lu">afto.works</div><div class="lbl" id="lt" style="margin-top:4px">Czeka na publikację</div></div>
<svg id="cf" viewBox="0 0 ${BW} ${BH}"></svg>`;
  const js = `
const CIRC = ${circ}, IT = [1.0, 1.55, 2.1, 2.65], CLICK = 3.75, LIVE = 4.55;
const RC = rng(9), CONF = Array.from({ length: 70 }, () => { const a = -Math.PI / 2 + (RC() - 0.5) * 2.4, v = 260 + RC() * 420; return [Math.cos(a) * v, Math.sin(a) * v, 3 + RC() * 5, RC() * 360, (RC() - 0.5) * 900, RC()]; });
const cf = $("#cf"); cf.innerHTML = CONF.map((c, i) => '<rect id="cp' + i + '" width="' + c[2] + '" height="' + c[2] + '" rx="1" fill="' + (c[5] < 0.5 ? "${V}" : c[5] < 0.8 ? "${V2}" : "#ffffff") + '"/>').join("");
function story(t) {
  pop($("#pub"), t, 0.1, { y: 30 });
  pop($("#live"), t, 0.5, { y: 20 });
  let done = 0;
  IT.forEach((a, i) => {
    const el = $("#ck" + i); pop(el, t, 0.35 + i * 0.08, { y: 14 });
    const act = t >= a - 0.45 && t < a, ok = t >= a; if (ok) done++;
    el.querySelector(".sp").style.opacity = act ? 1 : 0; el.querySelector(".sp").style.transform = "rotate(" + t * 720 + "deg)";
    el.querySelector(".wt").style.opacity = !act && !ok ? 1 : 0;
    const k = t < a ? 0 : E.outBack(clamp((t - a) / 0.4), 2.6); el.querySelector(".ok").style.transform = "scale(" + Math.max(0, k) + ")";
    el.style.boxShadow = ok ? "inset 0 0 0 1px rgba(139,108,255,.4)" : "inset 0 0 0 1px rgba(255,255,255,.07)";
  });
  // pierścień: skokowo po każdym punkcie
  let prog = 0; IT.forEach((a) => (prog += P(t, a, 0.5, E.outCubic) / 4));
  $("#ra").setAttribute("stroke-dasharray", (prog * CIRC).toFixed(1) + " " + CIRC);
  $("#pct").textContent = Math.round(prog * 100) + "%";
  $("#pcs").textContent = prog >= 0.999 ? "Wszystko gotowe" : "Sprawdzam…";
  // przycisk
  const ready = t >= 2.9, busy = t >= CLICK && t < LIVE, live = t >= LIVE;
  const press = t >= CLICK && t < CLICK + 0.24 ? Math.sin(((t - CLICK) / 0.24) * Math.PI) : 0;
  const glow = ready && !busy && !live ? 0.5 + 0.5 * Math.sin((t - 2.9) * 6) : 0;
  css($("#go"), { background: live ? "#10b981" : busy ? "${V}" : ready ? "${INK}" : "rgba(255,255,255,.06)", color: busy || live ? "#fff" : ready ? "#07070a" : "${DIM}", transform: "scale(" + (1 - press * 0.05) + ")", boxShadow: ready ? "0 16px 40px -14px rgba(139,108,255," + (0.5 + 0.4 * glow) + ")" : "none" });
  $("#gol").innerHTML = live ? "✓ Online" : busy ? "Publikuję…" : "Publikuj";
  $("#gof").style.width = (busy ? P(t, CLICK, LIVE - CLICK, E.inOutCubic) * 100 : 0) + "%";
  $("#stl").textContent = live ? "Online" : busy ? "Publikowanie" : "Szkic";
  $("#sd").style.background = live ? "${GREEN}" : busy ? "${V2}" : "${DIM}";
  $("#st").style.background = live ? "rgba(52,211,153,.12)" : "rgba(255,255,255,.05)"; $("#st").style.color = live ? "#a7f3d0" : "${MUTED}";
  $("#lt").textContent = live ? "Online · właśnie teraz" : "Czeka na publikację"; $("#lt").style.color = live ? "#a7f3d0" : "${MUTED}";
  $("#live").style.boxShadow = live ? "inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(52,211,153,.4),0 30px 70px -30px rgba(0,0,0,.85),0 0 40px -10px rgba(52,211,153,.4)" : "";
  // konfetti z małych kwadratów
  const go = $("#go").getBoundingClientRect(), cr = camEl.getBoundingClientRect(), sc = cr.width / BW;
  const ox = (go.left - cr.left + go.width / 2) / sc, oy = (go.top - cr.top) / sc;
  const ct = t - LIVE;
  CONF.forEach((c, i) => { const e = $("#cp" + i); if (ct < 0 || ct > 2.2) { e.style.opacity = 0; return; } const x = ox + c[0] * ct * 0.9, y = oy + c[1] * ct + 520 * ct * ct; e.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (c[3] + c[4] * ct).toFixed(1) + ")"); e.style.opacity = 1 - P(t, LIVE + 1.4, 0.8, E.lin); });
}`;
  return launch({
    slug: "start",
    n: "06",
    name: "Startujemy",
    desc: "Karta publikacji: punkty „Projekt · Kod · SEO · Domena” odhaczają się po kolei, pierścień gotowości dochodzi do 100%, kursor klika „Publikuj” → „Publikuję…” → „✓ Online”, wybucha konfetti z małych fioletowych kwadratów, status „Online” → „Startujemy wkrótce.”",
    D: 9,
    TT: 6.1,
    board: { w: BW, h: BH, css, html, js },
    cam: [
      [0, 550, 330, 1.18],
      [2.8, 550, 360, 1.15],
      [3.5, 550, 520, 1.2],
      [4.6, 560, 400, 1.08],
      [5.6, 560, 320, 1.0],
    ],
    cur: { keys: [[0, 1160, 700], [2.9, 1160, 700], [3.7, 620, 572], [4.2, 620, 572], [5.0, 1150, 690]], clicks: [3.75], hide: 4.9 },
    title: { kick: "Premiera", lines: ["Startujemy", "*wkrótce."], sub: "<b>afto.works</b> · bądź pierwszy" },
    wide,
  });
}

export const premiere = () => [s1(false), s2(false), s3(false), s4(false), s5(false), s6(false), s1(true), s2(true), s3(true), s4(true), s5(true), s6(true)];
