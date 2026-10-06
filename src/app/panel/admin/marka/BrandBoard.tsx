"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { BrandAsset, BrandColor } from "@/lib/brand";
import { Btn, ConfirmBtn, ease, Empty, field, Icon, ICONS, spotMove } from "@/components/panel/kit";
import BannerMaker from "@/components/panel/BannerMaker";
import { addBrandColor, deleteBrandAsset, deleteBrandColor, registerBrandAsset, renameBrandAsset, uploadBrandLocal } from "./actions";

/* ---------- typy ---------- */

export type GenFile = { kind: string; url: string; bytes?: number; label?: string };
export type Generated = { id: string; category: "animacje" | "grafiki"; section?: string; group: string; title: string; description?: string; w?: number; h?: number; duration?: number; poster?: string; bg?: string; files: GenFile[] };
export type PaletteColor = { name: string; hex: string; note?: string };
type Tab = "animacje" | "grafiki" | "kolory" | "generator";
type Slide = { id: string; title: string; url: string; kind: string; poster?: string; bg?: string; description?: string; meta?: string; files: GenFile[] };

// Podkategorie (kolejność i opisy); nieznane sekcje trafiają na koniec
const SECTIONS: Record<"animacje" | "grafiki", { name: string; text: string }[]> = {
  animacje: [
    { name: "Premiera (launch)", text: "Premium filmy w stylu premiery produktu." },
    { name: "Zapowiedzi", text: "„Coś nadchodzi” — Discord i social media." },
    { name: "Zapowiedź nowej strony", text: "Teasery nowej odsłony afto.works." },
    { name: "Banery z hasłem", text: "Animowane banery z hasłem marki." },
    { name: "Weryfikacja", text: "Embedy „Zweryfikuj się” dla bota." },
    { name: "Logo animowane", text: "Monogram i logotyp w ruchu." },
    { name: "Archiwum", text: "Wcześniejsze wersje zapowiedzi." },
  ],
  grafiki: [
    { name: "Banery", text: "Statyczne banery 1500 × 300." },
    { name: "Logo", text: "Oficjalne pliki logo — SVG i PNG." },
    { name: "Propozycje logo", text: "Warianty znaku: ikony, awatary, pieczęć." },
  ],
};
const MINE = "Twoje pliki";

const VIDEO = ["mp4", "webm"];
const ACCEPT: Record<"animacje" | "grafiki", string> = { animacje: ".mp4,.webm,.gif", grafiki: ".png,.jpg,.jpeg,.webp,.svg,.pdf,.gif" };
const PLAY = "M8 5.5v13l11-6.5z";
const FILM = "M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4";
const SWATCH = "M12 21a9 9 0 110-18c5 0 9 3.6 9 8 0 2.8-2.2 4-4.5 4H15a2 2 0 00-1.4 3.4A1.6 1.6 0 0112 21zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01M17.5 11h.01";
const CHEVRON = "M15 6l-6 6 6 6";
const CHECKER = "bg-[repeating-conic-gradient(rgb(255_255_255/0.035)_0_25%,transparent_0_50%)] bg-[length:18px_18px]";

const size = (b?: number) => (!b ? "" : b > 1_000_000 ? `${(b / 1_000_000).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1000))} kB`);
const metaOf = (g: Generated) => [g.w && g.h ? `${g.w} × ${g.h}` : "", g.duration ? `${String(g.duration).replace(".", ",")} s` : ""].filter(Boolean).join(" · ");
const mainOf = (g: Generated) => g.files.find((f) => VIDEO.includes(f.kind)) ?? g.files.find((f) => ["png", "svg", "gif", "jpg"].includes(f.kind)) ?? g.files[0];
const filesOf = (g: Generated) => g.files.filter((f) => f.kind !== "jpg" || !g.poster || f.url !== g.poster);

/* ---------- podgląd: wideo gra tylko, gdy jest widoczne ---------- */

