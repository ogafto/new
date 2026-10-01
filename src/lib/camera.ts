/*
 * Kamera płótna.
 * Widok = [cx, cy, w] — środek widoku w świecie i szerokość świata widoczna na ekranie.
 * Przeloty między ramkami używają optymalnej ścieżki zoom+pan (van Wijk & Nuij, 2003),
 * tej samej, z której korzystają mapy i edytory graficzne.
 */

export type View = [number, number, number];

export const FRAME_W = 1440;
export const FRAME_H = 840;

// Marginesy ekranu wokół ramki w trybie "dopasuj do ramki"
const PAD_X = 40;
const PAD_TOP = 88;
const PAD_BOTTOM = 88;

export type FramePos = { x: number; y: number };

export function frameView(f: FramePos, W: number, H: number): View {
  const s = Math.min((W - PAD_X * 2) / FRAME_W, (H - PAD_TOP - PAD_BOTTOM) / FRAME_H);
  const offsetY = (PAD_TOP - PAD_BOTTOM) / 2 / s;
  return [f.x + FRAME_W / 2, f.y + FRAME_H / 2 - offsetY, W / s];
}

export function boundsView(b: { x: number; y: number; w: number; h: number }, W: number, H: number, pad = 0.12): View {
  const s = Math.min(W / (b.w * (1 + pad)), H / (b.h * (1 + pad)));
  return [b.x + b.w / 2, b.y + b.h / 2, W / s];
}

export function viewToTransform(v: View, W: number, H: number) {
  const s = W / v[2];
  return { s, tx: W / 2 - v[0] * s, ty: H / 2 - v[1] * s };
}

export function interpolateZoom(p0: View, p1: View, rho = 1.25) {
  const rho2 = rho * rho;
  const rho4 = rho2 * rho2;
  const [ux0, uy0, w0] = p0;
  const [ux1, uy1, w1] = p1;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;
  let S: number;
  let fn: (t: number) => View;

  if (d2 < 1e-12) {
    S = Math.log(w1 / w0) / rho;
    fn = (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    fn = (t) => {
      const s = t * S;
      const coshr0 = Math.cosh(r0);
      const u = (w0 / (rho2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(rho * s + r0)];
    };
  }
  return Object.assign(fn, { duration: Math.abs(S) * 1000 });
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
