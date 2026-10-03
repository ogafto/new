"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { saveProject } from "@/app/panel/admin/portfolio/actions";
import { shrinkInput } from "@/lib/shrink";
import type { AdminProject } from "@/lib/projects";
import { serviceName, services, type ServiceId } from "@/lib/site";
import { Alert } from "../account/ui";
import PaletteEditor from "./PaletteEditor";
import { Btn, Card, ease, field, ICONS, Icon, Label, Toggle } from "./kit";
import { SectionCard } from "./settings/SectionNav";

const PALETTE_ICON = "M12 21a9 9 0 110-18c5 0 9 3.6 9 8 0 2.8-2.2 4-4.5 4H15a2 2 0 00-1.4 3.4A1.6 1.6 0 0112 21zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01M17.5 11h.01";
const IMAGE_ICON = "M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5zM4 16l4.5-4.5 4 4 2.5-2.5L20 18M15.5 9.5h.01";

// Pole na zdjęcie: kliknij albo upuść plik; podgląd od razu
function Drop({ name, current, onPreview, multiple = false, onFiles }: { name: string; current?: string; onPreview?: (url: string) => void; multiple?: boolean; onFiles?: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState(current ?? "");
  const use = (files: FileList | null) => {
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    if (multiple) onFiles?.(urls);
    else {
      setPreview(urls[0]);
      onPreview?.(urls[0]);
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click())}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!input.current) return;
        const dt = new DataTransfer();
        if (multiple) for (const f of Array.from(input.current.files ?? [])) dt.items.add(f);
        for (const f of Array.from(e.dataTransfer.files)) if (f.type.startsWith("image/")) dt.items.add(f);
        input.current.files = dt.files;
        shrinkInput(input.current);
        use(multiple ? e.dataTransfer.files : dt.files);
      }}
      onClick={() => input.current?.click()}
      className={`group relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed outline-none transition-[border-color,background-color,box-shadow] duration-300 focus-visible:shadow-[0_0_0_4px_rgb(139_108_255/0.15)] ${over ? "border-accent bg-accent/[0.08] shadow-[0_0_0_4px_rgb(139_108_255/0.12)]" : "border-white/[0.12] bg-[radial-gradient(80%_100%_at_50%_0%,rgb(139_108_255/0.06),transparent)] hover:border-white/25"} ${multiple ? "h-24" : "aspect-[4/3]"}`}
    >
      <input
        ref={input}
        type="file"
        name={name}
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          use(e.target.files);
          shrinkInput(e.target);
        }}
      />
      {!multiple && preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover object-top transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[12.5px] text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-bg">
            <Icon d={ICONS.upload} className="size-3.5" /> Zmień
          </span>
        </>
      ) : (
        <span className={`flex items-center gap-3 text-[13px] text-muted ${multiple ? "flex-row" : "flex-col text-center"}`}>
          <motion.span animate={over ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }} className="grid size-11 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent-2">
            <Icon d={multiple ? ICONS.plus : ICONS.upload} />
          </motion.span>
          <span className={multiple ? "text-left" : ""}>
            <span className="block text-ink">{over ? "Upuść tutaj" : multiple ? "Dodaj zdjęcia" : "Upuść zdjęcie albo kliknij"}</span>
            <span className="block text-[11.5px] text-dim">JPG, PNG, WebP → WebP{multiple ? "" : " · 1600 × 1200"}</span>
          </span>
        </span>
      )}
    </div>
  );
}

