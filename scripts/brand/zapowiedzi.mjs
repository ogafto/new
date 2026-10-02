// Zapowiedzi na Discorda (1280×720, MP4 + GIF 960×540). Każda scena to czysta funkcja czasu.
import { C, MARK, WORDMARK, STROKE, geoSvg, page } from "./lib.mjs";

const W = 1280;
const H = 720;

// tło: delikatna siatka 64 px wycentrowana na środku kadru + winieta
const BG_STYLE = `
.grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px);background-size:64px 64px;background-position:0 40px;-webkit-mask-image:radial-gradient(ellipse 70% 75% at 50% 50%,#000 25%,transparent 80%)}
.glow{position:absolute;left:50%;top:50%;width:900px;height:620px;margin:-310px 0 0 -450px;background:radial-gradient(closest-side,rgba(139,108,255,.13),rgba(139,108,255,0) 100%);pointer-events:none}
#c{position:absolute;inset:0}
.kick{display:inline-flex;align-items:center;gap:12px;padding:10px 20px 10px 16px;border:1px solid rgba(255,255,255,.15);border-radius:999px;background:rgba(255,255,255,.03);font-size:20px;letter-spacing:.01em;color:${C.ink};line-height:1}
.kick i{width:8px;height:8px;border-radius:50%;background:${C.accent};box-shadow:0 0 14px ${C.accent}}
.line{display:block;overflow:hidden;padding-bottom:.08em}
.line>span{display:inline-block;will-change:transform}
`;

// wspólne: zanik całej treści na końcu pętli (tło zostaje → płynne zapętlenie)
const fadeOut = (a, d = 0.7) => `const out = P(t, ${a}, ${d}, E.inOutCubic); css($("#c"), { opacity: 1 - out, transform: "scale(" + (1 - out * 0.02) + ")" });`;

// słowa w osobnych maskach (wjazd od dołu)
// `tail` (np. fioletowa kropka) doklejany do ostatniego słowa
const words = (text, tail = "", cls = "w") =>
  text
    .split(" ")
    .map((w, i, a) => `<span class="line" style="display:inline-block"><span class="${cls}">${w}${i === a.length - 1 ? tail : ""}</span></span>`)
    .join(" ");
const DOT = `<span style="color:${C.accent}">.</span>`;

