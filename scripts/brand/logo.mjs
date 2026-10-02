// Propozycje rozwinięcia logo (SVG + PNG, awatary 512×512).
// Tekst zamieniany na krzywe (fontkit + Satoshi) — pliki SVG nie wymagają zainstalowanego fontu.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";
import sharp from "sharp";
import wawoff2 from "wawoff2";
import { C, MARK, PUBLIC, ROOT, STROKE, WORDMARK, rel, size } from "./lib.mjs";

const OUT = join(PUBLIC, "brand", "logo-proposals");
const INK = "#F2F1EC"; // BRAND.ink — kolor plików logo
const BLACK = "#0B0B0D";

let fonts = null;
async function font(weight) {
  if (!fonts) {
    const ttf = await wawoff2.decompress(readFileSync(join(ROOT, "src", "fonts", "Satoshi-Variable.woff2")));
    fonts = { base: fontkit.create(Buffer.from(ttf)), cache: {} };
  }
  return (fonts.cache[weight] ??= fonts.base.getVariation({ wght: weight }));
}

/** Tekst jako krzywe. `color(i)` — kolor znaku o indeksie i. Zwraca znaczniki i metryki. */
async function text(str, { size: fs, weight = 500, tracking = 0, color = () => INK }) {
  const f = await font(weight);
  const run = f.layout(str, { liga: false });
  const s = fs / f.unitsPerEm;
  let x = 0;
  const parts = [];
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const d = g.path.toSVG();
    if (d) parts.push(`<path transform="translate(${r(x + pos.xOffset * s)} 0) scale(${r(s, 5)} ${r(-s, 5)})" d="${d}" fill="${color(i)}"/>`);
    x += pos.xAdvance * s + tracking * fs;
  });
  const width = x - tracking * fs;
  return { svg: parts.join(""), width, cap: f.capHeight * s, xh: f.xHeight * s, asc: f.ascent * s, desc: -f.descent * s };
}

/** Tekst po okręgu (pieczęć): środek w (cx, cy), linia bazowa na promieniu R, zaczyna od kąta a0 (stopnie, 0 = góra). */
async function arcText(str, { cx, cy, R, a0, size: fs, weight = 500, tracking = 0, fill = INK }) {
  const f = await font(weight);
  const run = f.layout(str, { liga: false });
  const s = fs / f.unitsPerEm;
  let along = 0;
  const parts = [];
  run.glyphs.forEach((g, i) => {
    const adv = run.positions[i].xAdvance * s;
    const mid = along + adv / 2;
    const ang = a0 + (mid / R) * (180 / Math.PI);
    const d = g.path.toSVG();
    if (d) parts.push(`<path transform="rotate(${r(ang)} ${cx} ${cy}) translate(${r(cx - adv / 2)} ${r(cy - R)}) scale(${r(s, 5)} ${r(-s, 5)})" d="${d}" fill="${fill}"/>`);
    along += adv + tracking * fs;
  });
  return { svg: parts.join(""), length: along - tracking * fs };
}

const r = (v, p = 2) => +v.toFixed(p);

