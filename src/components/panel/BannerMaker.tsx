"use client";

import { useEffect, useRef, useState } from "react";
import { BANNER, bannerGif, bannerPng, bannerSlug, bannerVideo, createScene, renderBanner, siteFont, type Scene } from "@/lib/banner";
import { Btn, Card, field, Icon, ICONS } from "@/components/panel/kit";

const PRESETS = ["weryfikacja", "regulamin", "ogłoszenia", "zasady serwera", "nowości i aktualizacje"];

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const mb = (b: Blob) => `${(b.size / 1048576).toFixed(1).replace(".", ",")} MB`;

// Generator animowanego banera 1500 × 300: dowolny tekst, podgląd na żywo, pobieranie GIF / wideo / PNG
export default function BannerMaker() {
  const [text, setText] = useState("weryfikacja");
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [font, setFont] = useState<string | null>(null);
  const scene = useRef<Scene | null>(null);
  const start = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  // font strony musi być załadowany, zanim zmierzymy tekst
  useEffect(() => {
    const f = siteFont();
    document.fonts.load(`500 100px ${f}`).finally(() => setFont(f));
  }, []);

  // nowa scena po zmianie tekstu (z krótkim opóźnieniem przy pisaniu)
  useEffect(() => {
    if (!font) return;
    const t = setTimeout(() => {
      scene.current = createScene(text, font);
      start.current = performance.now();
    }, scene.current ? 250 : 0);
    return () => clearTimeout(t);
  }, [text, font]);

  // podgląd: rysuje tylko, gdy jest na ekranie
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0, visible = true, k = 1;
    const fit = () => {
      const w = c.clientWidth * Math.min(2, window.devicePixelRatio || 1);
      k = Math.max(0.2, w / BANNER.W);
      c.width = Math.round(BANNER.W * k);
      c.height = Math.round(BANNER.H * k);
      if (scene.current) scene.current.bg = {};
    };
    const loop = (n: number) => {
      if (visible && scene.current) renderBanner(scene.current, ctx, (((n - start.current) / 1000) % BANNER.D + BANNER.D) % BANNER.D, k);
      raf = requestAnimationFrame(loop);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const name = () => `afto-${bannerSlug(scene.current?.text ?? text)}`;
  const run = async (job: () => Promise<void>) => {
    if (busy || !font) return;
    setBusy(true);
    try {
      await job();
    } catch (e) {
      setStatus(`Nie udało się: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
  };
  // eksport zawsze ze świeżej sceny (bez czekania na opóźnienie przy pisaniu)
  const fresh = () => (scene.current = createScene(text, font!));

  const gif = () =>
    run(async () => {
      const b = await bannerGif(fresh(), scale, (p) => setStatus(`Tworzę GIF… ${Math.round(p * 100)}%`));
      save(b, `${name()}${scale < 1 ? "-750" : ""}.gif`);
      setStatus(`Gotowe: GIF, ${mb(b)}`);
    });
  const video = () =>
    run(async () => {
      const { blob, ext } = await bannerVideo(fresh(), (p) => setStatus(`Nagrywam wideo… ${Math.round(p * 100)}%`));
      save(blob, `${name()}.${ext}`);
      setStatus(`Gotowe: ${ext.toUpperCase()}, ${mb(blob)}`);
    });
  const png = () =>
    run(async () => {
      const b = await bannerPng(fresh());
      save(b, `${name()}.png`);
      setStatus(`Gotowe: PNG, ${mb(b)}`);
    });

  return (
    <div className="space-y-4">
      <Card pad={false}>
        <button type="button" onClick={() => (start.current = performance.now())} className="block w-full cursor-pointer" aria-label="Odtwórz baner od początku">
          <canvas ref={canvas} className="block aspect-[5/1] w-full" />
        </button>
      </Card>

      <Card>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-muted">Tekst na banerze</span>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={40} spellCheck={false} className={`${field} h-11`} placeholder="np. weryfikacja" />
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setText(p)}
              className={`rounded-full border px-3 py-1 text-[12.5px] transition-colors ${text.trim() === p ? "border-accent/40 bg-accent/15 text-ink" : "border-white/[0.08] text-muted hover:border-white/20 hover:text-ink"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-dim">Dłuższy tekst zmniejsza cały układ, a logo i napis zawsze stoją na wspólnej linii. Kliknij podgląd, żeby puścić animację od początku.</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-5">
          <Btn variant="primary" icon={ICONS.download} onClick={gif} disabled={busy || !font}>
            Pobierz GIF
          </Btn>
          <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className={`${field.replace("w-full ", "")} h-11 w-auto pr-9`} aria-label="Rozmiar GIF">
            <option value={1}>1500 × 300</option>
            <option value={0.5}>750 × 150</option>
          </select>
          <span className="mx-1 hidden h-6 w-px bg-white/[0.08] sm:block" aria-hidden />
          <Btn icon={ICONS.download} onClick={video} disabled={busy || !font}>
            Wideo
          </Btn>
          <Btn icon={ICONS.download} onClick={png} disabled={busy || !font}>
            PNG
          </Btn>
          <span className="ml-auto text-[13px] text-muted tabular-nums" aria-live="polite">
            {status}
          </span>
        </div>
        <p className="mt-4 flex items-start gap-2 text-[12.5px] text-dim">
          <Icon d={ICONS.star} className="mt-px size-3.5 shrink-0 text-accent-2" />
          <span>Do embeda bota na Discordzie bierz GIF (pole image). Wideo przyda się na stronę i social media, PNG to wersja nieruchoma.</span>
        </p>
      </Card>
    </div>
  );
}