/* ---------------- 01 · Konstrukcja znaku ---------------- */
function konstrukcja() {
  const u = 300 / 44; // px na jednostkę siatki znaku
  const cx = 22;
  const cy = 25;
  const vb = [cx - W / 2 / u, cy - 300 / u, W / u, H / u];
  const c = MARK.circles[0];
  const guides = [
    ["h", 42.5, 0.15],
    ["h", 24, 0.25],
    ["h", 10, 0.35],
    ["v", 25, 0.3],
    ["v", 16, 0.4],
    ["v", 7, 0.5],
    ["v", 39.5, 0.55],
  ];
  const nodes = [
    [25, 42.5],
    [25, 17],
    [32, 10],
    [39.5, 10],
    [25, 24],
    [34.5, 24],
    [16, 22],
    [7, 31],
  ];
  const body = `
<div class="grid"></div><div class="glow"></div>
<div id="c">
<svg id="g" class="abs" style="inset:0" width="${W}" height="${H}" viewBox="${vb.join(" ")}" fill="none">
  ${guides.map(([o, v], i) => `<line class="gd" data-o="${o}" data-v="${v}" data-i="${i}" stroke="${C.accent}" stroke-opacity=".55" stroke-width=".16" stroke-dasharray=".7 .7"/>`).join("")}
  <circle class="gc" cx="${c.cx}" cy="${c.cy}" r="${c.r + STROKE / 2}" stroke="rgba(255,255,255,.32)" stroke-width=".14" stroke-dasharray=".6 .6"/>
  <circle class="gc" cx="${c.cx}" cy="${c.cy}" r="${c.r - STROKE / 2}" stroke="rgba(255,255,255,.32)" stroke-width=".14" stroke-dasharray=".6 .6"/>
  <circle class="gc" cx="32" cy="17" r="7" stroke="rgba(180,162,255,.5)" stroke-width=".14" stroke-dasharray=".6 .6"/>
  <g id="dim" opacity="0">
    <path d="M7 48.5H25M7 47.7v1.6M25 47.7v1.6" stroke="${C.accent2}" stroke-width=".14"/>
    <rect x="12.6" y="47.4" width="6.8" height="2.2" rx="1.1" fill="${C.accent}"/>
    <text x="16" y="48.95" text-anchor="middle" font-size="1.25" font-family="Satoshi" font-weight="500" fill="#fff">18 px</text>
  </g>
  <g id="m">${geoSvg(MARK).replace(/^<svg[^>]*>|<\/svg>$/g, "")}
    <circle id="rip" cx="${MARK.dot.x + 2.5}" cy="${MARK.dot.y + 2.5}" r="3" stroke="${C.accent}" stroke-width=".3" opacity="0"/>
  </g>
  ${nodes.map(([x, y], i) => `<rect class="nd" data-i="${i}" x="${x - 0.7}" y="${y - 0.7}" width="1.4" height="1.4" fill="${C.bg}" stroke="${C.accent}" stroke-width=".22" opacity="0"/>`).join("")}
</svg>
<div class="abs" id="txt" style="left:0;right:0;top:468px;text-align:center">
  <h1 style="font-size:64px;font-weight:500;letter-spacing:-.035em;line-height:1">${words("Coś nowego nadchodzi", DOT)}</h1>
  <div style="margin-top:30px"><span class="kick" id="kick"><i></i>afto.works · wkrótce</span></div>
</div>
</div>`;
  const script = `
const gd = $$(".gd"), gc = $$(".gc"), nd = $$(".nd"), strokes = $$("#m [data-s]"), dot = $("#m .dot"), rip = $("#rip"), ws = $$(".w");
const VB = ${JSON.stringify(vb)};
window.__render = (t) => {
  // prowadnice: rozchodzą się od znaku na boki
  const gOut = P(t, 3.0, 0.6, E.inOutCubic);
  gd.forEach((l) => {
    const i = +l.dataset.i, v = +l.dataset.v, p = P(t, 0.15 + i * 0.08, 1.4, E.outExpo);
    if (l.dataset.o === "h") { const c = 22, L = (VB[2] / 2) * p; l.setAttribute("x1", c - L); l.setAttribute("x2", c + L); l.setAttribute("y1", v); l.setAttribute("y2", v); }
    else { const c = 25, L = (VB[3] / 2 + 10) * p; l.setAttribute("y1", c - L); l.setAttribute("y2", c + L); l.setAttribute("x1", v); l.setAttribute("x2", v); }
    l.style.opacity = 1 - gOut;
  });
  // okręgi pomocnicze: obracają się na miejsce i rozjaśniają
  gc.forEach((g, i) => { const p = P(t, 0.55 + i * 0.15, 1.3, E.outExpo); g.style.opacity = p * (1 - gOut); g.setAttribute("transform", "rotate(" + (-60 * (1 - p)) + " " + g.getAttribute("cx") + " " + g.getAttribute("cy") + ")"); });
  $("#dim").setAttribute("opacity", IO(t, 1.7, 0.5, 3.0, 0.5));
  // znak: linie rysowane po kolei
  strokes.forEach((s) => { const i = +s.dataset.s; draw(s, P(t, 1.05 + i * 0.32, 1.0, E.inOutQuart)); });
  const dp = t < 2.35 ? 0 : E.outBack(clamp((t - 2.35) / 0.5), 2.6);
  dot.setAttribute("transform", "scale(" + Math.max(0, dp) + ")");
  const rp = P(t, 2.45, 1.1, E.outCubic);
  rip.setAttribute("r", 2 + rp * 6); rip.setAttribute("opacity", t < 2.45 ? 0 : 0.9 * (1 - rp));
  nd.forEach((n) => { const i = +n.dataset.i; n.setAttribute("opacity", IO(t, 1.2 + i * 0.1, 0.25, 2.6 + i * 0.05, 0.4)); });
  // znak unosi się i zmniejsza, wchodzi tekst
  const lift = P(t, 3.0, 1.1, E.inOutQuart);
  const s = 1 - 0.22 * lift, dy = -2.2 * lift;
  $("#m").setAttribute("transform", "translate(22 " + (25 + dy) + ") scale(" + s + ") translate(-22 -25)");
  ws.forEach((w, i) => { const p = P(t, 3.45 + i * 0.09, 1.1, E.outExpo); css(w, { transform: "translateY(" + (1 - p) * 105 + "%)" }); });
  const k = P(t, 4.15, 0.9, E.outExpo);
  css($("#kick"), { opacity: k, transform: "translateY(" + (1 - k) * 14 + "px)" });
  const pulse = 0.55 + 0.45 * Math.cos((t - 4.2) * Math.PI * 1.6);
  $("#kick i").style.opacity = t > 4.2 ? pulse : 1;
  ${fadeOut(6.25)}
};`;
  return {
    id: "zapowiedz-01-konstrukcja",
    name: "Konstrukcja znaku",
    desc: "Siatka i prowadnice, monogram rysowany linia po linii, kropka z falą, potem hasło „Coś nowego nadchodzi.”",
    w: W,
    h: H,
    duration: 7,
    gifW: 960,
    gifH: 540,
    keys: [0.5, 1.2, 1.8, 2.4, 2.9, 3.6, 4.6, 6.6],
    still: 5.2,
    poster: true,
    html: page({ w: W, h: H, style: BG_STYLE, body, script }),
  };
}

