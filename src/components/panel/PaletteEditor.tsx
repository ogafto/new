"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon, ICONS } from "./kit";

/*
 * Paleta projektu bez wpisywania HEX-ów:
 * - kliknij próbkę → natywny wybierak koloru (zmiana),
 * - „Pipeta” → pobierz kolor z dowolnego miejsca ekranu (Chrome/Edge),
 * - „Ze zdjęcia” → 5 dominujących kolorów zdjęcia głównego.
 * Wartość trafia do ukrytego pola `name` jako lista po przecinku.
 */

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };
const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
const norm = (c: string) => {
  let h = c.trim().replace("#", "");
  if (h.length === 3) h = [...h].map((x) => x + x).join("");
  return /^[0-9a-f]{6}$/i.test(h) ? `#${h.toUpperCase()}` : null;
};
const light = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
};

// Dominujące kolory: kwantyzacja do kubełków + odrzucenie zbyt podobnych
async function extract(src: string, count = 5): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  const s = 80;
  c.width = s;
  c.height = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * s));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
    const k = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    k.n++;
    k.r += d[i];
    k.g += d[i + 1];
    k.b += d[i + 2];
    buckets.set(key, k);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((k) => [k.r / k.n, k.g / k.n, k.b / k.n]);
  const out: number[][] = [];
  for (const col of sorted) {
    if (out.every((o) => Math.hypot(o[0] - col[0], o[1] - col[1], o[2] - col[2]) > 48)) out.push(col);
    if (out.length >= count) break;
  }
  return out.map(([r, g, b]) => hex(Math.round(r), Math.round(g), Math.round(b)));
}

export default function PaletteEditor({ name, value, onChange, image }: { name: string; value: string[]; onChange: (v: string[]) => void; image?: string }) {
  const add = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // pipeta tylko po stronie przeglądarki (bez rozjazdu przy hydracji)
  const [dropper, setDropper] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDropper("EyeDropper" in window), 0);
    return () => clearTimeout(t);
  }, []);

  const push = (c: string) => {
    const n = norm(c);
    if (n && !value.includes(n)) onChange([...value, n].slice(0, 8));
  };

  return (
    <div>
      <input type="hidden" name={name} value={value.join(", ")} />
      <div className="flex flex-wrap items-center gap-2">
        <AnimatePresence initial={false}>
          {value.map((c, i) => (
            <motion.div key={c + i} layout initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.25 }} className="group relative">
              <label className="relative block size-14 cursor-pointer overflow-hidden rounded-2xl shadow-[0_8px_20px_-10px_rgb(0_0_0/0.8)] ring-1 ring-white/15 transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 hover:scale-105" style={{ background: c }} title={`${c} — kliknij, żeby zmienić`}>
                <input type="color" value={c.toLowerCase()} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value.toUpperCase() : x)))} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Zmień kolor ${c}`} />
                <span className={`pointer-events-none absolute inset-x-0 bottom-1 text-center font-mono text-[9px] opacity-0 transition-opacity group-hover:opacity-100 ${light(c) ? "text-black/70" : "text-white/80"}`}>{c.slice(1)}</span>
              </label>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-bg text-muted opacity-0 ring-1 ring-line-2 transition-opacity group-hover:opacity-100 hover:text-red-300 focus:opacity-100" aria-label={`Usuń ${c}`}>
                <Icon d={ICONS.close} className="size-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {value.length < 8 && (
          <label className="relative grid size-14 cursor-pointer place-items-center rounded-2xl border border-dashed border-white/[0.14] text-muted transition-colors hover:border-accent/50 hover:bg-accent/[0.06] hover:text-ink" title="Dodaj kolor">
            <Icon d={ICONS.plus} className="size-4" />
            <input ref={add} type="color" defaultValue="#8b6cff" onChange={(e) => push(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Dodaj kolor" />
          </label>
        )}
        {value.length === 0 && <span className="pl-1 text-[13px] text-dim">Brak kolorów</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {dropper && (
          <button
            type="button"
            onClick={async () => {
              try {
                const r = await new (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper().open();
                push(r.sRGBHex);
              } catch {}
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-2 px-3 text-[12.5px] text-muted transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 5.5l4 4M17 3a2.1 2.1 0 013 3l-2.5 2.5-3-3zM14.5 6.5L5 16l-1 4 4-1 9.5-9.5" />
            </svg>
            Pipeta
          </button>
        )}
        {image && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setErr("");
              try {
                const cols = await extract(image);
                onChange([...new Set([...value, ...cols])].slice(0, 8));
              } catch {
                setErr("Nie udało się odczytać kolorów z tego zdjęcia.");
              }
              setBusy(false);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-2 px-3 text-[12.5px] text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <Icon d={ICONS.star} className="size-3.5" />
            {busy ? "Analizuję…" : "Ze zdjęcia"}
          </button>
        )}
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] text-dim transition-colors hover:text-ink">
            Wyczyść
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-[12px] text-red-300">{err}</p>}
    </div>
  );
}
