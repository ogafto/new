"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { BrandAsset, BrandColor } from "@/lib/brand";
import { Btn, ConfirmBtn, ease, Empty, field, Icon, ICONS, Modal } from "@/components/panel/kit";
import { addBrandColor, deleteBrandAsset, deleteBrandColor, registerBrandAsset, renameBrandAsset, uploadBrandLocal } from "./actions";

/* ---------- typy ---------- */

export type GenFile = { kind: string; url: string; bytes?: number; label?: string };
export type Generated = { id: string; category: "animacje" | "grafiki"; group: string; title: string; description?: string; w?: number; h?: number; duration?: number; poster?: string; bg?: string; files: GenFile[] };
export type PaletteColor = { name: string; hex: string; note?: string };
type Tab = "animacje" | "grafiki" | "kolory";

const VIDEO = ["mp4", "webm"];
const ACCEPT: Record<"animacje" | "grafiki", string> = { animacje: ".mp4,.webm,.gif", grafiki: ".png,.jpg,.jpeg,.webp,.svg,.pdf,.gif" };

const size = (b?: number) => (!b ? "" : b > 1_000_000 ? `${(b / 1_000_000).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1000))} kB`);

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
  if (VIDEO.includes(kind))
    return <video ref={ref} src={`${src}#t=0.1`} poster={poster} muted loop playsInline preload="metadata" className={`size-full ${obj} ${className}`} style={{ background: bg }} />;
  if (kind === "pdf")
    return (
      <span className={`grid size-full place-items-center text-dim ${className}`}>
        <Icon d={ICONS.doc} className="size-10" />
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={`size-full ${obj} ${className}`} style={{ background: bg }} />;
}

function DownloadPill({ f }: { f: GenFile }) {
  return (
    <a href={f.url} download className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3 py-1.5 text-[12.5px] transition-colors hover:border-white/40 hover:bg-white/5">
      <Icon d={ICONS.download} className="size-3.5" />
      {f.label ?? f.kind.toUpperCase()}
      {f.bytes ? <span className="text-dim">{size(f.bytes)}</span> : null}
    </a>
  );
}

/* ---------- wgrywanie ---------- */

type Job = { name: string; progress: number; error?: string; done?: boolean };

