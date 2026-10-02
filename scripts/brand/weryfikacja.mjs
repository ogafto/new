// „Zweryfikuj się” — banery dla bota weryfikacji (1500×500 i 1500×300), 2 propozycje.
// Tekst stoi przez całą pętlę (czytelny w każdej chwili), animuje się tylko mikro-interakcja.
import { C, MARK, geoSvg, page } from "./lib.mjs";
import { GRAIN, KINO_CSS, ambient } from "./kino.mjs";

const GROUP = "Weryfikacja";
const SHIELD = "M12 2.6l7.6 3.1v5.8c0 4.7-3.2 8.5-7.6 10-4.4-1.5-7.6-5.3-7.6-10V5.7z";
const CHECK = "M8.3 12.3l2.6 2.6 4.9-5.1";
const mark = (s, id = "") => geoSvg(MARK, id ? { id } : {}).replace("<svg", `<svg width="${s}" height="${s}"`);

const brandRow = (s) => `<div class="brand">${mark(s)}<span>afto.works</span></div>`;
const COMMON = `
.brand{display:flex;align-items:center;gap:12px;font-size:20px;color:${C.muted};letter-spacing:-.005em}
.ttl{font-weight:500;letter-spacing:-.05em;line-height:1;white-space:nowrap}
.sub{color:${C.muted};letter-spacing:-.01em;line-height:1.35}
.st{display:inline-flex;align-items:center;gap:11px;height:44px;padding:0 18px 0 15px;border-radius:999px;font-size:18px;color:${C.ink};background:rgba(255,255,255,.05);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.08);white-space:nowrap}
.sd{position:relative;width:9px;height:9px;border-radius:50%}
.sd b{position:absolute;inset:0;border-radius:50%;background:inherit}
`;

// stan statusu w czasie: oczekuje → sprawdzanie → zweryfikowano
const statusJs = (A, B, R) => `
function status(t, el, dotEl, pingEl) {
  const st = t >= ${B} && t < ${R} ? 2 : t >= ${A} && t < ${B} ? 1 : 0;
  const lab = ["Oczekuje na weryfikację", "Sprawdzanie" + ".".repeat(1 + (Math.floor(t * 4) % 3)), "Zweryfikowano"][st];
  el.textContent = lab;
  dotEl.style.background = ["#d8a64a", "${C.accent2}", "${C.green}"][st];
  const pg = (t % 1.2) / 1.2; css(pingEl, { opacity: 0.7 * (1 - pg), transform: "scale(" + (1 + pg * 2) + ")" });
  return st;
}`;