// znak / logotyp jako elementy w układzie jednostek siatki
function geo(g, { ink = INK, accent = C.accent, stroke = STROKE } = {}) {
  return [
    ...g.circles.map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" stroke="${ink}" stroke-width="${stroke}"/>`),
    ...g.paths.map((d) => `<path d="${d}" stroke="${ink}" stroke-width="${stroke}"/>`),
    `<rect x="${g.dot.x}" y="${g.dot.y}" width="${g.dot.size}" height="${g.dot.size}" fill="${accent}"/>`,
  ].join("");
}
// kontur linii: obrys grubości STROKE minus wnętrze
// długość ścieżki znaku (tylko M/V/H/v/h i łuki okręgu — tyle używa geometria logo)
function pathLength(d) {
  let x = 0, y = 0, len = 0;
  for (const [, cmd, args] of d.matchAll(/([MVHvha])([^MVHvha]*)/g)) {
    const n = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (cmd === "M") [x, y] = n;
    else if (cmd === "V") (len += Math.abs(n[0] - y), (y = n[0]));
    else if (cmd === "H") (len += Math.abs(n[0] - x), (x = n[0]));
    else if (cmd === "v") (len += Math.abs(n[0]), (y += n[0]));
    else if (cmd === "h") (len += Math.abs(n[0]), (x += n[0]));
    else if (cmd === "a") {
      const [R, , , , , dx, dy] = n;
      len += 2 * R * Math.asin(Math.min(1, Math.hypot(dx, dy) / (2 * R)));
      x += dx;
      y += dy;
    }
  }
  return len;
}
function contour(g, { ink = INK, hole = C.bg, line = 0.5 } = {}) {
  // wnętrze linii skrócone o grubość obrysu na końcach — zamknięte zakończenia
  const shape = (w, col, inner) =>
    [
      ...g.circles.map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" stroke="${col}" stroke-width="${w}"/>`),
      ...g.paths.map((d) => {
        if (!inner) return `<path d="${d}" stroke="${col}" stroke-width="${w}"/>`;
        // początek: przesunięcie punktu startowego wzdłuż pierwszego odcinka; koniec: kreskowanie
        const [, x0, y0, cmd, v0, rest] = d.match(/^M([\d.]+) ([\d.]+)([VHvh])(-?[\d.]+)(.*)$/);
        let x = +x0, y = +y0, v = +v0;
        if (cmd === "V") y += Math.sign(v - y) * line;
        else if (cmd === "H") x += Math.sign(v - x) * line;
        else if (cmd === "v") (y += Math.sign(v) * line, (v -= Math.sign(v) * line));
        else (x += Math.sign(v) * line, (v -= Math.sign(v) * line));
        const d2 = `M${r(x, 3)} ${r(y, 3)}${cmd}${r(v, 3)}${rest}`;
        const L = pathLength(d2);
        return `<path d="${d2}" stroke="${col}" stroke-width="${w}" stroke-dasharray="${r(L - line, 3)} ${r(L + 10)}"/>`;
      }),
    ].join("");
  return { outer: shape(STROKE + line, ink, false), inner: shape(STROKE - line, hole, true) };
}
// znak umieszczony tak, by jego optyczny środek (22, 25) wypadł w (x, y); u = px na jednostkę
const placeMark = (x, y, u, body) => `<g transform="translate(${r(x - 22 * u)} ${r(y - 25 * u)}) scale(${r(u, 4)})" fill="none">${body}</g>`;

// superelipsa (ikona aplikacji o „ciągłych” narożnikach)
function squircle(cx, cy, rad, n = 5, steps = 240) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    pts.push(`${r(cx + rad * Math.sign(c) * Math.pow(Math.abs(c), 2 / n))},${r(cy + rad * Math.sign(s) * Math.pow(Math.abs(s), 2 / n))}`);
  }
  return `M${pts.join("L")}Z`;
}

