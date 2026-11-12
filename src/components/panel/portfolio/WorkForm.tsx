"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { saveWork } from "@/app/panel/admin/portfolio/actions";
import type { Work } from "@/lib/projects";
import { ACCEPT_MEDIA, isRawType, isVideo } from "@/lib/media";
import { attachMedia, type BlobMode } from "@/lib/upload";
import { Alert } from "../../account/ui";
import { Btn, Card, ease, field, ICONS, Icon, Label, Toggle } from "../kit";
import { SectionCard } from "../settings/SectionNav";
import Drop from "./Drop";

const IMAGE_ICON = "M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5zM4 16l4.5-4.5 4 4 2.5-2.5L20 18M15.5 9.5h.01";

// Dodawanie i edycja pracy: nazwa, kategoria, plik główny (zdjęcie, GIF, wideo) + kolejne zdjęcia, reszta opcjonalnie
export default function WorkForm({ work, categories, initialCategory, blob }: { work?: Work; categories: { id: string; name: string }[]; initialCategory?: string; blob: BlobMode }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveWork, undefined);
  const [img, setImg] = useState({ url: work?.image ?? "", video: isVideo(work?.image) });
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [sending, setSending] = useState<number | null>(null); // postęp wgrywania GIF-a / wideo
  const [upError, setUpError] = useState("");
  const [keep, setKeep] = useState<string[]>(work?.gallery ?? []);
  const [added, setAdded] = useState<string[]>([]);
  const [v, setV] = useState({ name: work?.name ?? "", category: work?.categoryId || initialCategory || categories[0]?.id || "", client: work?.client ?? "", year: work?.year ?? String(new Date().getFullYear()) });
  const [desc, setDesc] = useState(work?.description ?? "");
  const [published, setPublished] = useState(work?.published ?? true);
  const [toast, setToast] = useState(false);
  const [dropKey, setDropKey] = useState(0);
  const back = `/panel/admin/portfolio/kategoria/${v.category}`;

  useEffect(() => {
    if (!state?.ok) return;
    if (!work && state.id) {
      router.replace(back);
      return;
    }
    const t1 = setTimeout(() => {
      setToast(true);
      setKeep(state.gallery ?? []);
      setAdded([]);
      setDropKey((k) => k + 1);
      setMainFile(null);
    }, 0);
    const t2 = setTimeout(() => setToast(false), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [state, work, router, back]);

  const gallery = [...keep.map((u) => ({ u, kept: true })), ...added.map((u) => ({ u, kept: false }))];
  const catName = categories.find((c) => c.id === v.category)?.name ?? "Kategoria";

  const submit = (
    <Btn type="submit" variant="primary" disabled={pending || sending !== null} icon={ICONS.check} className="flex-1">
      {sending !== null ? `Wgrywam… ${Math.round(sending)}%` : pending ? "Zapisuję…" : work ? "Zapisz zmiany" : "Dodaj pracę"}
    </Btn>
  );

  return (
    <form
      action={action}
      onSubmit={async (e) => {
        // GIF / wideo: wymiary z przeglądarki, a na Vercelu plik idzie najpierw prosto do Blob (bez limitu 4,5 MB)
        if (!mainFile || !isRawType(mainFile.type)) return;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setUpError("");
        setSending(0);
        try {
          await attachMedia(fd, "image", mainFile, blob, setSending);
          startTransition(() => action(fd));
        } catch (err) {
          setUpError(err instanceof Error ? err.message : "Nie udało się wgrać pliku.");
        } finally {
          setSending(null);
        }
      }}
      className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
      {work && <input type="hidden" name="id" value={work.id} />}
      <input type="hidden" name="galleryKeep" value={JSON.stringify(keep)} />

      <div className="min-w-0 space-y-4">
        <SectionCard icon={IMAGE_ICON} title="Pliki" text="Plik główny: zdjęcie, GIF albo wideo. Kolejne zdjęcia pojawią się na stronie pod nim." badge={<span className="text-[12px] text-dim tabular-nums">{gallery.length + (img.url ? 1 : 0)}</span>}>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <p className="mb-2 text-[13px] text-muted">Zdjęcie główne</p>
              <Drop name="image" current={work?.image} accept={ACCEPT_MEDIA} hint="Zdjęcie do 1920 × 1080, GIF albo MP4 / WebM" onPreview={(url, video) => setImg({ url, video })} onPick={setMainFile} />
            </div>
            <div className="min-w-0">
              <p className="mb-2 flex items-center justify-between text-[13px] text-muted">
                Kolejne zdjęcia <span className="text-[12px] text-dim">opcjonalnie</span>
              </p>
              {gallery.length > 0 && (
                <div className="mb-2 grid grid-cols-3 gap-2">
                  <AnimatePresence>
                    {gallery.map(({ u, kept }) => (
                      <motion.div key={u} layout className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/[0.06]" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" className="size-full object-cover" />
                        {kept && (
                          <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== u))} className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition-opacity hover:bg-red-500/80 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Usuń zdjęcie">
                            <Icon d={ICONS.close} className="size-3.5" />
                          </button>
                        )}
                        {!kept && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] text-white">nowe</span>}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <Drop key={dropKey} name="gallery" multiple onFiles={(urls) => setAdded((a) => [...a, ...urls])} />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={ICONS.edit} title="Opis" text="Tylko nazwa i kategoria są wymagane." delay={0.03}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="Nazwa" className="sm:col-span-2">
              <input name="name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} maxLength={80} className={`${field} h-12 text-[16px]`} placeholder="np. Logo dla GhostPlay" />
            </Label>
            <Label label="Kategoria">
              <select name="category" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} className={`${field} h-11 bg-surface`}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Rok">
              <input name="year" value={v.year} onChange={(e) => setV({ ...v, year: e.target.value })} inputMode="numeric" maxLength={4} className={`${field} h-11 tabular-nums`} />
            </Label>
            <Label label="Dla kogo" hint="Opcjonalnie: klient, serwer, marka">
              <input name="client" value={v.client} onChange={(e) => setV({ ...v, client: e.target.value })} maxLength={80} className={`${field} h-11`} />
            </Label>
            <Label label="Link" hint="Opcjonalnie: gotowa strona, Behance">
              <input name="url" type="url" defaultValue={work?.url ?? ""} placeholder="https://" className={`${field} h-11`} />
            </Label>
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[13px] text-muted">Opis</span>
                <span className="text-[11.5px] text-dim tabular-nums">{desc.length}/1200</span>
              </div>
              <textarea name="description" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1200} className={`${field} resize-y py-3 leading-relaxed`} aria-label="Opis" placeholder="Opcjonalnie: kilka zdań o projekcie." />
            </div>
            {work && (
              <Label label="Adres" hint="Link do tej pracy: /portfolio/kategoria#praca-adres" className="sm:col-span-2">
                <input name="slug" defaultValue={work.slug} className={`${field} h-11`} />
              </Label>
            )}
          </div>
        </SectionCard>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-[96px] lg:self-start">
        <Card pad={false} delay={0.06} glow>
          <p className="flex items-center gap-2 px-5 pt-4 pb-3 text-[12.5px] text-dim">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative size-1.5 rounded-full bg-emerald-400" />
            </span>
            Podgląd
          </p>
          <div className="px-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[radial-gradient(80%_80%_at_50%_30%,rgb(255_255_255/0.06),rgb(255_255_255/0.02))] ring-1 ring-white/[0.06]">
              {img.url && img.video ? (
                <video src={img.url} muted loop autoPlay playsInline className={`absolute inset-0 size-full object-contain p-3 transition-[filter,opacity] duration-500 ${published ? "" : "opacity-50 grayscale"}`} />
              ) : img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className={`absolute inset-0 size-full object-contain p-3 transition-[filter,opacity] duration-500 ${published ? "" : "opacity-50 grayscale"}`} />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-dim">
                  <Icon d={IMAGE_ICON} className="size-8" />
                </span>
              )}
            </div>
          </div>
          <div className="px-5 pt-4 pb-4">
            <p className="text-[11.5px] text-accent-2">{catName}</p>
            <p className="h-display mt-1 truncate text-[26px]">{v.name || "Nazwa pracy"}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-dim">{[v.client, v.year].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-4">
            <Toggle name="published" checked={published} onChange={setPublished} label="Widoczna na stronie" />
          </div>
        </Card>

        <div className="space-y-3">
          <Alert>{upError || state?.error}</Alert>
          <AnimatePresence>
            {toast && (
              <motion.p className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-[13.5px] text-emerald-200" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Icon d={ICONS.check} className="size-4" /> Zapisano, już na stronie
              </motion.p>
            )}
          </AnimatePresence>
          <div className="hidden gap-2 lg:flex">
            <Btn type="button" variant="ghost" onClick={() => router.push(back)}>
              Wróć
            </Btn>
            {submit}
          </div>
        </div>
      </aside>

      {/* telefon / tablet: pasek zapisu nad dolną nawigacją */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 lg:hidden">
        <div className="flex gap-2 rounded-[20px] border border-white/[0.08] bg-[rgb(12_12_17/0.92)] p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-xl">
          <Btn type="button" variant="ghost" size="sm" className="!h-11" onClick={() => router.push(back)}>
            Wróć
          </Btn>
          {submit}
        </div>
      </div>
    </form>
  );
}