/* ---------------- 02 · Publikacja (kursor składa stronę) ---------------- */
function publikacja() {
  const blocks = [
    ["Menu", "M4 7h16M4 12h10M4 17h16"],
    ["Nagłówek", "M5 6h14M5 11h9M5 17h11"],
    ["Przycisk", "M4 9.5a3 3 0 013-3h10a3 3 0 013 3v5a3 3 0 01-3 3H7a3 3 0 01-3-3z"],
    ["Galeria", "M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM13 13h7v6h-7z"],
  ];
  const icon = (d) => `<span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg></span>`;
  const style = `
.side{position:absolute;left:140px;top:206px;width:210px}
.side .lbl{font-size:16px;color:${C.dim};letter-spacing:.04em;margin:0 0 14px 4px}
.pill{display:flex;align-items:center;gap:14px;height:56px;padding:0 20px 0 12px;margin-bottom:12px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.03);font-size:19px;color:${C.muted}}
.ic{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.06);color:${C.ink}}
.win{position:absolute;left:420px;top:96px;width:720px;height:468px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(255,255,255,.018);overflow:hidden}
.bar{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 16px 0 22px;border-bottom:1px solid rgba(255,255,255,.07)}
.dots{display:flex;gap:8px}.dots i{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.13)}
.url{display:flex;align-items:center;gap:10px;font-size:17px;color:${C.dim}}
.st{position:relative;width:10px;height:10px;border-radius:50%;background:${C.dim}}
.st b{position:absolute;inset:0;border-radius:50%;background:${C.green}}
.pub{position:relative;overflow:hidden;height:36px;padding:0 18px;border-radius:999px;display:flex;align-items:center;font-size:16px;font-weight:500;background:rgba(255,255,255,.06);color:${C.dim}}
.pub .fill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.28)}
.pub .lab{position:relative;white-space:nowrap}
.body{padding:24px 26px;display:flex;flex-direction:column;gap:16px}
.slot{position:relative}
.ph{position:absolute;inset:0;border:1.5px dashed rgba(255,255,255,.12);border-radius:12px}
.blk{position:absolute;inset:0;display:flex;align-items:center;opacity:0}
.s0{height:38px}.s1{height:104px}.s2{height:48px}.s3{height:148px}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;height:100%}
.tiles span{border-radius:12px}
.drag{position:absolute;left:0;top:0;margin:0;z-index:20;border-color:rgba(139,108,255,.65);background:${C.surface2};color:${C.ink};box-shadow:0 24px 50px -14px rgba(139,108,255,.55)}
#cur{position:absolute;left:0;top:0;z-index:30}
#cur .lbl2{position:absolute;left:24px;top:24px;padding:3px 8px;border-radius:7px;background:${C.accent};color:#fff;font-size:14px;font-weight:500;white-space:nowrap}
#ring{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:2.5px solid ${C.accent2};opacity:0}
.sheen{position:absolute;top:0;bottom:0;left:-50%;width:40%;transform:skewX(-20deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)}
.cap{position:absolute;left:0;right:0;top:608px;text-align:center;font-size:26px;letter-spacing:-.01em;color:${C.muted}}
.cap b{font-weight:500;color:${C.ink}}
`;
  const body = `
<div class="grid"></div><div class="glow" style="opacity:.8"></div>
<div id="c">
  <div class="side" id="side"><p class="lbl">Elementy</p>
    ${blocks.map(([l, d], i) => `<div class="pill" id="p${i}">${icon(d)}${l}</div>`).join("")}
  </div>
  <div class="win" id="win">
    <div class="bar"><span class="dots"><i></i><i></i><i></i></span>
      <span class="url"><span class="st"><b id="st"></b><b id="ping"></b></span><span id="urlt">afto.works</span></span>
      <span class="pub" id="pub"><span class="fill" id="fill"></span><span class="lab" id="lab">Opublikuj</span></span>
    </div>
    <div class="body">
      <div class="slot s0" id="s0"><div class="ph"></div><div class="blk" style="justify-content:space-between">
        <span style="font-size:20px;font-weight:500;letter-spacing:-.02em">afto<span style="color:${C.accent}">.</span></span>
        <span style="display:flex;gap:10px">${'<i style="width:30px;height:5px;border-radius:3px;background:rgba(255,255,255,.3)"></i>'.repeat(3)}</span></div></div>
      <div class="slot s1" id="s1"><div class="ph"></div><div class="blk">
        <span style="font-size:60px;font-weight:500;letter-spacing:-.04em;line-height:1">Nowa <span style="color:${C.accent2}">odsłona</span></span></div></div>
      <div class="slot s2" id="s2"><div class="ph"></div><div class="blk">
        <span style="display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 6px 0 20px;border-radius:999px;background:${C.ink};color:${C.bg};font-size:17px;font-weight:500">Już wkrótce <span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:${C.accent};color:#fff;font-size:16px">↗</span></span></div></div>
      <div class="slot s3" id="s3"><div class="ph"></div><div class="blk"><div class="tiles">
        <span style="background:linear-gradient(160deg,#2a2140,#14111d);display:grid;place-items:center">${geoSvg(MARK, { ink: "rgba(239,237,245,.85)" }).replace("<svg", '<svg width="60" height="60"')}</span>
        <span style="background:linear-gradient(160deg,#b9a6ff,#5b3fd6)"></span>
        <span style="background:linear-gradient(160deg,#efe9ff,#8b6cff)"></span></div></div></div>
    </div>
    <div class="sheen" id="sheen"></div>
  </div>
  <p class="cap" id="cap"><b>afto.works</b> · nowa odsłona już wkrótce</p>
</div>
<div class="pill drag" id="drag"></div>
<div id="cur"><span id="ring"></span><svg id="arrow" width="28" height="28" viewBox="0 0 18 18" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.6));transform-origin:2px 2px"><path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" stroke-width="1.2" stroke-linejoin="round"/></svg><span class="lbl2">afto</span></div>`;
  const script = `
const BL = ${JSON.stringify(blocks.map((b) => b[0]))};
const ctr = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const pills = BL.map((_, i) => ctr($("#p" + i))), slots = BL.map((_, i) => ctr($("#s" + i))), pub = ctr($("#pub"));
const T0 = 0.55, ST = 1.05, PUBT = T0 + 4 * ST + 0.6, LIVE = PUBT + 0.95;
// punkty kluczowe kursora [czas, x, y]
const keys = [[0, 1120, 640], [0.3, 1120, 640]];
BL.forEach((_, i) => { const a = T0 + i * ST; keys.push([a + 0.42, pills[i][0] + 30, pills[i][1] + 4], [a + 0.5, pills[i][0] + 30, pills[i][1] + 4], [a + 0.95, slots[i][0] - 120, slots[i][1]]); });
keys.push([PUBT - 0.5, slots[3][0] - 120, slots[3][1]], [PUBT - 0.02, pub[0] - 6, pub[1] + 2], [LIVE + 0.25, pub[0] - 6, pub[1] + 2], [LIVE + 1.0, 1150, 650]);
const presses = [...BL.map((_, i) => T0 + i * ST + 0.45), PUBT];
window.__render = (t) => {
  css($("#side"), { opacity: P(t, 0, 0.5) }); css($("#win"), { opacity: P(t, 0.05, 0.5) });
  const c = track(t, keys);
  let press = 0; presses.forEach((p) => { if (t >= p && t < p + 0.24) press = Math.sin(((t - p) / 0.24) * Math.PI); });
  css($("#cur"), { transform: "translate(" + (c.x - 4) + "px," + (c.y - 3) + "px)", opacity: P(t, 0.3, 0.3) * (1 - P(t, LIVE + 0.8, 0.4)) });
  $("#arrow").style.transform = "scale(" + (1 - press * 0.2) + ")";
  // fala kliknięcia na publikacji
  const rp = P(t, PUBT, 0.6, E.outCubic); css($("#ring"), { opacity: t >= PUBT ? 1 - rp : 0, transform: "scale(" + (0.3 + rp * 1.4) + ")" });
  let dragging = -1;
  BL.forEach((_, i) => {
    const a = T0 + i * ST, grab = a + 0.45, drop = a + 0.95;
    const used = t >= grab;
    css($("#p" + i), { opacity: used ? 0.28 : 1, transform: "scale(" + (t >= grab && t < grab + 0.15 ? 0.95 : 1) + ")" });
    if (t >= grab && t < drop + 0.1) dragging = i;
    const s = $("#s" + i), ph = $(".ph", s), blk = $(".blk", s);
    const hover = t >= a + 0.75 && t < drop;
    ph.style.borderColor = hover ? "rgba(180,162,255,.8)" : "rgba(255,255,255,.12)";
    ph.style.background = hover ? "rgba(139,108,255,.08)" : "transparent";
    const f = t < drop ? 0 : E.spring(clamp((t - drop) / 0.7), 6.5, 0.55);
    ph.style.opacity = 1 - P(t, drop, 0.2, E.lin);
    css(blk, { opacity: clamp((t - drop) / 0.15), transform: "translateY(" + (1 - f) * -12 + "px) scale(" + (0.96 + 0.04 * f) + ")" });
  });
  const d = $("#drag");
  if (dragging >= 0) {
    const a = T0 + dragging * ST, drop = a + 0.95;
    const lag = track(t - 0.06, keys);
    const appear = P(t, a + 0.45, 0.2, E.outCubic), gone = P(t, drop, 0.1, E.lin);
    d.innerHTML = $("#p" + dragging).innerHTML;
    css(d, { opacity: appear * (1 - gone), transform: "translate(" + (lag.x - 40) + "px," + (lag.y - 28) + "px) rotate(" + (-3 * appear) + "deg) scale(" + (0.92 + 0.08 * appear) + ")" });
  } else d.style.opacity = 0;
  // publikacja
  const ready = t >= T0 + 3 * ST + 0.95, busy = t >= PUBT, live = t >= LIVE;
  const pb = $("#pub"), lab = $("#lab");
  pb.style.background = live ? "#10b981" : busy ? "${C.accent}" : ready ? "${C.ink}" : "rgba(255,255,255,.06)";
  pb.style.color = busy ? "#fff" : ready ? "${C.bg}" : "${C.dim}";
  lab.textContent = live ? "✓ Online" : busy ? "Publikuję…" : "Opublikuj";
  const bump = t >= PUBT && t < PUBT + 0.3 ? Math.sin(((t - PUBT) / 0.3) * Math.PI) : 0;
  const bump2 = t >= LIVE && t < LIVE + 0.35 ? Math.sin(((t - LIVE) / 0.35) * Math.PI) : 0;
  pb.style.transform = "scale(" + (1 - bump * 0.08 + bump2 * 0.06) + ")";
  $("#fill").style.width = (busy && !live ? P(t, PUBT, 0.9, E.inOutCubic) * 100 : 0) + "%";
  $("#st").style.opacity = P(t, LIVE, 0.3);
  const pg = ((t - LIVE) % 1.2) / 1.2;
  css($("#ping"), { opacity: live ? 0.7 * (1 - pg) : 0, transform: "scale(" + (1 + pg * 1.8) + ")" });
  $("#urlt").style.color = live ? "${C.ink}" : "${C.dim}";
  const lv = P(t, LIVE, 0.8, E.outCubic);
  css($("#win"), { borderColor: "rgba(" + Math.round(mix(255, 139, lv)) + "," + Math.round(mix(255, 108, lv)) + ",255," + mix(0.1, 0.6, lv) + ")", background: "rgba(139,108,255," + mix(0.0, 0.05, lv) + ")", boxShadow: "0 40px 120px -40px rgba(139,108,255," + 0.5 * lv + ")" });
  $("#sheen").style.transform = "translateX(" + P(t, LIVE + 0.05, 1.2, E.inOutCubic) * 420 + "%) skewX(-20deg)";
  const cp = P(t, LIVE + 0.35, 1.0, E.outExpo);
  css($("#cap"), { opacity: cp, transform: "translateY(" + (1 - cp) * 16 + "px)" });
  ${fadeOut(8.05)}
};`;
  return {
    id: "zapowiedz-02-publikacja",
    name: "Publikacja",
    desc: "Kursor układa stronę z klocków i klika „Opublikuj” → „✓ Online”, podpis „afto.works · nowa odsłona już wkrótce”.",
    w: W,
    h: H,
    duration: 8.8,
    gifW: 960,
    gifH: 540,
    keys: [0.4, 1.3, 2.4, 3.6, 4.9, 5.75, 6.4, 7.6],
    still: 7.4,
    poster: true,
    html: page({ w: W, h: H, style: BG_STYLE + style, body, script }),
  };
}