// bezpieczna nazwa pliku w magazynie (bez spacji i polskich znaków)
const safeName = (n: string) =>
  n
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
      className={`relative overflow-hidden rounded-[22px] border border-dashed transition-colors duration-300 ${over ? "border-accent bg-accent/[0.07]" : "border-line-2 bg-white/[0.015] hover:border-white/25"}`}
    >
      <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:gap-5 sm:py-6 sm:text-left">
        <motion.span animate={over ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }} className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent-2">
          <span className="absolute inset-0 animate-ping rounded-2xl border border-accent/25 [animation-duration:2.6s]" />
          <Icon d={ICONS.upload} />
        </motion.span>
        <span className="min-w-0">
          <span className="block text-[15px]">{over ? "Upuść, żeby dodać" : `Dodaj ${category === "animacje" ? "animacje" : "grafiki"} do biblioteki`}</span>
          <span className="mt-0.5 block text-[12.5px] text-dim">
            {category === "animacje" ? "MP4, WebM, GIF" : "PNG, JPG, WebP, SVG, PDF"} · do 200 MB · przeciągnij albo kliknij{blob ? "" : " · zapis na dysku serwera"}
          </span>
        </span>
      </button>
      <input ref={input} type="file" multiple accept={ACCEPT[category]} className="hidden" onChange={(e) => upload(Array.from(e.target.files ?? []))} />
      <AnimatePresence>
        {jobs.length > 0 && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden border-t border-line px-5 py-4">
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

function OwnCard({ a, onOpen }: { a: BrandAsset; onOpen: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(a.name);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();
  const abs = a.url.startsWith("/") ? (typeof window !== "undefined" ? location.origin : "") + a.url : a.url;
  return (
    <motion.figure layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.45, ease }} className="group edge overflow-hidden rounded-[20px] bg-surface/80">
      <button type="button" onClick={onOpen} className="relative block aspect-video w-full overflow-hidden bg-[repeating-conic-gradient(rgb(255_255_255/0.03)_0_25%,transparent_0_50%)] bg-[length:20px_20px]">
        <Media src={a.url} kind={a.kind} fit="contain" className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]" />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur">{a.kind.toUpperCase()}</span>
      </button>
      <figcaption className="space-y-3 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== a.name && start(async () => void (await renameBrandAsset(a.id, name), router.refresh()))}
          className="w-full truncate rounded-lg bg-transparent px-1 py-0.5 text-[14.5px] outline-none hover:bg-white/[0.04] focus:bg-white/[0.06]"
          aria-label="Nazwa pliku"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <a href={a.url} download className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3 py-1.5 text-[12.5px] hover:border-white/40">
            <Icon d={ICONS.download} className="size-3.5" /> {size(a.bytes)}
          </a>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(abs).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-muted hover:text-ink"
          >
            <Icon d={copied ? ICONS.check : ICONS.link} className="size-3.5" /> {copied ? "Skopiowano" : "Link"}
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
  const main = g.files.find((f) => VIDEO.includes(f.kind)) ?? g.files.find((f) => ["png", "jpg", "svg", "gif"].includes(f.kind)) ?? g.files[0];
  const ratio = g.w && g.h ? `${g.w} / ${g.h}` : "16 / 9";
  return (
    <motion.figure initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, ease }} className={`group edge overflow-hidden rounded-[22px] bg-surface/80 ${wide ? "md:col-span-2" : ""}`}>
      <button type="button" onClick={onOpen} className="relative block w-full overflow-hidden" style={{ aspectRatio: ratio, background: g.bg ?? "#07070a" }} aria-label={`Podgląd: ${g.title}`}>
        {main && <Media src={main.url} poster={g.poster} kind={main.kind} fit={g.bg ? "contain" : "cover"} bg={g.bg} className={g.bg ? "p-[8%]" : ""} />}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="pointer-events-none absolute right-3 bottom-3 grid size-9 translate-y-2 place-items-center rounded-full bg-white text-bg opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <Icon d={ICONS.eye} className="size-4" />
        </span>
      </button>
      <figcaption className="p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[15px]">{g.title}</p>
          <p className="text-[12px] text-dim tabular-nums">
            {g.w && g.h ? `${g.w} × ${g.h}` : ""}
            {g.duration ? ` · ${String(g.duration).replace(".", ",")} s` : ""}
          </p>
        </div>
        {g.description && <p className="mt-1 text-[13px] leading-relaxed text-dim">{g.description}</p>}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {g.files
            .filter((f) => f.kind !== "jpg" || !g.poster || f.url !== g.poster)
            .map((f) => (
              <DownloadPill key={f.url} f={f} />
            ))}
        </div>
      </figcaption>
    </motion.figure>
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
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.6, ease }} className="group edge overflow-hidden rounded-[22px] bg-surface/80">
      <button type="button" onClick={() => copy(c.hex)} className="relative flex h-36 w-full items-end p-4 text-left" style={{ background: c.hex, color: light ? "#0b0b0d" : "#f2f1ec" }}>
        <span className="text-[22px] tracking-[-0.02em]">{copied === c.hex ? "Skopiowano ✓" : c.hex}</span>
        <span className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[11px]" style={{ background: light ? "rgb(0 0 0 / 0.08)" : "rgb(255 255 255 / 0.1)" }}>
          AA {contrast(c.hex, light ? "#0b0b0d" : "#ffffff").toFixed(1)}:1
        </span>
      </button>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[14.5px]">{c.name}</p>
          {c.note && <p className="mt-0.5 text-[12.5px] text-dim">{c.note}</p>}
          <button type="button" onClick={() => copy(`rgb(${r}, ${g}, ${b})`)} className="mt-2 font-mono text-[11.5px] text-muted hover:text-ink">
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
      className="edge flex flex-col gap-3 rounded-[22px] bg-surface/80 p-4"
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
      <div className="flex items-center gap-3">
        <label className="relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ background: d.hex }}>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(d.hex) ? d.hex : "#000000"} onChange={(e) => setD({ ...d, hex: e.target.value.toUpperCase() })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Wybierz kolor" />
        </label>
        <input value={d.hex} onChange={(e) => setD({ ...d, hex: e.target.value })} className={`${field} h-11 font-mono`} aria-label="HEX" />
      </div>
      <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Nazwa, np. Violet" className={`${field} h-11`} />
      <input value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="Do czego (opcjonalnie)" className={`${field} h-11`} />
      {err && <p className="text-[13px] text-red-300">{err}</p>}
      <Btn type="submit" variant="primary" icon={ICONS.plus} disabled={pending}>
        Dodaj kolor
      </Btn>
    </form>
  );
}

/* ---------- całość ---------- */