function Media({ src, poster, kind, fit = "cover", className = "", bg }: { src: string; poster?: string; kind: string; fit?: "cover" | "contain"; className?: string; bg?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const obj = fit === "cover" ? "object-cover" : "object-contain";
  if (VIDEO.includes(kind)) return <video ref={ref} src={`${src}#t=0.1`} poster={poster} muted loop playsInline preload="metadata" className={`size-full ${obj} ${className}`} style={{ background: bg }} />;
  if (kind === "pdf")
    return (
      <span className={`grid size-full place-items-center text-dim ${className}`}>
        <Icon d={ICONS.doc} className="size-10" />
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={`size-full ${obj} ${className}`} style={{ background: bg }} />;
}

function DownloadPill({ f, light = false }: { f: GenFile; light?: boolean }) {
  return (
    <a
      href={f.url}
      download
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] transition-colors ${light ? "border-white/15 bg-white/[0.06] text-white hover:bg-white hover:text-bg" : "border-white/[0.09] bg-white/[0.02] text-muted hover:border-white/30 hover:bg-white/[0.06] hover:text-ink"}`}
    >
      <Icon d={ICONS.download} className="size-3" />
      <span className="font-medium">{f.label ?? f.kind.toUpperCase()}</span>
      {f.bytes ? <span className={light ? "text-white/50" : "text-dim"}>{size(f.bytes)}</span> : null}
    </a>
  );
}

/* ---------- wgrywanie ---------- */

type Job = { name: string; progress: number; error?: string; done?: boolean };

// bezpieczna nazwa pliku w magazynie (bez spacji i polskich znaków)
const safeName = (n: string) =>
  n
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);

function Uploader({ category, blob }: { category: "animacje" | "grafiki"; blob: "public" | "private" | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setJobs(files.map((f) => ({ name: f.name, progress: 0 })));
    const set = (i: number, p: Partial<Job>) => setJobs((j) => j.map((x, k) => (k === i ? { ...x, ...p } : x)));
    if (blob) {
      const { upload: up } = await import("@vercel/blob/client");
      await Promise.all(
        files.map(async (f, i) => {
          try {
            const r = await up(`brand/${safeName(f.name)}`, f, { access: blob, handleUploadUrl: "/api/brand/upload", multipart: f.size > 8_000_000, onUploadProgress: (e) => set(i, { progress: e.percentage }) });
            const res = await registerBrandAsset({ name: f.name, url: r.url, pathname: r.pathname, bytes: f.size });
            set(i, res.error ? { error: res.error } : { progress: 100, done: true });
          } catch (e) {
            set(i, { error: e instanceof Error ? e.message : "Błąd" });
          }
        }),
      );
    } else {
      const fd = new FormData();
      files.forEach((f) => fd.append("file", f));
      setJobs((j) => j.map((x) => ({ ...x, progress: 40 })));
      const r = await uploadBrandLocal(fd);
      setJobs((j) => j.map((x) => ({ ...x, progress: 100, done: !r.error, error: r.error })));
    }
    router.refresh();
    setTimeout(() => setJobs((j) => j.filter((x) => x.error)), 2500);
  };

  const formats = category === "animacje" ? ["MP4", "WebM", "GIF"] : ["PNG", "JPG", "WebP", "SVG", "PDF"];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        upload(Array.from(e.dataTransfer.files));
      }}
      className={`relative overflow-hidden rounded-[22px] border border-dashed transition-[border-color,background-color,box-shadow] duration-300 ${over ? "border-accent bg-accent/[0.08] shadow-[0_0_0_6px_rgb(139_108_255/0.1)]" : "border-white/[0.12] bg-[radial-gradient(60%_120%_at_0%_50%,rgb(139_108_255/0.08),transparent_70%)] hover:border-white/25"}`}
    >
      <button type="button" onClick={() => input.current?.click()} className="group flex w-full flex-col items-center gap-4 px-6 py-7 text-center sm:flex-row sm:gap-5 sm:py-5 sm:text-left">
        <motion.span animate={over ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }} className="relative grid size-12 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-[linear-gradient(135deg,rgb(139_108_255/0.3),rgb(139_108_255/0.08))] text-accent-2 shadow-[0_10px_30px_-12px_rgb(139_108_255/0.8)]">
          <span className="absolute inset-0 animate-ping rounded-2xl border border-accent/25 [animation-duration:2.6s]" />
          <Icon d={ICONS.upload} />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px]">{over ? "Upuść, żeby dodać" : `Dodaj ${category === "animacje" ? "animacje" : "grafiki"}`}</span>
          <span className="mt-0.5 block text-[12.5px] text-dim">Przeciągnij pliki albo kliknij · do 200 MB{blob ? "" : " · dysk serwera"}</span>
        </span>
        <span className="flex flex-wrap justify-center gap-1">
          {formats.map((f) => (
            <span key={f} className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10.5px] text-dim">
              {f}
            </span>
          ))}
        </span>
      </button>
      <input ref={input} type="file" multiple accept={ACCEPT[category]} className="hidden" onChange={(e) => upload(Array.from(e.target.files ?? []))} />
      <AnimatePresence>
        {jobs.length > 0 && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden border-t border-white/[0.06] px-5 py-4">
            {jobs.map((j) => (
              <li key={j.name} className="text-[13px]">
                <div className="flex justify-between gap-3">
                  <span className="truncate">{j.name}</span>
                  <span className={j.error ? "text-red-300" : j.done ? "text-emerald-300" : "text-dim tabular-nums"}>{j.error ?? (j.done ? "✓" : `${Math.round(j.progress)}%`)}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div className={`h-full rounded-full ${j.error ? "bg-red-400" : "bg-gradient-to-r from-accent to-accent-2"}`} animate={{ width: `${j.error ? 100 : j.progress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- karty ---------- */

const cardCls = "spot edge group relative overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,rgb(22_22_30/0.82),rgb(13_13_18/0.82))] shadow-[0_24px_60px_-40px_rgb(0_0_0/0.9)]";

function Hover({ video }: { video: boolean }) {
  return (
    <>
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute right-3 bottom-3 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-bg opacity-0 shadow-lg transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
        <Icon d={video ? PLAY : ICONS.eye} className="size-3.5" /> Podgląd
      </span>
    </>
  );
}

function OwnCard({ a, onOpen }: { a: BrandAsset; onOpen: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(a.name);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();
  const abs = a.url.startsWith("/") ? (typeof window !== "undefined" ? location.origin : "") + a.url : a.url;
  return (
    <motion.figure layout onPointerMove={spotMove} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease }} className={cardCls}>
      <button type="button" onClick={onOpen} className={`relative block aspect-video w-full overflow-hidden ${CHECKER}`} aria-label={`Podgląd: ${a.name}`}>
        <Media src={a.url} kind={a.kind} fit="contain" className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]" />
        <span className="absolute top-2.5 left-2.5 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10.5px] text-white/80 backdrop-blur">{a.kind.toUpperCase()}</span>
        <Hover video={VIDEO.includes(a.kind)} />
      </button>
      <figcaption className="relative space-y-2.5 p-3.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== a.name && start(async () => void (await renameBrandAsset(a.id, name), router.refresh()))}
          className="-mx-1 w-[calc(100%+8px)] truncate rounded-lg bg-transparent px-1 py-0.5 text-[14px] outline-none hover:bg-white/[0.04] focus:bg-white/[0.06]"
          aria-label="Nazwa pliku"
        />
        <div className="flex items-center gap-1">
          <DownloadPill f={{ kind: a.kind, url: a.url, bytes: a.bytes }} />
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(abs).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
            }
            className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
          >
            <Icon d={copied ? ICONS.check : ICONS.link} className="size-3" /> {copied ? "Skopiowano" : "Link"}
          </button>
          <span className="ml-auto">
            <ConfirmBtn onConfirm={() => start(async () => void (await deleteBrandAsset(a.id), router.refresh()))}>{""}</ConfirmBtn>
          </span>
        </div>
      </figcaption>
    </motion.figure>
  );
}

function GenCard({ g, wide, onOpen }: { g: Generated; wide: boolean; onOpen: () => void }) {
  const main = mainOf(g);
  const ratio = g.w && g.h ? `${g.w} / ${g.h}` : "16 / 9";
  const video = !!main && (VIDEO.includes(main.kind) || main.kind === "gif");
  return (
    <motion.figure
      onPointerMove={spotMove}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease }}
      className={`${cardCls} flex flex-col ${wide ? "md:col-span-2 xl:col-span-3" : ""}`}
    >
      <button type="button" onClick={onOpen} className="relative block w-full overflow-hidden" style={{ aspectRatio: ratio, background: g.bg ?? "#07070a" }} aria-label={`Podgląd: ${g.title}`}>
        {main && <Media src={main.url} poster={g.poster} kind={main.kind} fit={g.bg ? "contain" : "cover"} bg={g.bg} className={`transition-transform duration-700 ease-out-expo group-hover:scale-[1.02] ${g.bg ? "p-[8%]" : ""}`} />}
        {video && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white/85 backdrop-blur">
            <Icon d={FILM} className="size-3" />
            {g.duration ? `${String(g.duration).replace(".", ",")} s` : main!.kind.toUpperCase()}
          </span>
        )}
        <Hover video={video} />
      </button>
      <figcaption className="relative flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-[14.5px]">{g.title}</p>
          {g.w && g.h ? <p className="shrink-0 text-[11.5px] text-dim tabular-nums">{`${g.w} × ${g.h}`}</p> : null}
        </div>
        {g.description && <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-dim">{g.description}</p>}
        <div className="mt-auto flex flex-wrap gap-1 pt-3.5">
          {filesOf(g).map((f) => (
            <DownloadPill key={f.url} f={f} />
          ))}
        </div>
      </figcaption>
    </motion.figure>
  );
}