/* ---------------- 03 · Rozmowa (dymki czatu) ---------------- */
function rozmowa() {
  const msgs = [
    { me: false, t: "Hej! Co słychać w afto?" },
    { me: true, t: "Szykujemy coś nowego." },
    { me: false, t: "Kiedy startujecie?" },
    { me: true, t: "Już wkrótce. Zaglądaj na afto.works" },
  ];
  const style = `
#col{position:absolute;left:300px;width:680px;bottom:190px;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 120px)}
#list{position:relative;height:520px}
.row{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;gap:14px}
.row.me{flex-direction:row-reverse}
.av{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;font-size:17px;font-weight:500}
.av.me{background:linear-gradient(135deg,${C.accent},#5b3fd6);color:#fff;box-shadow:0 0 26px rgba(139,108,255,.45)}
.av.you{background:rgba(255,255,255,.1);color:${C.ink};box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}
.bub{max-width:500px;padding:17px 24px;border-radius:28px;font-size:27px;line-height:1.25;letter-spacing:-.01em;box-shadow:0 22px 50px -22px rgba(0,0,0,.9)}
.me .bub{border-bottom-right-radius:8px;background:linear-gradient(135deg,${C.accent},#6d4fe6);color:#fff}
.you .bub{border-bottom-left-radius:8px;background:rgba(255,255,255,.065);border:1px solid rgba(255,255,255,.1);color:${C.ink}}
.typ{display:flex;gap:7px;padding:22px 24px}
.typ i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.85)}
.me .typ{background:rgba(139,108,255,.35)}
.you .typ{background:rgba(255,255,255,.07);border:none}
#seen{position:absolute;left:0;right:0;top:552px;text-align:center}
.badge{display:inline-flex;align-items:center;gap:12px;padding:12px 22px 12px 18px;border-radius:999px;border:1px solid rgba(139,108,255,.4);background:rgba(139,108,255,.1);font-size:22px;color:${C.accent2}}
.badge i{width:8px;height:8px;border-radius:50%;background:${C.accent2};box-shadow:0 0 14px ${C.accent}}
#head{position:absolute;left:0;right:0;top:56px;text-align:center}
`;
  const row = (m, i, typing = false) =>
    `<div class="row ${m.me ? "me" : "you"}" id="${typing ? "y" : "m"}${i}"><span class="av ${m.me ? "me" : "you"}">${m.me ? "af." : "Ty"}</span>${
      typing ? `<span class="bub typ"><i></i><i></i><i></i></span>` : `<span class="bub">${m.t}</span>`
    }</div>`;
  const body = `
<div class="grid"></div><div class="glow" style="top:58%"></div>
<div id="c">
  <div id="head"><span class="kick" style="font-size:18px;color:${C.muted}"><i></i>Wiadomości · afto.works</span></div>
  <div id="col"><div id="list">${msgs.map((m, i) => row(m, i) + row(m, i, true)).join("")}</div></div>
  <div id="seen"><span class="badge" id="badge"><i></i>Nowa odsłona — wkrótce</span></div>
</div>`;
  const script = `
const N = ${msgs.length}, GAP = 18, STEP = 1.35, A0 = 0.9;
const rows = [...Array(N)].map((_, i) => ({ m: $("#m" + i), y: $("#y" + i), a: A0 + i * STEP, me: $("#m" + i).classList.contains("me") }));
rows.forEach((r) => { r.hm = r.m.offsetHeight; r.hy = r.y.offsetHeight; });
window.__render = (t) => {
  css($("#head"), { opacity: P(t, 0.1, 0.8) });
  // wysokość „slotu” każdej wiadomości: najpierw kropki pisania, potem dymek
  const slot = rows.map((r) => { const ty = P(t, r.a - 0.75, 0.45, E.outCubic); const ms = P(t, r.a, 0.45, E.outCubic); return (mix(r.hy, r.hm, ms) + GAP) * ty; });
  rows.forEach((r, i) => {
    let off = 0; for (let j = i + 1; j < N; j++) off += slot[j];
    const typing = t >= r.a - 0.75 && t < r.a;
    const ty = P(t, r.a - 0.75, 0.35, E.outCubic);
    css(r.y, { opacity: typing ? ty : 0, transform: "translateY(" + (-off + (1 - ty) * 12) + "px)" });
    r.y.querySelectorAll("i").forEach((d, k) => { const ph = (t * 1.25 - k * 0.17) % 1; const b = Math.max(0, Math.sin(ph * Math.PI * 2)); css(d, { transform: "translateY(" + -b * 5 + "px)", opacity: 0.4 + 0.6 * b }); });
    const sp = t < r.a ? 0 : E.spring(clamp((t - r.a) / 0.9), 7, 0.5);
    const bub = r.m.querySelector(".bub");
    bub.style.transformOrigin = r.me ? "100% 100%" : "0% 100%";
    bub.style.transform = "scale(" + (0.8 + 0.2 * sp) + ")";
    css(r.m, { opacity: clamp((t - r.a) / 0.18), transform: "translateY(" + (-off + (1 - Math.min(1, sp)) * 18) + "px)" });
  });
  const b = t < A0 + N * STEP - 0.2 ? 0 : E.spring(clamp((t - (A0 + N * STEP - 0.2)) / 0.9), 7, 0.55);
  css($("#badge"), { opacity: clamp((t - (A0 + N * STEP - 0.2)) / 0.2), transform: "scale(" + (0.85 + 0.15 * b) + ")" });
  $("#badge i").style.opacity = 0.6 + 0.4 * Math.cos(t * Math.PI * 1.6);
  ${fadeOut(7.6)}
};`;
  return {
    id: "zapowiedz-03-rozmowa",
    name: "Rozmowa",
    desc: "Dymki czatu: „Kiedy startujecie?” → „Już wkrótce. Zaglądaj na afto.works”, z kropkami pisania i plakietką „Nowa odsłona — wkrótce”.",
    w: W,
    h: H,
    duration: 8.3,
    gifW: 960,
    gifH: 540,
    keys: [0.5, 1.2, 2.0, 3.3, 4.6, 5.6, 6.6, 8.0],
    still: 7.0,
    poster: true,
    html: page({ w: W, h: H, style: BG_STYLE + style, body, script }),
  };
}