const svgDoc = (w, h, body, defs = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;

async function save(name, svg, pngWidth, extra = {}) {
  mkdirSync(OUT, { recursive: true });
  const svgFile = join(OUT, `${name}.svg`);
  writeFileSync(svgFile, svg);
  const files = { svg: { path: rel(svgFile), size: size(svgFile) } };
  const pngFile = join(OUT, `${name}.png`);
  await sharp(Buffer.from(svg), { density: 600 }).resize({ width: pngWidth }).png({ compressionLevel: 9 }).toFile(pngFile);
  files.png = { path: rel(pngFile), size: size(pngFile) };
  if (extra.avatar) {
    const avFile = join(OUT, `${name}-512.png`);
    await sharp(Buffer.from(svg), { density: 600 }).resize(512, 512).png({ compressionLevel: 9 }).toFile(avFile);
    files.avatar = { path: rel(avFile), size: size(avFile) };
  }
  return files;
}

/* ---------- propozycje ---------- */

// 01 · ikona aplikacji (superelipsa), ciemna i fioletowa
async function ikona() {
  const S = 1024;
  const u = 15.2;
  const shape = squircle(S / 2, S / 2, S / 2 - 4);
  const dark = svgDoc(
    S,
    S,
    `<path d="${shape}" fill="url(#g)"/><path d="${shape}" stroke="rgba(255,255,255,.09)" stroke-width="3" transform="translate(${S / 2} ${S / 2}) scale(.994) translate(${-S / 2} ${-S / 2})"/>${placeMark(S / 2, S / 2, u, geo(MARK))}`,
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17161f"/><stop offset="1" stop-color="#09090c"/></linearGradient>`,
  );
  const violet = svgDoc(
    S,
    S,
    `<path d="${shape}" fill="url(#g)"/>${placeMark(S / 2, S / 2, u, geo(MARK, { ink: "#FFFFFF", accent: C.bg }))}`,
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9579ff"/><stop offset="1" stop-color="#7a5af5"/></linearGradient>`,
  );
  return [
    { id: "logo-01-ikona-ciemna", name: "Ikona aplikacji — ciemna", desc: "Superelipsa o ciągłych narożnikach (jak iOS), delikatne światło od góry, monogram w optycznym środku.", bg: "#15151c", files: await save("logo-01-ikona-ciemna", dark, 1024, { avatar: true }) },
    { id: "logo-01-ikona-fiolet", name: "Ikona aplikacji — fiolet", desc: "Wersja w kolorze marki: biała linia, kropka w kolorze tła — odwrócony akcent.", bg: "#15151c", files: await save("logo-01-ikona-fiolet", violet, 1024, { avatar: true }) },
  ];
}

// 02 · awatar w kole (Discord) — orbita z kropką
async function awatar() {
  const S = 512;
  const c = S / 2;
  const u = 6.6;
  const R = 206;
  // orbita: okrąg z przerwą, w której „leży” kwadrat w kolorze akcentu
  const gap = 16; // stopnie
  const a1 = ((-45 + gap / 2) * Math.PI) / 180;
  const a2 = ((-45 - gap / 2 + 360) * Math.PI) / 180;
  const p = (a) => `${r(c + R * Math.cos(a))} ${r(c + R * Math.sin(a))}`;
  const sq = 13;
  const qa = (-45 * Math.PI) / 180;
  const body = `<circle cx="${c}" cy="${c}" r="${c}" fill="url(#g)"/>
<path d="M${p(a1)}A${R} ${R} 0 1 1 ${p(a2)}" stroke="${C.accent}" stroke-opacity=".55" stroke-width="2.5"/>
<rect x="${r(c + R * Math.cos(qa) - sq / 2)}" y="${r(c + R * Math.sin(qa) - sq / 2)}" width="${sq}" height="${sq}" fill="${C.accent}" transform="rotate(45 ${r(c + R * Math.cos(qa))} ${r(c + R * Math.sin(qa))})"/>
${placeMark(c, c, u, geo(MARK))}`;
  const svg = svgDoc(S, S, body, `<radialGradient id="g" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#1a1726"/><stop offset="1" stop-color="#08080b"/></radialGradient>`);
  return [{ id: "logo-02-awatar-orbita", name: "Awatar — orbita", desc: "Okrągły awatar 512×512 (Discord): monogram w środku, fioletowa orbita z kwadratową kropką w przerwie.", bg: "#15151c", round: true, files: await save("logo-02-awatar-orbita", svg, 1024, { avatar: true }) }];
}

// 03 · układ pionowy: znak + afto.works + linia usług
async function pionowy() {
  const W = 1000;
  const name = await text("afto.works", { size: 118, tracking: -0.035, color: (i) => (i === 4 ? C.accent : INK) });
  const tag = await text("STRONY  ·  SKLEPY  ·  IDENTYFIKACJA", { size: 26, tracking: 0.16, color: () => "#9B98A8" });
  const u = 9;
  const markTop = 70;
  const markC = markTop + 17.5 * u; // optyczny środek (wysokość 35 jednostek)
  const base = markTop + 35 * u + 70 + name.cap;
  const tagBase = base + 92;
  const H = tagBase + 80;
  const body = (ink, muted, accent = C.accent) =>
    `${placeMark(W / 2, markC, u, geo(MARK, { ink, accent }))}
<g transform="translate(${r((W - name.width) / 2)} ${r(base)})">${name.svg.replaceAll(INK, ink)}</g>
<g transform="translate(${r((W - tag.width) / 2)} ${r(tagBase)})">${tag.svg.replaceAll("#9B98A8", muted)}</g>`;
  const dark = svgDoc(W, Math.round(H), body(INK, "#9B98A8"));
  const light = svgDoc(W, Math.round(H), body(BLACK, "#5d5a68"));
  return [
    { id: "logo-03-pionowy", name: "Układ pionowy", desc: "Monogram nad nazwą „afto.works” i linią usług — do stopek, okładek i profili.", bg: C.bg, files: await save("logo-03-pionowy", dark, 2000) },
    { id: "logo-03-pionowy-jasne-tlo", name: "Układ pionowy — jasne tło", desc: "Ta sama kompozycja w czerni do druku i jasnych tła.", bg: INK, files: await save("logo-03-pionowy-jasne-tlo", light, 2000) },
  ];
}

// 04 · kontur — linia zamieniona w podwójny obrys (styl techniczny)
async function kontur() {
  const u = 20;
  const pad = 2;
  const make = (g, w) => {
    const { outer, inner } = contour(g, { line: 0.55 });
    const [vx, vy, vw, vh] = g.viewBox.split(" ").map(Number);
    const W = (vw + pad * 2) * u;
    const H = (vh + pad * 2) * u;
    // przezroczysty środek: maska zamiast koloru tła
    const body = `<mask id="m" maskUnits="userSpaceOnUse" x="${vx - pad}" y="${vy - pad}" width="${vw + 2 * pad}" height="${vh + 2 * pad}"><rect x="${vx - pad}" y="${vy - pad}" width="${vw + 2 * pad}" height="${vh + 2 * pad}" fill="#000"/><g fill="none">${outer.replaceAll(INK, "#fff")}${inner.replaceAll(C.bg, "#000")}</g></mask>
<g transform="scale(${u}) translate(${pad - vx} ${pad - vy})"><rect x="${vx - pad}" y="${vy - pad}" width="${vw + 2 * pad}" height="${vh + 2 * pad}" fill="${INK}" mask="url(#m)"/><rect x="${g.dot.x}" y="${g.dot.y}" width="${g.dot.size}" height="${g.dot.size}" fill="${C.accent}"/></g>`;
    return { svg: svgDoc(W, H, body), w };
  };
  const mark = make(MARK, 1024);
  const word = make(WORDMARK, 2400);
  return [
    { id: "logo-04-kontur-znak", name: "Kontur — monogram", desc: "Linia znaku jako cienki podwójny obrys, pełna tylko kropka — wariant techniczny/blueprint.", bg: C.bg, files: await save("logo-04-kontur-znak", mark.svg, mark.w) },
    { id: "logo-04-kontur-logotyp", name: "Kontur — logotyp", desc: "Logotyp „afto.” w tym samym stylu obrysu — na duże formaty, nadruki, tła wideo.", bg: C.bg, files: await save("logo-04-kontur-logotyp", word.svg, word.w) },
  ];
}

// 05 · układ poziomy z hasłem
async function poziomy() {
  const u = 6;
  const name = await text("afto.works", { size: 92, tracking: -0.035, color: (i) => (i === 4 ? C.accent : INK) });
  const tag = await text("Projektowanie stron i identyfikacji", { size: 34, tracking: -0.01, color: () => "#9B98A8" });
  const pad = 40;
  const markW = 35 * u;
  const H = 300;
  const divX = pad + markW + 56;
  const tx = divX + 56;
  const W = Math.round(tx + Math.max(name.width, tag.width) + pad);
  const nameBase = H / 2 - 8;
  const tagBase = nameBase + 62;
  const body = (ink, muted, line) => `${placeMark(pad + markW / 2, H / 2, u, geo(MARK, { ink }))}
<rect x="${divX}" y="${H / 2 - 80}" width="2" height="160" fill="${line}"/>
<g transform="translate(${tx} ${nameBase})">${name.svg.replaceAll(INK, ink)}</g>
<g transform="translate(${tx + 2} ${tagBase})">${tag.svg.replaceAll("#9B98A8", muted)}</g>`;
  return [
    { id: "logo-05-poziomy", name: "Układ poziomy z hasłem", desc: "Monogram | nazwa i hasło „Projektowanie stron i identyfikacji” — do stopek maili, faktur, nagłówków.", bg: C.bg, files: await save("logo-05-poziomy", svgDoc(W, H, body(INK, "#9B98A8", "rgba(242,241,236,.18)")), 2400) },
    { id: "logo-05-poziomy-jasne-tlo", name: "Układ poziomy — jasne tło", desc: "Wersja na jasne tło (dokumenty, oferty PDF).", bg: INK, files: await save("logo-05-poziomy-jasne-tlo", svgDoc(W, H, body(BLACK, "#5d5a68", "rgba(11,11,13,.18)")), 2400) },
  ];
}

// 06 · pieczęć — napis po okręgu
async function pieczec() {
  const S = 512;
  const c = S / 2;
  const R = 196;
  const items = ["AFTO.WORKS", "STRONY", "SKLEPY", "IDENTYFIKACJA"];
  const fs = 25;
  // dobór odstępów, by napis z separatorami wypełnił cały obwód
  const circ = 2 * Math.PI * R;
  const sepGap = 46; // miejsce na kwadrat-separator
  const measure = async (tr) => {
    let total = 0;
    for (const s of items) total += (await arcText(s, { cx: c, cy: c, R, a0: 0, size: fs, tracking: tr })).length;
    return total + items.length * sepGap;
  };
  let tr = 0.12;
  for (let k = 0; k < 30; k++) {
    const len = await measure(tr);
    const chars = items.join("").length - items.length;
    tr += (circ - len) / (chars * fs) / 1.5;
  }
  let a = -((await arcText(items[0], { cx: c, cy: c, R, a0: 0, size: fs, tracking: tr })).length / 2 / R) * (180 / Math.PI);
  const parts = [];
  for (const s of items) {
    const t = await arcText(s, { cx: c, cy: c, R, a0: a, size: fs, tracking: tr, fill: s === "AFTO.WORKS" ? INK : "#B9B6C4" });
    parts.push(t.svg);
    a += (t.length / R) * (180 / Math.PI);
    const mid = a + (sepGap / 2 / R) * (180 / Math.PI);
    parts.push(`<rect x="${c - 4.5}" y="${c - R + fs * 0.36 - 4.5}" width="9" height="9" fill="${C.accent}" transform="rotate(${r(mid)} ${c} ${c})"/>`);
    a += (sepGap / R) * (180 / Math.PI);
  }
  const body = `<circle cx="${c}" cy="${c}" r="${c}" fill="url(#g)"/>
<circle cx="${c}" cy="${c}" r="${c - 12}" stroke="rgba(242,241,236,.12)" stroke-width="1.5"/>
<circle cx="${c}" cy="${c}" r="${R - 26}" stroke="${C.accent}" stroke-opacity=".45" stroke-width="1.5"/>
${parts.join("")}
${placeMark(c, c, 5.2, geo(MARK))}`;
  const svg = svgDoc(S, S, body, `<radialGradient id="g" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#16141f"/><stop offset="1" stop-color="#08080b"/></radialGradient>`);
  return [{ id: "logo-06-pieczec", name: "Pieczęć", desc: "Okrągła pieczęć: napis „AFTO.WORKS · STRONY · SKLEPY · IDENTYFIKACJA” po okręgu, monogram w środku — awatar, naklejki, znak wodny.", bg: "#15151c", round: true, files: await save("logo-06-pieczec", svg, 1024, { avatar: true }) }];
}

export async function buildLogos(only) {
  const all = [ikona, awatar, pionowy, kontur, poziomy, pieczec];
  const out = [];
  for (const fn of all) {
    for (const e of await fn()) {
      if (only && !e.id.includes(only) && only !== "logo") continue;
      out.push(e);
      console.log(`  ✓ ${e.id}  ${Object.entries(e.files).map(([k, v]) => `${k} ${(v.size / 1024).toFixed(0)} kB`).join(" · ")}`);
    }
  }
  return out;
}