/* ---------- lightbox ---------- */

function Lightbox({ slides, index, onIndex, onClose }: { slides: Slide[]; index: number | null; onIndex: (i: number) => void; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  const n = slides.length;
  const go = useCallback((d: number) => index !== null && n > 1 && onIndex((index + d + n) % n), [index, n, onIndex]);
  useEffect(() => {
    if (index === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", k);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", k);
      document.body.style.overflow = o;
    };
  }, [index, go, onClose]);
  if (!mounted) return null;
  const s = index !== null ? slides[index] : null;
  return createPortal(
    <AnimatePresence>
      {s && (
        <motion.div className="fixed inset-0 z-[90] flex flex-col bg-[rgb(4_4_6/0.9)] backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} role="dialog" aria-modal="true" aria-label={s.title} data-lenis-prevent>
          <div className="absolute inset-0" onClick={onClose} />
          <div className="relative flex items-center justify-between gap-4 px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-[15px]">{s.title}</p>
              <p className="text-[12px] text-dim tabular-nums">
                {index! + 1} / {n}
                {s.meta ? ` · ${s.meta}` : ""}
              </p>
            </div>
            <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted transition-colors hover:text-ink" aria-label="Zamknij">
              <Icon d={ICONS.close} className="size-4" />
            </button>
          </div>
          <div className="pointer-events-none relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={s.id}
                className="pointer-events-auto relative max-h-full max-w-[min(1200px,100%)] overflow-hidden rounded-2xl shadow-[0_40px_120px_-30px_rgb(0_0_0/1)] ring-1 ring-white/10"
                style={{ background: s.bg }}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease }}
                drag={n > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, i) => (i.offset.x < -60 ? go(1) : i.offset.x > 60 ? go(-1) : null)}
              >
                {VIDEO.includes(s.kind) ? (
                  <video src={s.url} poster={s.poster} autoPlay muted loop playsInline controls className="block max-h-[calc(100svh-220px)] w-auto max-w-full object-contain" />
                ) : s.kind === "pdf" ? (
                  <iframe src={s.url} title={s.title} className="h-[calc(100svh-220px)] w-[min(900px,92vw)] bg-white" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.url} alt={s.title} draggable={false} className={`block max-h-[calc(100svh-220px)] w-auto max-w-full object-contain ${s.bg ? "p-6" : CHECKER}`} />
                )}
              </motion.div>
            </AnimatePresence>
            {n > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="pointer-events-auto absolute left-4 hidden size-11 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-muted backdrop-blur transition-colors hover:bg-white hover:text-bg sm:grid" aria-label="Poprzedni">
                  <Icon d={CHEVRON} className="size-5" />
                </button>
                <button type="button" onClick={() => go(1)} className="pointer-events-auto absolute right-4 hidden size-11 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-muted backdrop-blur transition-colors hover:bg-white hover:text-bg sm:grid" aria-label="Następny">
                  <Icon d={CHEVRON} className="size-5 rotate-180" />
                </button>
              </>
            )}
          </div>
          <div className="relative flex flex-col items-center gap-3 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)] text-center">
            {s.description && <p className="line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-muted">{s.description}</p>}
            {s.files.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {s.files.map((f) => (
                  <DownloadPill key={f.url} f={f} light />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- kolory ---------- */

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

function Swatch({ c, own, i }: { c: PaletteColor & { id?: string }; own?: boolean; i: number }) {
  const router = useRouter();
  const [copied, setCopied] = useState("");
  const [, start] = useTransition();
  const light = lum(c.hex) > 0.4;
  const [r, g, b] = rgb(c.hex);
  const copy = (v: string) =>
    navigator.clipboard.writeText(v).then(() => {
      setCopied(v);
      setTimeout(() => setCopied(""), 1200);
    });
  return (
    <motion.div onPointerMove={spotMove} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.45, ease }} className={cardCls}>
      <button type="button" onClick={() => copy(c.hex)} className="relative flex h-36 w-full items-end justify-between gap-2 p-4 text-left" style={{ background: c.hex, color: light ? "#0b0b0d" : "#f2f1ec" }}>
        <span className="font-mono text-[18px] tracking-tight">{copied === c.hex ? "Skopiowano ✓" : c.hex}</span>
        <Icon d={ICONS.copy} className="size-4 opacity-0 transition-opacity group-hover:opacity-70" />
        <span className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10.5px] tabular-nums" style={{ background: light ? "rgb(0 0 0 / 0.08)" : "rgb(255 255 255 / 0.1)" }}>
          {contrast(c.hex, light ? "#0b0b0d" : "#ffffff").toFixed(1)}:1
        </span>
      </button>
      <div className="relative flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[14px]">{c.name}</p>
          {c.note && <p className="mt-0.5 truncate text-[12px] text-dim">{c.note}</p>}
          <button type="button" onClick={() => copy(`rgb(${r}, ${g}, ${b})`)} className="mt-2 font-mono text-[11px] text-muted transition-colors hover:text-ink">
            {copied.startsWith("rgb") ? "Skopiowano ✓" : `rgb(${r}, ${g}, ${b})`}
          </button>
        </div>
        {own && c.id && <ConfirmBtn onConfirm={() => start(async () => void (await deleteBrandColor(c.id!), router.refresh()))}>{""}</ConfirmBtn>}
      </div>
    </motion.div>
  );
}

function AddColor() {
  const router = useRouter();
  const [d, setD] = useState({ name: "", hex: "#8B6CFF", note: "" });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2.5 rounded-[20px] border border-dashed border-white/[0.12] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addBrandColor(d);
          if (r.error) return setErr(r.error);
          setErr("");
          setD({ name: "", hex: d.hex, note: "" });
          router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-2.5">
        <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/10" style={{ background: d.hex }}>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(d.hex) ? d.hex : "#000000"} onChange={(e) => setD({ ...d, hex: e.target.value.toUpperCase() })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Wybierz kolor" />
        </label>
        <input value={d.hex} onChange={(e) => setD({ ...d, hex: e.target.value })} className={`${field} h-11 min-w-0 font-mono text-[13.5px]`} aria-label="HEX" />
      </div>
      <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Nazwa" className={`${field} h-10 text-[13.5px]`} />
      <input value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="Zastosowanie (opcjonalnie)" className={`${field} h-10 text-[13.5px]`} />
      {err && <p className="text-[12.5px] text-red-300">{err}</p>}
      <Btn type="submit" size="sm" variant="primary" icon={ICONS.plus} disabled={pending}>
        Dodaj kolor
      </Btn>
    </form>
  );
}