/* ---------------- 04 · Premiera (wiązka światła + typografia) ---------------- */
function premiera() {
  const l1 = "Nowa";
  const l2 = "odsłona";
  const chars = (s, row) => [...s].map((ch, i) => `<span class="ch" data-r="${row}" data-i="${i}">${ch}</span>`).join("");
  const style = `
.lit{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(180,162,255,.55) 1px,transparent 1px),linear-gradient(to bottom,rgba(180,162,255,.55) 1px,transparent 1px);background-size:64px 64px;background-position:0 40px}
#beam{position:absolute;top:0;bottom:0;left:0;width:2px;background:linear-gradient(to bottom,transparent,rgba(214,204,255,.95) 30%,rgba(214,204,255,.95) 70%,transparent)}
#beamglow{position:absolute;top:-10%;bottom:-10%;left:0;width:360px;margin-left:-180px;background:radial-gradient(closest-side,rgba(139,108,255,.32),rgba(139,108,255,0))}
#t{position:absolute;left:0;right:0;top:150px;text-align:center;font-weight:500;letter-spacing:-.055em;line-height:.92;font-size:178px}
#t .row{display:block;white-space:nowrap}
.ch{display:inline-block;color:transparent;-webkit-text-stroke:1.2px rgba(239,237,245,.14)}
#dot{color:transparent}
#sub{position:absolute;left:0;right:0;top:560px;display:flex;justify-content:center;align-items:center;gap:22px;font-size:26px;color:${C.muted};letter-spacing:.01em}
#sub .sep{width:44px;height:1px;background:rgba(255,255,255,.25)}
#corner{position:absolute;left:64px;top:56px;display:flex;align-items:center;gap:14px;font-size:19px;color:${C.muted}}
#tag{position:absolute;right:64px;top:60px;font-size:17px;color:${C.dim};letter-spacing:.14em;text-transform:uppercase}
`;
  const body = `
<div class="grid"></div>
<div id="c">
  <div class="lit" id="lit"></div>
  <div id="beamglow"></div><div id="beam"></div>
  <div id="corner">${geoSvg(MARK).replace("<svg", '<svg width="40" height="40"')}<span>afto.works</span></div>
  <div id="tag">Zapowiedź</div>
  <div id="t"><span class="row">${chars(l1, 0)}</span><span class="row">${chars(l2, 1)}<span class="ch" id="dot" data-r="1" data-i="${l2.length}">.</span></span></div>
  <div id="sub"><span class="sep"></span><span id="subt">afto.works · wkrótce</span><span class="sep"></span></div>
</div>`;
  const script = `
const chs = $$(".ch").map((el) => { const r = el.getBoundingClientRect(); return { el, x: r.left + r.width / 2, dot: el.id === "dot" }; });
const X0 = -260, X1 = ${W} + 260, B0 = 0.35, BD = 2.5;
const beamX = (t) => mix(X0, X1, P(t, B0, BD, E.inOutSine));
window.__render = (t) => {
  const bx = beamX(t);
  const vis = P(t, B0, 0.4, E.lin) * (1 - P(t, B0 + BD - 0.4, 0.4, E.lin));
  css($("#beam"), { transform: "translateX(" + bx + "px)", opacity: vis });
  css($("#beamglow"), { transform: "translateX(" + bx + "px)", opacity: vis });
  // podświetlenie siatki wokół wiązki
  const m = "radial-gradient(260px 520px at " + bx + "px 50%,rgba(0,0,0," + (0.75 * vis) + "),transparent 70%)";
  css($("#lit"), { webkitMaskImage: m, maskImage: m });
  chs.forEach((c) => {
    // litera „zapala się”, gdy przejdzie przez nią wiązka
    const tc = B0 + BD * (Math.acos(1 - 2 * clamp((c.x - X0) / (X1 - X0))) / Math.PI);
    const p = P(t, tc - 0.05, 0.9, E.outExpo);
    const glow = Math.exp(-Math.pow((t - tc) / 0.22, 2));
    c.el.style.color = c.dot ? "rgba(139,108,255," + p + ")" : "rgba(239,237,245," + p + ")";
    c.el.style.webkitTextStroke = "1.2px rgba(239,237,245," + (0.14 * (1 - p)) + ")";
    c.el.style.textShadow = "0 0 " + (40 * glow) + "px rgba(180,162,255," + 0.9 * glow + ")";
    c.el.style.transform = "translateY(" + (1 - p) * 10 + "px)";
  });
  const s = P(t, 2.75, 1.0, E.outExpo);
  css($("#sub"), { opacity: s, transform: "translateY(" + (1 - s) * 14 + "px)" });
  $$("#sub .sep").forEach((e) => (e.style.transform = "scaleX(" + P(t, 2.9, 1.0, E.outExpo) + ")"));
  const k = P(t, 0.2, 0.8);
  css($("#corner"), { opacity: k }); css($("#tag"), { opacity: k });
  ${fadeOut(5.85)}
};`;
  return {
    id: "zapowiedz-04-premiera",
    name: "Premiera",
    desc: "Wiązka światła przesuwa się po siatce i „zapala” litery hasła „Nowa odsłona.” — typografia kinetyczna.",
    w: W,
    h: H,
    duration: 6.6,
    gifW: 960,
    gifH: 540,
    keys: [0.3, 0.9, 1.4, 1.9, 2.4, 3.0, 4.5, 6.3],
    still: 4.6,
    poster: true,
    html: page({ w: W, h: H, style: BG_STYLE + style, body, script }),
  };
}

