"use client";

import { useEffect, useState } from "react";
import { BRAND, MARK, STROKE, WORDMARK } from "@/lib/logo";

/*
 * Animowane logo jako czysta funkcja czasu `t` (sekundy).
 * Ten sam kod odtwarza animację na stronie i renderuje klatki do GIF-ów (npm run logo:gif).
 */

export type Variant = "mark" | "logo" | "banner" | "square";
export const LOOP: Record<Variant, number> = { mark: 4.8, logo: 5.2, banner: 6.4, square: 6.4 };
export const SIZE: Record<Variant, [number, number]> = { mark: [1080, 1080], logo: [1600, 800], banner: [1500, 500], square: [1080, 1080] };

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const backOut = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
// postęp rysowania: wejście [a,b], zejście [c,d]
const seg = (t: number, a: number, b: number, c: number, d: number) => (t < c ? inOut(clamp((t - a) / (b - a))) : 1 - inOut(clamp((t - c) / (d - c))));

function Strokes({ geo, t, start, out, color }: { geo: typeof MARK | typeof WORDMARK; t: number; start: number; out: number; color: string }) {
  const items = [...geo.circles.map((c) => ({ c })), ...geo.paths.map((d) => ({ d }))];
  return (
    <>
      {items.map((it, i) => {
        const p = seg(t, start + i * 0.16, start + i * 0.16 + 0.75, out + i * 0.06, out + i * 0.06 + 0.6);
        // przy pełnym narysowaniu bez dasharray — inaczej na okręgu zostaje szew
        const dash = p >= 0.999 ? {} : { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p };
        const props = { stroke: color, strokeWidth: STROKE, fill: "none", opacity: p > 0.001 ? 1 : 0, ...dash };
        return "c" in it && it.c ? <circle key={i} cx={it.c.cx} cy={it.c.cy} r={it.c.r} {...props} /> : <path key={i} d={(it as { d: string }).d} {...props} />;
      })}
    </>
  );
}

function Dot({ geo, t, at, out }: { geo: typeof MARK | typeof WORDMARK; t: number; at: number; out: number }) {
  const s = t < out ? (t < at ? 0 : backOut(clamp((t - at) / 0.45))) : 1 - inOut(clamp((t - out) / 0.35));
  const { x, y, size } = geo.dot;
  return (
    <rect x={x} y={y} width={size} height={size} fill={BRAND.accent} transform={`translate(${x + size / 2} ${y + size / 2}) scale(${Math.max(0, s)}) translate(${-x - size / 2} ${-y - size / 2})`} />
  );
}

export function LogoFrame({ variant, t, light = false }: { variant: Variant; t: number; light?: boolean }) {
  const bg = light ? BRAND.ink : "#07070a";
  const ink = light ? BRAND.black : BRAND.ink;
  const [w, h] = SIZE[variant];
  const L = LOOP[variant];
  const out = L - 1.1;

  if (variant === "mark") {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block", background: bg }}>
        <svg x={w * 0.3} y={h * 0.3} width={w * 0.4} height={h * 0.4} viewBox={MARK.viewBox} overflow="visible">
          <Strokes geo={MARK} t={t} start={0.25} out={out} color={ink} />
          <Dot geo={MARK} t={t} at={1.25} out={out} />
        </svg>
      </svg>
    );
  }

  if (variant === "logo") {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block", background: bg }}>
        <svg x={w * 0.12} y={h * 0.32} width={h * 0.36} height={h * 0.36} viewBox={MARK.viewBox} overflow="visible">
          <Strokes geo={MARK} t={t} start={0.2} out={out} color={ink} />
          <Dot geo={MARK} t={t} at={1.1} out={out} />
        </svg>
        <svg x={w * 0.12 + h * 0.36 + w * 0.04} y={h * 0.32} width={((h * 0.36) / 44) * 106} height={h * 0.36} viewBox={WORDMARK.viewBox} overflow="visible">
          <Strokes geo={WORDMARK} t={t} start={0.7} out={out} color={ink} />
          <Dot geo={WORDMARK} t={t} at={2.0} out={out} />
        </svg>
      </svg>
    );
  }

  // banner / square: znak + hasło
  const lines = ["Strony, które", "wyglądają drogo.", "I sprzedają."];
  const square = variant === "square";
  const fs = square ? 92 : 64;
  const tx = square ? 90 : 560;
  const ty = square ? 600 : 170;
  const lineIn = (i: number) => {
    const a = 1.2 + i * 0.22;
    const p = t < out ? inOut(clamp((t - a) / 0.7)) : 1 - inOut(clamp((t - out) / 0.5));
    return p;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block", background: bg, fontFamily: "var(--font-satoshi), sans-serif" }}>
      <defs>
        <clipPath id={`c-${variant}`}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c-${variant})`}>
        {Array.from({ length: Math.ceil(w / 60) + 1 }).map((_, i) => (
          <line key={i} x1={i * 60} y1="0" x2={i * 60} y2={h} stroke="#ffffff" strokeOpacity="0.045" />
        ))}
      </g>
      <svg x={square ? 90 : 120} y={square ? 120 : 130} width={square ? 300 : 240} height={square ? 300 : 240} viewBox={MARK.viewBox} overflow="visible">
        <Strokes geo={MARK} t={t} start={0.2} out={out} color={ink} />
        <Dot geo={MARK} t={t} at={1.0} out={out} />
      </svg>
      {lines.map((l, i) => {
        const p = lineIn(i);
        return (
          <text
            key={l}
            x={tx}
            y={ty + i * fs * 1.08 + (1 - p) * 24}
            fontSize={fs}
            fontWeight={500}
            letterSpacing={-fs * 0.04}
            fill={i === 2 ? "#b4a2ff" : ink}
            opacity={p}
          >
            {l}
          </text>
        );
      })}
      <text x={w - (square ? 90 : 60)} y={h - (square ? 80 : 44)} textAnchor="end" fontSize={square ? 30 : 22} fill={ink} opacity={0.5 * lineIn(2)}>
        afto.works
      </text>
    </svg>
  );
}

// Odtwarzanie na żywo (strona /brand)
export default function AnimatedLogo({ variant, light, className = "" }: { variant: Variant; light?: boolean; className?: string }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(((now - start) / 1000) % LOOP[variant]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [variant]);
  return (
    <div className={className}>
      <LogoFrame variant={variant} t={t} light={light} />
    </div>
  );
}
