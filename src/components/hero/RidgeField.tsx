"use client";

import { useEffect, useRef } from "react";

const BG = "#0a0a0a";
const BASE = [237, 237, 233];
const ACCENT = [255, 91, 34];

// Gładki pseudo-szum z sumy sinusów (0..1), zaostrzony do "grzbietów"
function ridge(x: number, i: number, t: number) {
  const a = Math.sin(x * 0.011 + i * 1.31 + t * 0.45);
  const b = Math.sin(x * 0.026 - i * 0.77 + t * 0.8);
  const c = Math.sin(x * 0.053 + i * 2.11 - t * 0.6);
  const v = (a * 0.55 + b * 0.3 + c * 0.15) * 0.5 + 0.5;
  return v * v;
}

/*
 * Pejzaż z linii: każda linia zasłania te za sobą (wypełnienie kolorem tła),
 * a kursor "wypycha" grzbiety do góry i zabarwia je akcentem.
 */
export default function RidgeField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let W = 0;
    let H = 0;
    let raf = 0;
    let visible = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const m = { x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0 };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!m.tx) {
        m.x = m.tx = W * 0.62;
        m.y = m.ty = H * 0.7;
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      m.tx = e.clientX - r.left;
      m.ty = e.clientY - r.top;
      m.ta = m.ty > -80 && m.ty < H + 80 ? 1 : 0;
    };
    const onLeave = () => (m.ta = 0);
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const xs: number[] = [];
    const ys: number[] = [];

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || !W) return;
      const t = reduce ? 0 : now * 0.001;

      m.x += (m.tx - m.x) * 0.07;
      m.y += (m.ty - m.y) * 0.07;
      m.a += (m.ta - m.a) * 0.04;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const lines = Math.max(16, Math.round(H / 17));
      const top = H * 0.2;
      const gap = (H * 1.04 - top) / lines;
      const step = W < 700 ? 5 : 7;

      const mix = (k: number) => BASE.map((c, j) => Math.round(c + (ACCENT[j] - c) * k)).join(",");
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 320);
      grad.addColorStop(0, `rgba(${mix(m.a)},${0.3 + 0.7 * m.a})`);
      grad.addColorStop(0.55, `rgba(${mix(m.a * 0.35)},${0.3 + 0.15 * m.a})`);
      grad.addColorStop(1, `rgba(${BASE.join(",")},0.28)`);
      ctx.lineWidth = 1;
      ctx.strokeStyle = grad;

      for (let i = 0; i < lines; i++) {
        const y0 = top + i * gap;
        xs.length = 0;
        ys.length = 0;
        for (let x = 0; x <= W + step; x += step) {
          const cx = (x - W * 0.5) / (W * 0.36);
          const win = Math.exp(-cx * cx);
          const dx = (x - m.x) / 160;
          const dy = (y0 - m.y) / 190;
          const pull = Math.exp(-(dx * dx + dy * dy)) * m.a;
          const amp = gap * (0.5 + win * 5) + pull * gap * 9;
          xs.push(x);
          ys.push(y0 - ridge(x, i, t) * amp);
        }
        // wypełnienie zasłania linie leżące "za" tą
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (let k = 1; k < xs.length; k++) ctx.lineTo(xs[k], ys[k]);
        ctx.lineTo(W + step, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fillStyle = BG;
        ctx.fill();
        // sama linia
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (let k = 1; k < xs.length; k++) ctx.lineTo(xs[k], ys[k]);
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