/* ---------- 01 · Tarcza: skan i znacznik ---------- */
function tarcza({ w, h }) {
  const D = 6;
  const tall = h >= 450;
  const L = tall ? { tile: 290, tx: 130, ty: 105, sh: 168, x: 520, brandY: 112, tY: 168, fs: 104, sY: 298, sfs: 27, stY: 372 } : { tile: 196, tx: 70, ty: 52, sh: 112, x: 330, brandY: 64, tY: 104, fs: 76, sY: 196, sfs: 22, stY: null };
  const amb = ambient({
    w,
    h,
    D,
    seed: tall ? 71 : 72,
    particles: tall ? 40 : 28,
    floorTop: tall ? 0.74 : 0.8,
    aurora: [
      { x: L.tx + L.tile / 2, y: L.ty + L.tile / 2, r: L.tile * 1.1, color: "rgba(139,108,255,.9)", a: 0.4, dx: 16, dy: 10 },
      { x: w * 0.82, y: h * 0.2, r: h * 0.9, color: "rgba(91,63,214,.85)", a: 0.18, dx: 40, dy: 16 },
    ],
  });
  const style = `${KINO_CSS}${COMMON}
#tw{position:absolute;left:${L.tx}px;top:${L.ty}px;width:${L.tile}px;height:${L.tile}px;perspective:900px}
#tile{position:absolute;inset:0;border-radius:${L.tile * 0.24}px}
#sh{position:absolute;left:50%;top:50%;width:${L.sh}px;height:${L.sh}px;margin:${-L.sh / 2}px 0 0 ${-L.sh / 2}px;overflow:visible}
#scan{position:absolute;left:12%;right:12%;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#efeaff 30%,#efeaff 70%,transparent);box-shadow:0 0 16px 3px rgba(139,108,255,.8)}
#scanf{position:absolute;left:12%;right:12%;height:60px;background:linear-gradient(to top,rgba(139,108,255,.28),transparent)}
#rip{position:absolute;left:${L.tx}px;top:${L.ty}px;width:${L.tile}px;height:${L.tile}px;border-radius:${L.tile * 0.24}px;border:2px solid ${C.accent2};pointer-events:none}
.brand{position:absolute;left:${L.x}px;top:${L.brandY}px}
#t{position:absolute;left:${L.x - 4}px;top:${L.tY}px;font-size:${L.fs}px}
#s{position:absolute;left:${L.x}px;top:${L.sY}px;font-size:${L.sfs}px;max-width:${tall ? 880 : 760}px}
#stw{position:absolute;${tall ? `left:${L.x}px;top:${L.stY}px` : `right:60px;top:${h / 2 - 22}px`}}
`;
  const body = `${amb.html}
<div id="c" class="abs" style="inset:0">
  <div id="tw"><div id="tile" class="glass">
    <svg id="sh" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path id="shf" d="${SHIELD}" fill="rgba(139,108,255,.0)"/>
      <path id="sho" d="${SHIELD}" stroke="${C.ink}" stroke-width="1.35" pathLength="1"/>
      <path id="chk" d="${CHECK}" stroke="${C.accent2}" stroke-width="1.6" pathLength="1"/>
    </svg>
    <div id="scanf"></div><div id="scan"></div>
  </div></div>
  <span id="rip" style="opacity:0"></span>
  ${brandRow(tall ? 34 : 28)}
  <div id="t" class="ttl">Zweryfikuj się<span style="color:${C.accent}">.</span></div>
  <div id="s" class="sub">${tall ? "Kliknij przycisk poniżej, aby uzyskać dostęp do serwera." : "Kliknij przycisk poniżej, aby uzyskać dostęp."}</div>
  <div id="stw"><span class="st"><span class="sd" id="sd"><b id="sp"></b></span><span id="stl">Oczekuje na weryfikację</span></span></div>
</div>${GRAIN}`;
  const A = 1.2;
  const B = 2.75;
  const R = 5.2;
  const script = `${amb.js}${statusJs(A, B, R)}
const TH = ${L.tile};
window.__render = (t) => {
  amb(t);
  const ph = (t / ${D}) * Math.PI * 2;
  css($("#tile"), { transform: "rotateX(" + (Math.sin(ph) * 6).toFixed(2) + "deg) rotateY(" + (Math.cos(ph) * 10 - 4).toFixed(2) + "deg)" });
  glint($("#tile"), t, ${B} + 0.1, 1.1);
  // obrys tarczy zawsze widoczny; skan od góry do dołu, potem znacznik
  draw($("#sho"), 1);
  const sp = P(t, ${A}, ${B - A - 0.1}, E.inOutSine), scanOn = t >= ${A} && t < ${B};
  const y = mix(TH * 0.16, TH * 0.84, sp);
  css($("#scan"), { top: y + "px", opacity: scanOn ? Math.sin(sp * Math.PI) * 0.9 + 0.1 : 0 });
  css($("#scanf"), { top: y - 60 + "px", opacity: scanOn ? Math.sin(sp * Math.PI) : 0 });
  // znacznik rysuje się, a przy powrocie tylko gaśnie (zaokrąglone końce nie zostawiają kropki)
  const dp = P(t, ${B}, 0.6, E.inOutQuart), ok = dp * (1 - P(t, ${R}, 0.5, E.inOutCubic));
  draw($("#chk"), dp);
  $("#chk").style.opacity = t < ${B} ? 0 : Math.min(1, dp * 8) * (1 - P(t, ${R}, 0.5, E.inOutCubic));
  $("#chk").style.filter = "drop-shadow(0 0 " + (6 * ok).toFixed(1) + "px rgba(180,162,255,.95))";
  $("#shf").setAttribute("fill", "rgba(139,108,255," + (0.22 * ok).toFixed(3) + ")");
  $("#sho").setAttribute("stroke", ok > 0.5 ? "#ffffff" : "${C.ink}");
  const rp = P(t, ${B} + 0.3, 1.2, E.outCubic); css($("#rip"), { opacity: t < ${B} + 0.3 ? 0 : 0.7 * (1 - rp), transform: "scale(" + (1 + rp * 0.22) + ")" });
  const st = status(t, $("#stl"), $("#sd"), $("#sp"));
  $(".st").style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px " + (st === 2 ? "rgba(52,211,153,.45)" : "rgba(255,255,255,.08)");
};`;
  return {
    id: `weryfikacja-01-tarcza-${w}x${h}`,
    title: `Weryfikacja — tarcza (${w} × ${h})`,
    description: "„Zweryfikuj się.” z podpisem; w szklanym kaflu tarcza skanowana świetlną linią, potem rysuje się znacznik, fala światła, a status zmienia się z „Oczekuje na weryfikację” przez „Sprawdzanie…” na „Zweryfikowano”.",
    group: GROUP,
    w,
    h,
    duration: D,
    gifFps: 20,
    gifLossy: 14,
    still: 3.8,
    poster: true,
    keys: [0.3, 1.6, 2.2, 3.0, 3.8, 5.6],
    html: page({ w, h, style, body, script }),
  };
}

