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
import { Btn, Card, CardHead, ease, field, ICONS, Icon, Label, Toggle } from "./kit";

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
      className={`group relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed transition-colors duration-300 ${over ? "border-accent bg-accent/[0.08]" : "border-line-2 hover:border-white/30"} ${multiple ? "h-28" : "aspect-[4/3]"}`}
    >
      <input ref={input} type="file" name={name} accept="image/*" multiple={multiple} className="hidden" onChange={(e) => {
          use(e.target.files);
          shrinkInput(e.target);
        }} />
      {!multiple && preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover object-top" />
          <span className="absolute inset-0 grid place-items-center bg-black/50 text-[13px] opacity-0 transition-opacity group-hover:opacity-100">Zmień zdjęcie</span>
        </>
      ) : (
        <span className="flex flex-col items-center gap-2 text-center text-[13px] text-muted">
          <motion.span animate={over ? { y: -4 } : { y: 0 }} className="grid size-11 place-items-center rounded-xl bg-white/[0.05] text-accent-2">
            <Icon d={ICONS.upload} />
          </motion.span>
          {multiple ? "Dodaj zdjęcia do galerii" : "Upuść zdjęcie albo kliknij"}
          <span className="text-[11.5px] text-dim">JPG, PNG, WebP · zapisze się jako WebP</span>
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
  const [toast, setToast] = useState(false);
  const [seo, setSeo] = useState({ title: project?.seoTitle ?? "", description: project?.seoDescription ?? "" });

  useEffect(() => {
    if (!state?.ok) return;
    const t1 = setTimeout(() => {
      setToast(true);
      setKeep(state.gallery ?? []);
      setAdded([]);
    }, 0);
    const t2 = setTimeout(() => setToast(false), 2200);
    if (!project && state.id) router.replace(`/panel/admin/portfolio/${state.id}`);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [state, project, router]);

  const colors = v.palette.split(",").map((c) => c.trim()).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="galleryKeep" value={JSON.stringify(keep)} />

      <div className="space-y-4">
        <Card>
          <CardHead title="Informacje" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="Nazwa projektu" className="sm:col-span-2">
              <input name="name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={`${field} h-11`} placeholder="np. Ziarno" />
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
              <input name="year" value={v.year} onChange={(e) => setV({ ...v, year: e.target.value })} inputMode="numeric" maxLength={4} className={`${field} h-11`} />
            </Label>
            <Label label="Klient / branża" className="sm:col-span-2">
              <input name="client" required value={v.client} onChange={(e) => setV({ ...v, client: e.target.value })} className={`${field} h-11`} placeholder="np. Kawiarnia speciality" />
            </Label>
            <Label label="Opis" className="sm:col-span-2" hint="Widoczny na stronie projektu i w Google.">
              <textarea name="description" required rows={4} defaultValue={project?.description} className={`${field} resize-none py-3`} />
            </Label>
            <Label label="Zakres (po przecinku)" hint="np. Projekt UI, Next.js, Animacje">
              <input name="scope" defaultValue={project?.scope.join(", ")} className={`${field} h-11`} />
            </Label>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-[13px] text-muted">Paleta kolorów</span>
              <PaletteEditor name="palette" value={colors} onChange={(c) => setV({ ...v, palette: c.join(", ") })} image={img || undefined} />
            </div>
            <Label label="Adres gotowej strony (opcjonalnie)">
              <input name="url" type="url" defaultValue={project?.url ?? ""} placeholder="https://" className={`${field} h-11`} />
            </Label>
            <Label label="Adres w portfolio (slug)" hint="Puste = z nazwy">
              <input name="slug" defaultValue={project?.slug} placeholder="ziarno" className={`${field} h-11`} />
            </Label>
          </div>
        </Card>

        <Card delay={0.03}>
          <CardHead title="Wygląd w Google" sub="Opcjonalnie" />
          <div className="grid gap-4">
            <Label label={`Tytuł (${seo.title.length}/60)`}>
              <input name="seo_title" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} maxLength={120} placeholder={`${v.name || "Nazwa"} — ${serviceName(v.category).toLowerCase()} · ${v.client || "klient"}`} className={`${field} h-11`} />
            </Label>
            <Label label={`Opis (${seo.description.length}/155)`}>
              <textarea name="seo_description" rows={2} value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} maxLength={300} placeholder="Krótkie zdanie, które zachęci do kliknięcia w wynik wyszukiwania." className={`${field} resize-none py-3`} />
            </Label>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[12px] text-[#4d5156]">afto.works › portfolio › {v.name ? v.name.toLowerCase().replace(/\s+/g, "-") : "projekt"}</p>
              <p className="mt-1 line-clamp-1 text-[17px] text-[#1a0dab]">{seo.title || `${v.name || "Nazwa projektu"} — ${serviceName(v.category).toLowerCase()} · ${v.client || "klient"}`}</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-[#4d5156]">{seo.description || project?.description || "Opis projektu pojawi się tutaj."}</p>
            </div>
          </div>
        </Card>

        <Card delay={0.05}>
          <CardHead title="Galeria" sub="Dodatkowe zdjęcia na stronie projektu" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <AnimatePresence>
              {[...keep.map((u) => ({ u, kept: true })), ...added.map((u) => ({ u, kept: false }))].map(({ u, kept }) => (
                <motion.div key={u} layout className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-white/5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, ease }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="size-full object-cover" />
                  {kept && (
                    <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== u))} className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Usuń z galerii">
                      <Icon d={ICONS.close} className="size-3.5" />
                    </button>
                  )}
                  {!kept && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] text-white">nowe</span>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-3">
            <Drop name="gallery" multiple onFiles={(urls) => setAdded((a) => [...a, ...urls])} />
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card delay={0.08}>
          <CardHead title="Zdjęcie główne" sub="Najlepiej 1600 × 1200" />
          <Drop name="image" current={project?.image} onPreview={setImg} />
        </Card>

        <Card delay={0.12}>
          <CardHead title="Podgląd na stronie" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img && <img src={img} alt="" className="absolute inset-0 size-full object-cover object-top" />}
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/30 to-transparent" />
            <div className="absolute inset-x-4 bottom-4">
              <p className="text-[11px] text-accent-2">{serviceName(v.category)}</p>
              <p className="h-display mt-1 truncate text-[30px] text-white">{v.name || "Nazwa projektu"}</p>
              <p className="mt-1 text-[12px] text-white/60">
                {v.client || "Klient"} · {v.year}
              </p>
            </div>
          </div>
          {colors.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              {colors.map((c) => (
                <span key={c} className="h-6 flex-1 rounded-md ring-1 ring-white/10" style={{ background: c }} />
              ))}
            </div>
          )}
          <div className="mt-5 space-y-3">
            <Toggle name="published" defaultChecked={project?.published ?? true} label="Widoczny na stronie" />
            <Toggle name="featured" defaultChecked={project?.featured ?? true} label="Na stronie głównej" />
          </div>
        </Card>

        <div className="space-y-3">
          <Alert>{state?.error}</Alert>
          <AnimatePresence>
            {toast && (
              <motion.p className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-[14px] text-emerald-200" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                Zapisano — zmiany są już na stronie ✓
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <Btn type="button" variant="ghost" onClick={() => router.push("/panel/admin/portfolio")}>
              Wróć
            </Btn>
            <Btn type="submit" variant="primary" disabled={pending} icon={ICONS.check} className="flex-1">
              {pending ? "Zapisywanie i wgrywanie…" : project ? "Zapisz zmiany" : "Dodaj projekt"}
            </Btn>
          </div>
        </div>
      </div>
    </form>
  );
}