export default function ProjectForm({ project }: { project?: AdminProject }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProject, undefined);
  const [img, setImg] = useState(project?.image ?? "");
  const [keep, setKeep] = useState<string[]>(project?.gallery ?? []);
  const [added, setAdded] = useState<string[]>([]);
  const [v, setV] = useState({ name: project?.name ?? "", category: (project?.category ?? "www") as ServiceId, client: project?.client ?? "", year: project?.year ?? String(new Date().getFullYear()), palette: (project?.palette ?? []).join(", ") });
  const [desc, setDesc] = useState(project?.description ?? "");
  const [scope, setScope] = useState(project?.scope.join(", ") ?? "");
  const [flags, setFlags] = useState({ published: project?.published ?? true, featured: project?.featured ?? true });
  const [toast, setToast] = useState(false);
  const [seo, setSeo] = useState({ title: project?.seoTitle ?? "", description: project?.seoDescription ?? "" });

  useEffect(() => {
    if (!state?.ok) return;
    const t1 = setTimeout(() => {
      setToast(true);
      setKeep(state.gallery ?? []);
      setAdded([]);
    }, 0);
    const t2 = setTimeout(() => setToast(false), 2600);
    if (!project && state.id) router.replace(`/panel/admin/portfolio/${state.id}`);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [state, project, router]);

  const colors = v.palette
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
  const tags = scope
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const slug = v.name
    ? v.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/ł/g, "l")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : "projekt";
  const gallery = [...keep.map((u) => ({ u, kept: true })), ...added.map((u) => ({ u, kept: false }))];

  const submit = (
    <Btn type="submit" variant="primary" disabled={pending} icon={ICONS.check} className="flex-1">
      {pending ? "Zapisuję…" : project ? "Zapisz zmiany" : "Dodaj projekt"}
    </Btn>
  );

  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="galleryKeep" value={JSON.stringify(keep)} />

      <div className="min-w-0 space-y-4">
        <SectionCard icon={ICONS.edit} title="Podstawowe">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="Nazwa projektu" className="sm:col-span-2">
              <input name="name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={`${field} h-12 text-[16px]`} placeholder="np. Ziarno" />
            </Label>
            <Label label="Usługa">
              <select name="category" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value as ServiceId })} className={`${field} h-11 bg-surface`}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Rok">
              <input name="year" value={v.year} onChange={(e) => setV({ ...v, year: e.target.value })} inputMode="numeric" maxLength={4} className={`${field} h-11 tabular-nums`} />
            </Label>
            <Label label="Klient / branża" className="sm:col-span-2">
              <input name="client" required value={v.client} onChange={(e) => setV({ ...v, client: e.target.value })} className={`${field} h-11`} placeholder="np. Kawiarnia speciality" />
            </Label>
            <Label label="Adres w portfolio" hint="Puste = z nazwy">
              <div className="flex h-11 items-center overflow-hidden rounded-xl border border-line-2 bg-white/[0.02] transition-[border-color,box-shadow] duration-300 focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgb(139_108_255/0.12)] hover:border-white/25">
                <span className="shrink-0 pl-3.5 text-[13px] text-dim">/portfolio/</span>
                <input name="slug" defaultValue={project?.slug} placeholder={slug} className="h-full min-w-0 flex-1 bg-transparent pr-3.5 text-[14.5px] text-ink outline-none placeholder:text-dim" />
              </div>
            </Label>
            <Label label="Gotowa strona" hint="Opcjonalnie">
              <input name="url" type="url" defaultValue={project?.url ?? ""} placeholder="https://" className={`${field} h-11`} />
            </Label>
          </div>
        </SectionCard>

        <SectionCard icon={ICONS.doc} title="Opis i zakres" delay={0.03}>
          <div className="grid gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[13px] text-muted">Opis</span>
                <span className="text-[11.5px] text-dim tabular-nums">{desc.length}/1200</span>
              </div>
              <textarea name="description" required rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1200} className={`${field} resize-y py-3 leading-relaxed`} aria-label="Opis" />
            </div>
            <Label label="Zakres" hint="Po przecinku, np. Projekt UI, Next.js, Animacje">
              <input name="scope" value={scope} onChange={(e) => setScope(e.target.value)} className={`${field} h-11`} />
            </Label>
            {tags.length > 0 && (
              <div className="-mt-1 flex flex-wrap gap-1.5">
                <AnimatePresence initial={false}>
                  {tags.map((t) => (
                    <motion.span key={t} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[12px] text-muted">
                      {t}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard icon={PALETTE_ICON} title="Paleta" delay={0.05} badge={colors.length ? <span className="text-[12px] text-dim tabular-nums">{colors.length}/8</span> : undefined}>
          <PaletteEditor name="palette" value={colors} onChange={(c) => setV({ ...v, palette: c.join(", ") })} image={img || undefined} />
        </SectionCard>

        <SectionCard icon={IMAGE_ICON} title="Zdjęcia" delay={0.07} badge={<span className="text-[12px] text-dim tabular-nums">{gallery.length + (img ? 1 : 0)}</span>}>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div>
              <p className="mb-2 text-[13px] text-muted">Zdjęcie główne</p>
              <Drop name="image" current={project?.image} onPreview={setImg} />
            </div>
            <div className="min-w-0">
              <p className="mb-2 flex items-center justify-between text-[13px] text-muted">
                Galeria <span className="text-[12px] text-dim tabular-nums">{gallery.length}</span>
              </p>
              {gallery.length > 0 && (
                <div className="mb-2 grid grid-cols-3 gap-2">
                  <AnimatePresence>
                    {gallery.map(({ u, kept }) => (
                      <motion.div key={u} layout className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/[0.06]" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" className="size-full object-cover" />
                        {kept && (
                          <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== u))} className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/70 text-white opacity-100 backdrop-blur transition-opacity hover:bg-red-500/80 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Usuń z galerii">
                            <Icon d={ICONS.close} className="size-3.5" />
                          </button>
                        )}
                        {!kept && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] text-white">nowe</span>}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <Drop name="gallery" multiple onFiles={(urls) => setAdded((a) => [...a, ...urls])} />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={ICONS.search} title="Google" text="Opcjonalnie — puste pola uzupełnią się same." delay={0.09}>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="grid content-start gap-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[13px] text-muted">Tytuł</span>
                  <span className={`text-[11.5px] tabular-nums ${seo.title.length > 60 ? "text-amber-300" : "text-dim"}`}>{seo.title.length}/60</span>
                </div>
                <input name="seo_title" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} maxLength={120} placeholder={`${v.name || "Nazwa"} — ${serviceName(v.category).toLowerCase()} · ${v.client || "klient"}`} className={`${field} h-11`} aria-label="Tytuł w Google" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[13px] text-muted">Opis</span>
                  <span className={`text-[11.5px] tabular-nums ${seo.description.length > 155 ? "text-amber-300" : "text-dim"}`}>{seo.description.length}/155</span>
                </div>
                <textarea name="seo_description" rows={3} value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} maxLength={300} placeholder="Zdanie, które zachęci do kliknięcia." className={`${field} resize-none py-3`} aria-label="Opis w Google" />
              </div>
            </div>
            <div className="self-start rounded-2xl bg-white p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-[#f1f3f4] text-[10px] font-semibold text-[#202124]">a.</span>
                <p className="min-w-0 truncate text-[12px] text-[#4d5156]">afto.works › portfolio › {slug}</p>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[17px] leading-snug text-[#1a0dab]">{seo.title || `${v.name || "Nazwa projektu"} — ${serviceName(v.category).toLowerCase()} · ${v.client || "klient"}`}</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-[#4d5156]">{seo.description || desc || "Opis projektu pojawi się tutaj."}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* podgląd na żywo + publikacja */}
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-[96px] lg:self-start">
        <Card pad={false} delay={0.06} glow>
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <p className="flex items-center gap-2 text-[12.5px] text-dim">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative size-1.5 rounded-full bg-emerald-400" />
              </span>
              Podgląd na żywo
            </p>
            {project && (
              <a href={`/portfolio/${project.slug}`} target="_blank" className="flex items-center gap-1 text-[12.5px] text-muted transition-colors hover:text-ink">
                Na stronie <Icon d={ICONS.site} className="size-3.5" />
              </a>
            )}
          </div>
          <div className="px-3">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-[18px] bg-white/5 ring-1 ring-white/[0.06]">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className={`absolute inset-0 size-full object-cover object-top transition-[filter,opacity] duration-500 ${flags.published ? "" : "opacity-60 grayscale"}`} />
              ) : (
                <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(70%_60%_at_70%_20%,rgb(139_108_255/0.25),transparent_70%)] text-dim">
                  <Icon d={IMAGE_ICON} className="size-8" />
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg/95 via-bg/30 to-transparent" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                {!flags.published && <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">Ukryty</span>}
                {flags.published && flags.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/80 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                    <Icon d={ICONS.star} className="size-3" /> Wyróżniony
                  </span>
                )}
              </div>
              <div className="absolute inset-x-4 bottom-4">
                <p className="text-[11px] text-accent-2">{serviceName(v.category)}</p>
                <p className="h-display mt-1 truncate text-[30px] text-white">{v.name || "Nazwa projektu"}</p>
                <p className="mt-1 truncate text-[12px] text-white/60">
                  {v.client || "Klient"} · {v.year}
                </p>
              </div>
            </div>
          </div>
          <div className={`space-y-3 px-5 ${colors.length || tags.length ? "pt-4 pb-5" : "pt-1 pb-3"}`}>
            {colors.length > 0 ? (
              <div className="flex h-7 overflow-hidden rounded-lg ring-1 ring-white/10">
                {colors.map((c) => (
                  <motion.span key={c} layout className="flex-1" style={{ background: c }} title={c} />
                ))}
              </div>
            ) : null}
            {tags.length > 0 && <p className="truncate text-[12px] text-dim">{tags.join(" · ")}</p>}
          </div>
          <div className="space-y-3.5 border-t border-white/[0.06] bg-white/[0.015] px-5 py-4">
            <Toggle name="published" checked={flags.published} onChange={(x) => setFlags({ ...flags, published: x })} label="Widoczny na stronie" />
            <Toggle name="featured" checked={flags.featured} onChange={(x) => setFlags({ ...flags, featured: x })} label="Na stronie głównej" />
          </div>
        </Card>

        <div className="space-y-3">
          <Alert>{state?.error}</Alert>
          <AnimatePresence>
            {toast && (
              <motion.p className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-[13.5px] text-emerald-200" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Icon d={ICONS.check} className="size-4" /> Zapisano — już na stronie
              </motion.p>
            )}
          </AnimatePresence>
          <div className="hidden gap-2 lg:flex">
            <Btn type="button" variant="ghost" onClick={() => router.push("/panel/admin/portfolio")}>
              Wróć
            </Btn>
            {submit}
          </div>
        </div>
      </aside>

      {/* telefon / tablet: pasek zapisu nad dolną nawigacją */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 lg:hidden">
        <div className="flex gap-2 rounded-[20px] border border-white/[0.08] bg-[rgb(12_12_17/0.92)] p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-xl">
          <Btn type="button" variant="ghost" size="sm" className="!h-11" onClick={() => router.push("/panel/admin/portfolio")}>
            Wróć
          </Btn>
          {submit}
        </div>
      </div>
    </form>
  );
}