/* ---------- 02 · Przycisk: kursor klika „Zweryfikuj” ---------- */
function przycisk({ w, h }) {
  const D = 6;
  const tall = h >= 450;
  const L = tall
    ? { x: 110, brandY: 120, tY: 176, fs: 100, sY: 302, sfs: 27, card: { x: 930, y: 110, w: 470, h: 280 } }
    : { x: 72, brandY: 62, tY: 100, fs: 74, sY: 192, sfs: 22, card: null };
  const amb = ambient({
    w,
    h,
    D,
    seed: tall ? 81 : 82,
    particles: tall ? 40 : 28,
    floorTop: tall ? 0.74 : 0.8,
    aurora: [
      { x: tall ? 1165 : 1200, y: h / 2, r: tall ? 360 : 260, color: "rgba(139,108,255,.9)", a: 0.36, dx: 20, dy: 12 },
      { x: 260, y: h * 0.1, r: h * 0.8, color: "rgba(91,63,214,.85)", a: 0.16, dx: 40, dy: 16 },
    ],
  });
  const btnW = tall ? 360 : 330;
  const btnH = tall ? 78 : 74;
  const style = `${KINO_CSS}${COMMON}
.brand{position:absolute;left:${L.x}px;top:${L.brandY}px}
#t{position:absolute;left:${L.x - 4}px;top:${L.tY}px;font-size:${L.fs}px}
#s{position:absolute;left:${L.x}px;top:${L.sY}px;font-size:${L.sfs}px}
#card{position:absolute;${L.card ? `left:${L.card.x}px;top:${L.card.y}px;width:${L.card.w}px;height:${L.card.h}px` : "display:none"};border-radius:30px}
#card .hd{position:absolute;left:28px;top:26px;right:28px;display:flex;align-items:center;gap:14px}
#card .av{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:linear-gradient(160deg,#1b1a24,#0b0b0f);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
#card .nm{font-size:18px;font-weight:500}
#card .ds{font-size:14.5px;color:${C.muted};margin-top:2px}
#card .ln{position:absolute;left:28px;right:28px;top:96px;height:1px;background:rgba(255,255,255,.08)}
#btn{position:absolute;${tall ? `left:${L.card.x + (L.card.w - btnW) / 2}px;top:${L.card.y + L.card.h - btnH - 34}px` : `right:90px;top:${h / 2 - btnH / 2}px`};width:${btnW}px;height:${btnH}px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:14px;font-size:${tall ? 26 : 25}px;font-weight:500;letter-spacing:-.02em;color:#fff;background:${C.accent};overflow:hidden}
#btn .lab{position:absolute;display:flex;align-items:center;gap:12px;white-space:nowrap}
#spin{position:absolute;width:30px;height:30px}
#cur{position:absolute;left:0;top:0;z-index:5}
#ring{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;border:2.5px solid ${C.accent2};opacity:0}
#bglow{position:absolute;pointer-events:none;border-radius:999px}
`;
  const body = `${amb.html}
<div id="c" class="abs" style="inset:0">
  ${brandRow(tall ? 34 : 28)}
  <div id="t" class="ttl">Zweryfikuj się<span style="color:${C.accent}">.</span></div>
  <div id="s" class="sub">${tall ? "Kliknij przycisk, aby odblokować kanały<br>i dołączyć do społeczności." : "Kliknij przycisk, aby odblokować kanały."}</div>
  <div id="card" class="glass"><div class="hd"><span class="av">${mark(30)}</span><div><div class="nm">afto. · weryfikacja</div><div class="ds">Jeden klik i jesteś w środku.</div></div></div><div class="ln"></div></div>
  <div id="bglow"></div>
  <div id="btn"><span class="lab" id="l0"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${SHIELD}"/></svg>Zweryfikuj</span>
    <svg id="spin" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="12" stroke="rgba(255,255,255,.25)" stroke-width="3"/><circle id="sa" cx="15" cy="15" r="12" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="22 100"/></svg>
    <span class="lab" id="l2"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path id="ck" d="M5 12.5l4.6 4.6L19 7.6" pathLength="1"/></svg>Zweryfikowano</span>
  </div>
</div>
<div id="cur"><span id="ring"></span><svg id="arrow" width="${tall ? 36 : 32}" height="${tall ? 36 : 32}" viewBox="0 0 18 18" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.6));transform-origin:2px 2px"><path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" stroke-width="1.2" stroke-linejoin="round"/></svg></div>
${GRAIN}`;
  const script = `${amb.js}
const br = $("#btn").getBoundingClientRect(), bx = br.left + br.width * 0.56, by = br.top + br.height * 0.62;
const CLICK = 1.75, DONE = 2.9, RESET = 5.0;
const keys = [[0, ${w} + 60, ${h} * 0.85], [0.6, ${w} + 60, ${h} * 0.85], [CLICK - 0.05, bx, by], [CLICK + 0.7, bx, by], [CLICK + 1.8, ${w} + 60, ${h} * 0.95]];
window.__render = (t) => {
  amb(t);
  const ph = (t / ${D}) * Math.PI * 2;
  const c = track(t, keys, E.inOutCubic);
  $("#cur").style.transform = "translate(" + (c.x - 4) + "px," + (c.y - 3) + "px)";
  const hover = P(t, CLICK - 0.4, 0.3, E.outCubic) * (1 - P(t, CLICK + 0.05, 0.2, E.lin));
  const press = t >= CLICK && t < CLICK + 0.26 ? Math.sin(((t - CLICK) / 0.26) * Math.PI) : 0;
  $("#arrow").style.transform = "scale(" + (1 - press * 0.2) + ")";
  const rp = P(t, CLICK, 0.6, E.outCubic); css($("#ring"), { opacity: t >= CLICK ? 1 - rp : 0, transform: "scale(" + (0.3 + rp * 1.4) + ")" });
  // przycisk: najechanie → kliknięcie → ładowanie → zweryfikowano → powrót
  const busy = t >= CLICK + 0.1 && t < DONE, done = t >= DONE && t < RESET;
  const g = P(t, DONE, 0.5, E.outCubic) * (1 - P(t, RESET, 0.5, E.inOutCubic));
  const col = [mix(139, 16, g), mix(108, 185, g), mix(255, 129, g)].map(Math.round);
  const bob = 1 + Math.sin(ph * 2) * 0.006;
  css($("#btn"), { background: "rgb(" + col.join(",") + ")", transform: "scale(" + ((1 + hover * 0.03 - press * 0.05) * bob).toFixed(4) + ")", boxShadow: "0 22px 60px -16px rgba(" + col.join(",") + "," + (0.55 + 0.3 * hover) + "),inset 0 1px 0 rgba(255,255,255,.3)" });
  css($("#l0"), { opacity: 1 - P(t, CLICK + 0.05, 0.2, E.lin) + P(t, RESET + 0.15, 0.4, E.lin), transform: "translateY(" + (t > RESET ? 24 * (1 - P(t, RESET + 0.15, 0.6, E.outExpo)) : -24 * P(t, CLICK + 0.05, 0.3)) + "px)" });
  css($("#spin"), { opacity: busy ? Math.min(1, (t - CLICK - 0.1) / 0.2) * (1 - P(t, DONE - 0.15, 0.15, E.lin)) : 0, transform: "rotate(" + t * 540 + "deg)" });
  const dl = P(t, DONE, 0.4, E.outExpo) * (1 - P(t, RESET, 0.3, E.lin));
  css($("#l2"), { opacity: dl, transform: "translateY(" + (1 - P(t, DONE, 0.6, E.outExpo)) * 20 + "px)" });
  draw($("#ck"), P(t, DONE + 0.1, 0.5, E.inOutQuart));
  // poświata pod przyciskiem
  css($("#bglow"), { left: br.left - 40 + "px", top: br.top - 30 + "px", width: br.width + 80 + "px", height: br.height + 60 + "px", background: "radial-gradient(closest-side,rgba(" + col.join(",") + ",.45),transparent)", opacity: 0.6 + 0.4 * hover + 0.4 * g });
  glint($("#card"), t, DONE + 0.1, 1.2);
};`;
  return {
    id: `weryfikacja-02-przycisk-${w}x${h}`,
    title: `Weryfikacja — przycisk (${w} × ${h})`,
    description: "„Zweryfikuj się.” z podpisem; kursor najeżdża na fioletowy przycisk „Zweryfikuj”, klika, przycisk ładuje i zmienia się w zielone „✓ Zweryfikowano”, po czym wraca do stanu wyjściowego.",
    group: GROUP,
    w,
    h,
    duration: D,
    gifFps: 20,
    gifLossy: 14,
    still: 3.6,
    poster: true,
    keys: [0.3, 1.5, 1.85, 2.4, 3.4, 5.4],
    html: page({ w, h, style, body, script }),
  };
}

export const verification = () => [tarcza({ w: 1500, h: 500 }), tarcza({ w: 1500, h: 300 }), przycisk({ w: 1500, h: 500 }), przycisk({ w: 1500, h: 300 })];