/* ---------------- 05 · Odliczanie (linia → kropka → logotyp) ---------------- */
function odliczanie() {
  const scale = 4.2;
  const ww = 106 * scale;
  const wh = 44 * scale;
  const wx = (W - ww) / 2;
  const wy = 175;
  const CAM = 105; // przesunięcie „kamery” podczas odliczania (kompozycja w środku kadru)
  const dotCx = wx + (WORDMARK.dot.x + 2.5) * scale;
  const dotCy = wy + (WORDMARK.dot.y + 2.5 - 3) * scale;
  const ds = WORDMARK.dot.size * scale;
  const style = `
#nums{position:absolute;left:0;right:0;top:${dotCy - 262}px;height:230px;overflow:hidden;text-align:center;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 22%,#000 78%,transparent)}
.n{position:absolute;left:0;right:0;top:12px;font-size:190px;font-weight:500;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
#lbl{position:absolute;left:${dotCx + ds / 2 - 600}px;width:600px;top:${dotCy + 22}px;display:flex;justify-content:space-between;font-size:17px;color:${C.dim};letter-spacing:.06em}
#lbl b{font-weight:400;color:${C.muted};font-variant-numeric:tabular-nums}
#track{position:absolute;left:${dotCx - 600 + ds / 2}px;width:${600}px;top:${dotCy - 1}px;height:2px;background:rgba(255,255,255,.08)}
#bar{position:absolute;background:${C.accent};box-shadow:0 0 24px rgba(139,108,255,.6)}
.tick{position:absolute;top:${dotCy - 7}px;width:1px;height:14px;background:rgba(255,255,255,.18)}
#wm{position:absolute;left:${wx}px;top:${wy}px;width:${ww}px;height:${wh}px}
#line2{position:absolute;left:0;right:0;top:${wy + wh + 54}px;text-align:center;font-size:58px;font-weight:500;letter-spacing:-.035em}
#line3{position:absolute;left:0;right:0;top:${wy + wh + 136}px;text-align:center;font-size:22px;color:${C.muted};letter-spacing:.02em}
`;
  const L = dotCx + ds / 2 - 600;
  const body = `
<div class="grid"></div><div class="glow" style="opacity:.7"></div>
<div id="c"><div id="cam" class="abs" style="inset:0">
  <div id="lbl"><span>afto.works</span><b id="pct">0%</b></div>
  <div id="nums"><span class="n" id="n0">03</span><span class="n" id="n1">02</span><span class="n" id="n2">01</span></div>
  <div id="track"></div>
  ${[0, 1, 2, 3].map((i) => `<span class="tick" style="left:${L + i * 200}px"></span>`).join("")}
  <div id="bar"></div>
  ${geoSvg(WORDMARK, { id: "wm" })}
  <div id="line2">${words("Startujemy", DOT)}</div>
  <div id="line3">afto.works · nowa odsłona</div>
</div></div>`;
  const script = `
const L = ${L}, R = ${dotCx + ds / 2}, CY = ${dotCy}, DS = ${ds}, DX = ${dotCx};
const nums = [$("#n0"), $("#n1"), $("#n2")];
const NT = [0.35, 1.25, 2.15], END = 3.05;
const strokes = $$("#wm [data-s]"), wdot = $("#wm .dot");
window.__render = (t) => {
  css($("#lbl"), { opacity: IO(t, 0.1, 0.5, END - 0.1, 0.4) });
  const cam = ${CAM} * (1 - P(t, END + 0.1, 1.3, E.inOutQuart));
  $("#cam").style.transform = "translateY(" + cam + "px)";
  // cyfry: wjazd od dołu, wyjazd w górę z rozmyciem
  nums.forEach((n, i) => {
    const a = NT[i], b = i < 2 ? NT[i + 1] : END;
    const pin = P(t, a, 0.55, E.outExpo), pout = P(t, b, 0.45, E.inOutCubic);
    css(n, { transform: "translateY(" + ((1 - pin) * 90 - pout * 90) + "%)", opacity: t < a ? 0 : (1 - pout), filter: "blur(" + (pout * 8 + (1 - pin) * 6) + "px)" });
  });
  // pasek postępu: trzy kroki, potem kurczy się do kwadratu kropki
  const prog = clamp(P(t, 0.3, 0.85, E.inOutCubic) / 3 + P(t, 1.2, 0.85, E.inOutCubic) / 3 + P(t, 2.1, 0.85, E.inOutCubic) / 3);
  $("#pct").textContent = Math.round(prog * 100) + "%";
  const k = P(t, END, 0.75, E.inOutQuart);
  const thick = mix(2, DS, P(t, END + 0.2, 0.55, E.inOutCubic));
  const left = mix(L, DX - DS / 2, k), right = mix(L + (R - L) * prog, DX + DS / 2, k);
  const shown = t < END + 0.95;
  css($("#bar"), { left: left + "px", width: Math.max(0, right - left) + "px", top: CY - thick / 2 + "px", height: thick + "px", opacity: shown ? 1 : 0, borderRadius: mix(2, 0, k) + "px" });
  $("#track").style.opacity = 1 - P(t, END, 0.4, E.lin);
  $$(".tick").forEach((e) => (e.style.opacity = 1 - P(t, END, 0.4, E.lin)));
  // logotyp rysuje się od kropki
  // kolejność od kropki w lewo: o, t, kreska t, f, kreska f, trzon a, brzuszek a
  const ORDER = [1, 5, 6, 3, 4, 2, 0];
  strokes.forEach((s) => { const i = ORDER.indexOf(+s.dataset.s); draw(s, P(t, END + 0.6 + i * 0.11, 0.85, E.inOutQuart)); });
  wdot.style.opacity = t >= END + 0.95 ? 1 : 0;
  const pop = t < END + 0.95 ? 0 : Math.sin(clamp((t - END - 0.95) / 0.35) * Math.PI);
  wdot.setAttribute("transform", "scale(" + (1 + 0.35 * pop) + ")");
  $$("#line2 .w").forEach((w, i) => { const p = P(t, END + 1.3 + i * 0.1, 1.1, E.outExpo); w.style.transform = "translateY(" + (1 - p) * 105 + "%)"; });
  const l3 = P(t, END + 1.7, 0.9, E.outExpo);
  css($("#line3"), { opacity: l3, transform: "translateY(" + (1 - l3) * 12 + "px)" });
  ${fadeOut(6.35)}
};`;
  return {
    id: "zapowiedz-05-odliczanie",
    name: "Odliczanie",
    desc: "„03 · 02 · 01” z paskiem postępu, który kurczy się w kropkę logotypu — afto. rysuje się od kropki, „Startujemy.”",
    w: W,
    h: H,
    duration: 7.1,
    gifW: 960,
    gifH: 540,
    keys: [0.5, 1.5, 2.6, 3.3, 3.7, 4.2, 5.2, 6.8],
    still: 5.8,
    poster: true,
    html: page({ w: W, h: H, style: BG_STYLE + style, body, script }),
  };
}

export const announcements = () => [konstrukcja(), publikacja(), rozmowa(), premiera(), odliczanie()];