export default function BrandBoard({ generated, own, palette, colors, blob }: { generated: Generated[]; own: BrandAsset[]; palette: PaletteColor[]; colors: BrandColor[]; blob: "public" | "private" | null }) {
  const [tab, setTab] = useState<Tab>("animacje");
  const [preview, setPreview] = useState<{ title: string; url: string; kind: string; poster?: string; bg?: string } | null>(null);

  useEffect(() => {
    const h = location.hash.slice(1) as Tab;
    if (["animacje", "grafiki", "kolory"].includes(h)) setTimeout(() => setTab(h), 0);
  }, []);
  const pick = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  const groups = useMemo(() => {
    const m = new Map<string, Generated[]>();
    for (const g of generated.filter((x) => x.category === tab)) m.set(g.group, [...(m.get(g.group) ?? []), g]);
    return [...m.entries()];
  }, [generated, tab]);
  const mine = own.filter((a) => a.category === tab);
  const count = (t: "animacje" | "grafiki") => generated.filter((g) => g.category === t).length + own.filter((a) => a.category === t).length;

  const tabs: { id: Tab; label: string; icon: string; n: number }[] = [
    { id: "animacje", label: "Animacje", icon: ICONS.eye, n: count("animacje") },
    { id: "grafiki", label: "Grafiki", icon: ICONS.grid, n: count("grafiki") },
    { id: "kolory", label: "Kolory", icon: ICONS.brand, n: palette.length + colors.length },
  ];

  return (
    <div>
      <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0" data-lenis-prevent>
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => pick(t.id)} className={`relative flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-3 text-[14px] transition-colors ${tab === t.id ? "text-ink" : "text-muted hover:text-ink"}`}>
            {tab === t.id && <motion.span layoutId="brand-tab" className="edge absolute inset-0 rounded-2xl bg-white/[0.06]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <Icon d={t.icon} className="relative size-4" />
            <span className="relative">{t.label}</span>
            <span className={`relative rounded-full px-1.5 text-[11.5px] tabular-nums ${tab === t.id ? "bg-accent/20 text-accent-2" : "bg-white/[0.05] text-dim"}`}>{t.n}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
          {tab === "kolory" ? (
            <div className="space-y-8">
              <section>
                <h2 className="mb-4 text-[15px] text-dim">Kolory marki</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {palette.map((c, i) => (
                    <Swatch key={c.hex + c.name} c={c} i={i} />
                  ))}
                </div>
              </section>
              <section>
                <h2 className="mb-4 text-[15px] text-dim">Twoje kolory</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {colors.map((c, i) => (
                    <Swatch key={c.id} c={{ ...c, note: c.note ?? undefined }} own i={i} />
                  ))}
                  <AddColor />
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-10">
              <section>
                <Uploader category={tab} blob={blob} />
                {mine.length > 0 && (
                  <>
                    <h2 className="mt-8 mb-4 flex items-center gap-2 text-[15px] text-dim">
                      Twoje pliki <span className="rounded-full bg-white/[0.05] px-1.5 text-[11.5px]">{mine.length}</span>
                    </h2>
                    <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <AnimatePresence>
                        {mine.map((a) => (
                          <OwnCard key={a.id} a={a} onOpen={() => setPreview({ title: a.name, url: a.url, kind: a.kind })} />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </>
                )}
              </section>

              {groups.map(([name, items]) => (
                <section key={name}>
                  <div className="mb-4 flex items-baseline justify-between gap-4">
                    <h2 className="text-[17px] tracking-[-0.01em]">{name}</h2>
                    <span className="text-[12.5px] text-dim">{items.length}</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((g) => {
                      const wide = !!(g.w && g.h && g.w / g.h > 2.4);
                      const main = g.files.find((f) => VIDEO.includes(f.kind)) ?? g.files.find((f) => ["png", "svg", "gif", "jpg"].includes(f.kind)) ?? g.files[0];
                      return <GenCard key={g.id} g={g} wide={wide} onOpen={() => main && setPreview({ title: g.title, url: main.url, kind: main.kind, poster: g.poster, bg: g.bg })} />;
                    })}
                  </div>
                </section>
              ))}
              {!groups.length && !mine.length && <Empty icon={ICONS.upload} title="Pusto" text="Dodaj pierwsze pliki — przeciągnij je na pole powyżej." />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ""} wide>
        {preview && (
          <div className="overflow-hidden rounded-2xl bg-[repeating-conic-gradient(rgb(255_255_255/0.03)_0_25%,transparent_0_50%)] bg-[length:20px_20px]" style={{ background: preview.bg }}>
            {VIDEO.includes(preview.kind) ? (
              <video src={preview.url} poster={preview.poster} autoPlay muted loop playsInline controls className="max-h-[70svh] w-full object-contain" />
            ) : preview.kind === "pdf" ? (
              <iframe src={preview.url} title={preview.title} className="h-[70svh] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={preview.title} className="max-h-[70svh] w-full object-contain p-2" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