/* ---------- całość ---------- */

export default function BrandBoard({ generated, own, palette, colors, blob }: { generated: Generated[]; own: BrandAsset[]; palette: PaletteColor[]; colors: BrandColor[]; blob: "public" | "private" | null }) {
  const [tab, setTab] = useState<Tab>("animacje");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const h = location.hash.slice(1) as Tab;
    if (["animacje", "grafiki", "kolory", "generator"].includes(h)) setTimeout(() => setTab(h), 0);
  }, []);

  const [section, setSection] = useState<string>("all");
  // sekcje → grupy → elementy
  const sections = useMemo(() => {
    if (tab === "kolory" || tab === "generator") return [];
    const known = SECTIONS[tab];
    const m = new Map<string, Map<string, Generated[]>>();
    for (const g of generated.filter((x) => x.category === tab)) {
      const sec = g.section ?? g.group;
      const groups = m.get(sec) ?? new Map<string, Generated[]>();
      groups.set(g.group, [...(groups.get(g.group) ?? []), g]);
      m.set(sec, groups);
    }
    const order = (n: string) => {
      const i = known.findIndex((k) => k.name === n);
      return i < 0 ? 99 : i;
    };
    return [...m.entries()].sort((a, b) => order(a[0]) - order(b[0])).map(([name, groups]) => ({ name, text: known.find((k) => k.name === name)?.text, groups: [...groups.entries()], n: [...groups.values()].reduce((x, y) => x + y.length, 0) }));
  }, [generated, tab]);
  const mine = useMemo(() => own.filter((a) => a.category === tab), [own, tab]);
  const showMine = section === "all" || section === MINE;
  const shown = useMemo(() => sections.filter((x) => section === "all" || section === x.name), [sections, section]);

  // kolejność podglądu = kolejność na ekranie
  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = [];
    if (showMine) for (const a of mine) out.push({ id: a.id, title: a.name, url: a.url, kind: a.kind, files: [{ kind: a.kind, url: a.url, bytes: a.bytes }], meta: size(a.bytes) });
    for (const sec of shown)
      for (const [, items] of sec.groups)
        for (const g of items) {
          const m = mainOf(g);
          if (m) out.push({ id: g.id, title: g.title, url: m.url, kind: m.kind, poster: g.poster, bg: g.bg, description: g.description, meta: metaOf(g), files: filesOf(g) });
        }
    return out;
  }, [mine, shown, showMine]);
  const openId = (id: string) => {
    const i = slides.findIndex((s) => s.id === id);
    if (i >= 0) setOpen(i);
  };

  const pickTab = (t: Tab) => {
    setSection("all");
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };
  const count = (t: "animacje" | "grafiki") => generated.filter((g) => g.category === t).length + own.filter((a) => a.category === t).length;

  const tabs: { id: Tab; label: string; icon: string; n?: number }[] = [
    { id: "animacje", label: "Animacje", icon: FILM, n: count("animacje") },
    { id: "grafiki", label: "Grafiki", icon: ICONS.grid, n: count("grafiki") },
    { id: "kolory", label: "Kolory", icon: SWATCH, n: palette.length + colors.length },
    { id: "generator", label: "Generator banerów", icon: ICONS.edit },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0" data-lenis-prevent>
          <div className="inline-flex gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1">
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => pickTab(t.id)} className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13.5px] transition-colors ${tab === t.id ? "text-ink" : "text-muted hover:text-ink"}`}>
                {tab === t.id && <motion.span layoutId="brand-tab" className="absolute inset-0 rounded-xl border border-white/[0.08] bg-white/[0.07] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <Icon d={t.icon} className={`relative size-4 ${tab === t.id ? "text-accent-2" : ""}`} />
                <span className="relative">{t.label}</span>
                {t.n !== undefined && <span className={`relative rounded-full px-1.5 text-[11px] tabular-nums ${tab === t.id ? "bg-accent/20 text-accent-2" : "bg-white/[0.05] text-dim"}`}>{t.n}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}>
          {tab === "generator" ? (
            <BannerMaker />
          ) : tab === "kolory" ? (
            <div className="space-y-10">
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-[14px] text-muted">
                  Kolory marki <span className="rounded-full bg-white/[0.05] px-1.5 text-[11px] text-dim tabular-nums">{palette.length}</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {palette.map((c, i) => (
                    <Swatch key={c.hex + c.name} c={c} i={i} />
                  ))}
                </div>
              </section>
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-[14px] text-muted">
                  Twoje kolory <span className="rounded-full bg-white/[0.05] px-1.5 text-[11px] text-dim tabular-nums">{colors.length}</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {colors.map((c, i) => (
                    <Swatch key={c.id} c={{ ...c, note: c.note ?? undefined }} own i={i} />
                  ))}
                  <AddColor />
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-10">
              {/* podkategorie */}
              <div className="sticky top-[calc(env(safe-area-inset-top)+61px)] z-20 -mx-4 bg-[linear-gradient(180deg,rgb(7_7_10/0.96)_70%,rgb(7_7_10/0))] px-4 pt-2 pb-3 sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:bg-none lg:p-0">
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] lg:flex-wrap" data-lenis-prevent>
                  {[{ name: "all", label: "Wszystkie", n: sections.reduce((x, y) => x + y.n, 0) + mine.length }, ...sections.map((x) => ({ name: x.name, label: x.name, n: x.n })), ...(mine.length ? [{ name: MINE, label: MINE, n: mine.length }] : [])].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSection(c.name)}
                      className={`relative shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors ${section === c.name ? "border-transparent text-ink" : "border-white/[0.07] text-muted hover:border-white/15 hover:text-ink"}`}
                    >
                      {section === c.name && <motion.span layoutId={`brand-sec-${tab}`} className="absolute -inset-px rounded-full border border-accent/35 bg-[linear-gradient(180deg,rgb(139_108_255/0.2),rgb(139_108_255/0.07))]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                      <span className="relative">
                        {c.label} <span className="ml-1 text-[11px] text-dim tabular-nums">{c.n}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {showMine && (
                <section>
                  <Uploader category={tab} blob={blob} />
                  {mine.length > 0 && (
                    <>
                      <h2 className="mt-8 mb-4 flex items-center gap-2 text-[14px] text-muted">
                        {MINE} <span className="rounded-full bg-white/[0.05] px-1.5 text-[11px] text-dim tabular-nums">{mine.length}</span>
                      </h2>
                      <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <AnimatePresence>
                          {mine.map((a) => (
                            <OwnCard key={a.id} a={a} onOpen={() => openId(a.id)} />
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    </>
                  )}
                </section>
              )}

              {shown.map((sec) => (
                <section key={sec.name} className="space-y-5">
                  <div className="flex items-end justify-between gap-4 border-b border-white/[0.06] pb-3.5">
                    <div className="min-w-0">
                      <h2 className="h-display text-[clamp(1.4rem,2.2vw,1.85rem)]">{sec.name}</h2>
                      {sec.text && <p className="mt-1 text-[13px] text-dim">{sec.text}</p>}
                    </div>
                    <span className="shrink-0 rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[12px] text-muted tabular-nums">{sec.n}</span>
                  </div>
                  {sec.groups.map(([name, items]) => (
                    <div key={name}>
                      {sec.groups.length > 1 && <h3 className="mb-3 text-[13px] text-muted">{name}</h3>}
                      <div className="grid grid-flow-row-dense gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((g) => (
                          <GenCard key={g.id} g={g} wide={!!(g.w && g.h && g.w / g.h > 2.4)} onOpen={() => openId(g.id)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
              {!sections.length && !mine.length && <Empty icon={ICONS.upload} title="Pusto" text="Przeciągnij pierwsze pliki na pole powyżej." />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Lightbox slides={slides} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </div>
  );
}
