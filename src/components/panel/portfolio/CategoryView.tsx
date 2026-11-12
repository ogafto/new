"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { deleteCategory, deleteWork, quickWork, reorderWorks, saveCategory, toggleWork } from "@/app/panel/admin/portfolio/actions";
import type { Category, Work } from "@/lib/projects";
import { ACCEPT_MEDIA, isGif, isMediaType, isVideo } from "@/lib/media";
import { attachMedia, type BlobMode, type Stage } from "@/lib/upload";
import { plural } from "@/lib/format";
import { Alert } from "../../account/ui";
import { Btn, ConfirmBtn, field, ICONS, Icon, Label, Toggle } from "../kit";
import { SectionCard } from "../settings/SectionNav";
import Media from "../../ui/Media";
import Drop from "./Drop";
import GifFix from "./GifFix";
import { MoveButtons, moveItem, SortItem } from "./Sortable";

type Upload = { key: string; name: string; preview: string; video: boolean; state: "wait" | "send" | "done" | "error"; progress?: number; stage?: Stage; error?: string };

const kind = (src: string) => (isVideo(src) ? "Wideo" : isGif(src) ? "GIF" : null);

// Kategoria w panelu: wrzucanie plików (zdjęcia, GIF-y, wideo), lista prac w kolejności ze strony i ustawienia kategorii
export default function CategoryView({ category, works, blob }: { category: Category & { image: string }; works: Work[]; blob: BlobMode }) {
  const router = useRouter();
  const [items, setItems] = useState(works);
  const order = useRef(works); // aktualna kolejność dla zapisu po upuszczeniu
  useEffect(() => {
    order.current = items;
  }, [items]);
  const [queue, setQueue] = useState<Upload[]>([]);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, start] = useTransition();
  const pick = useRef<HTMLInputElement>(null);
  const busy = queue.some((u) => u.state === "wait" || u.state === "send");

  useEffect(() => {
    const t = setTimeout(() => setItems(works), 0);
    return () => clearTimeout(t);
  }, [works]);

  /* szybkie dodawanie: każdy plik = nowa praca na dole kategorii, w kolejności upuszczenia */
  const upload = async (files: File[]) => {
    const list = files.filter((f) => isMediaType(f.type)).slice(0, 40);
    if (!list.length || busy) return;
    const jobs: Upload[] = list.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, preview: URL.createObjectURL(f), video: f.type.startsWith("video/"), state: "wait" }));
    setQueue(jobs);
    const set = (key: string, patch: Partial<Upload>) => setQueue((q) => q.map((u) => (u.key === key ? { ...u, ...patch } : u)));
    for (let i = 0; i < list.length; i++) {
      set(jobs[i].key, { state: "send" });
      try {
        const fd = new FormData();
        fd.set("category", category.id);
        fd.set("name", list[i].name);
        await attachMedia(fd, "image", list[i], blob, (p, stage) => set(jobs[i].key, { progress: p, stage }));
        const r = await quickWork(fd);
        set(jobs[i].key, r.error ? { state: "error", error: r.error } : { state: "done" });
      } catch (e) {
        set(jobs[i].key, { state: "error", error: e instanceof Error ? e.message : "Nie udało się wgrać." });
      }
    }
    router.refresh();
    setTimeout(() => setQueue((q) => q.filter((u) => u.state === "error")), 2400);
  };

  const persist = (list: Work[]) =>
    start(async () => {
      await reorderWorks(list.map((w) => w.id));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  const moveTo = (from: number, to: number) => {
    const a = moveItem(items, from, to);
    if (a === items) return;
    setItems(a);
    persist(a);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
      <div className="min-w-0 space-y-4">
        <GifFix gifs={items.filter((w) => isGif(w.image)).map((w) => ({ id: w.id, name: w.name, image: w.image }))} blob={blob} />

        {/* wrzucanie plików */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && pick.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick.current?.click())}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            if (!e.dataTransfer.files.length) return;
            e.preventDefault();
            setOver(false);
            upload(Array.from(e.dataTransfer.files));
          }}
          className={`group relative cursor-pointer overflow-hidden rounded-[22px] border border-dashed p-5 outline-none transition-[border-color,background-color,box-shadow] duration-300 focus-visible:shadow-[0_0_0_4px_rgb(139_108_255/0.15)] sm:p-6 ${over ? "border-accent bg-accent/[0.08] shadow-[0_0_0_4px_rgb(139_108_255/0.12)]" : "border-white/[0.12] bg-[radial-gradient(70%_120%_at_50%_0%,rgb(139_108_255/0.08),transparent)] hover:border-white/25"}`}
        >
          <input
            ref={pick}
            type="file"
            accept={ACCEPT_MEDIA}
            multiple
            className="hidden"
            onChange={(e) => {
              upload(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-4">
            <motion.span animate={over ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent-2">
              <Icon d={ICONS.upload} />
            </motion.span>
            <div className="min-w-0">
              <p className="text-[15px]">{over ? "Puść, wrzucam" : busy ? "Wgrywam…" : "Upuść pliki albo kliknij"}</p>
              <p className="mt-0.5 text-[12.5px] text-dim">
                Zdjęcia (JPG, PNG, WebP), GIF-y i wideo (MP4, WebM). GIF-y zamieniam na lżejsze wideo MP4. Każdy plik to nowa praca w „{category.name}”, od razu na stronie, na samym dole. Zdjęcia do 1920 × 1080, większe zmniejszę automatycznie. Pierwsza praca jest okładką kategorii.
              </p>
            </div>
          </div>
          <AnimatePresence>
            {queue.length > 0 && (
              <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-8" onClick={(e) => e.stopPropagation()}>
                {queue.map((u) => (
                  <li key={u.key} className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/[0.06]" title={u.error ?? u.name}>
                    {u.video ? (
                      <video src={u.preview} muted playsInline className={`size-full object-cover transition-opacity ${u.state === "done" ? "" : "opacity-50"}`} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.preview} alt="" className={`size-full object-cover transition-opacity ${u.state === "done" ? "" : "opacity-50"}`} />
                    )}
                    <span className="absolute inset-0 grid place-items-center">
                      {u.state === "send" &&
                        (u.progress && u.progress < 100 ? (
                          <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white tabular-nums" title={u.stage === "convert" ? "Zamieniam GIF na wideo" : "Wgrywam"}>
                            {u.stage === "convert" ? "→ MP4 " : ""}
                            {Math.round(u.progress)}%
                          </span>
                        ) : (
                          <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ))}
                      {u.state === "done" && (
                        <span className="grid size-7 place-items-center rounded-full bg-emerald-400 text-bg">
                          <Icon d={ICONS.check} className="size-4" />
                        </span>
                      )}
                      {u.state === "error" && (
                        <span className="grid size-7 place-items-center rounded-full bg-red-400 text-bg">
                          <Icon d={ICONS.close} className="size-4" />
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          {queue.some((u) => u.state === "error") && <p className="mt-3 text-[12.5px] text-red-300">{queue.find((u) => u.error)?.error}</p>}
        </div>

        <div className="flex min-h-5 items-center justify-between gap-3 px-1 text-[12.5px] text-dim">
          <span>
            {items.length} {plural(items.length, "praca", "prace", "prac")} · kolejność jak na stronie, od góry · przeciągnij za uchwyt albo użyj strzałek
          </span>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex shrink-0 items-center gap-1.5 text-emerald-300">
                <Icon d={ICONS.check} className="size-3.5" /> Zapisano kolejność
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-[rgb(13_13_18/0.92)]">
          <Reorder.Group as="ul" axis="y" values={items} onReorder={setItems} className="divide-y divide-white/[0.06]">
            {items.map((w, i) => (
              <SortItem key={w.id} value={w} onDrop={() => persist(order.current)} className="bg-[rgb(15_15_20)] transition-colors hover:bg-[rgb(19_19_26)]">
                {(handle) => (
                  <div className="flex items-center gap-2 px-2 py-2.5 sm:gap-3 sm:px-4">
                    {handle}
                    <span className="hidden w-6 shrink-0 text-[12px] text-dim tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>
                    <Link href={`/panel/admin/portfolio/${w.id}`} className={`relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/[0.06] sm:w-36 ${w.published ? "" : "opacity-40 grayscale"}`} aria-label={`Edytuj ${w.name}`}>
                      <Media src={w.image} fill sizes="144px" className="pointer-events-none object-cover" />
                    </Link>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[14.5px]">{w.name}</span>
                        {i === 0 && !category.cover && <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-px text-[10.5px] text-accent-2">okładka</span>}
                        {kind(w.image) && <span className="shrink-0 rounded-full bg-white/[0.07] px-1.5 py-px text-[10.5px] text-muted">{kind(w.image)}</span>}
                      </span>
                      <span className="block truncate text-[12px] text-dim tabular-nums">
                        {w.w > 4 && w.h > 3 ? `${w.w} × ${w.h}` : ""}
                        {w.gallery.length ? ` · +${w.gallery.length} zdj.` : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        start(async () => {
                          setItems((x) => x.map((y) => (y.id === w.id ? { ...y, published: !y.published } : y)));
                          await toggleWork(w.id);
                        })
                      }
                      className={`hidden h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] whitespace-nowrap transition-colors md:inline-flex ${w.published ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-line-2 text-dim hover:text-ink"}`}
                    >
                      <span className={`size-1.5 rounded-full ${w.published ? "bg-emerald-400" : "bg-white/30"}`} />
                      {w.published ? "Widoczna" : "Ukryta"}
                    </button>
                    <MoveButtons index={i} count={items.length} onMove={(to) => moveTo(i, to)} />
                    <span className="hidden shrink-0 items-center sm:flex">
                      <Link href={`/panel/admin/portfolio/${w.id}`} className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-ink" aria-label="Edytuj" title="Edytuj">
                        <Icon d={ICONS.edit} className="size-4" />
                      </Link>
                      <ConfirmBtn onConfirm={() => start(async () => (setItems((x) => x.filter((y) => y.id !== w.id)), await deleteWork(w.id)))} label="Usunąć?">
                        <span className="sr-only">Usuń</span>
                      </ConfirmBtn>
                    </span>
                  </div>
                )}
              </SortItem>
            ))}
          </Reorder.Group>
          {!items.length && <p className="px-5 py-10 text-center text-[13.5px] text-dim">Pusto. Wrzuć pierwsze pliki powyżej.</p>}
          <Link href={`/panel/admin/portfolio/nowy?kategoria=${category.id}`} className="group flex items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-3.5 text-[13.5px] text-muted transition-colors hover:bg-white/[0.02] hover:text-ink">
            <Icon d={ICONS.plus} className="size-4 text-accent-2 transition-transform duration-500 group-hover:rotate-90" />
            Praca z opisem (kilka zdjęć, klient, link)
          </Link>
        </div>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-[96px] lg:self-start">
        <Settings category={category} count={items.length} fallback={items.find((w) => !isVideo(w.image))?.image ?? ""} />
      </aside>
    </div>
  );
}

function Settings({ category, count, fallback }: { category: Category & { image: string }; count: number; fallback: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveCategory, undefined);
  const [on, setOn] = useState(category.published);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverKey, setCoverKey] = useState(0);
  const [toast, setToast] = useState(false);
  const [, start] = useTransition();

  useEffect(() => {
    if (!state?.ok) return;
    const t1 = setTimeout(() => {
      setToast(true);
      setRemoveCover(false);
      setCoverKey((k) => k + 1);
    }, 0);
    const t2 = setTimeout(() => setToast(false), 2400);
    router.refresh();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [state, router]);

  const own = !!category.cover && !removeCover;

  return (
    <SectionCard icon={ICONS.gear} title="Kategoria" text="Nazwa, opis i okładka na stronie głównej.">
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={category.id} />
        <input type="hidden" name="published" value={on ? "1" : "0"} />
        <input type="hidden" name="removeCover" value={removeCover ? "1" : "0"} />
        <Label label="Nazwa">
          <input name="name" required defaultValue={category.name} maxLength={60} className={`${field} h-11`} />
        </Label>
        <Label label="Adres" hint="Puste = z nazwy">
          <div className="flex h-11 items-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] transition-[border-color,box-shadow] duration-300 focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgb(139_108_255/0.12)] hover:border-white/25">
            <span className="shrink-0 pl-3.5 text-[13px] text-dim">/portfolio/</span>
            <input name="slug" defaultValue={category.slug} className="h-full min-w-0 flex-1 bg-transparent pr-3.5 text-[14.5px] text-ink outline-none" />
          </div>
        </Label>
        <Label label="Opis" hint="Opcjonalnie, pod nazwą na stronie kategorii.">
          <textarea name="description" rows={3} defaultValue={category.description} maxLength={400} className={`${field} resize-none py-3`} />
        </Label>
        <div>
          <p className="mb-1.5 flex items-center justify-between text-[13px] text-muted">
            Okładka
            {own && (
              <button type="button" onClick={() => setRemoveCover(true)} className="text-[12px] text-dim transition-colors hover:text-red-300">
                Usuń własną
              </button>
            )}
          </p>
          <Drop key={`${coverKey}-${removeCover}-${category.image}`} name="cover" current={removeCover ? fallback : category.image} aspect="aspect-[16/10]" hint={own ? "Własna okładka" : "Teraz: pierwsza praca. Wrzuć własną, jeśli chcesz"} />
        </div>
        <Toggle checked={on} onChange={setOn} label="Widoczna na stronie" />
        <Alert>{state?.error}</Alert>
        <AnimatePresence>
          {toast && (
            <motion.p className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-[13.5px] text-emerald-200" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Icon d={ICONS.check} className="size-4" /> Zapisano, już na stronie
            </motion.p>
          )}
        </AnimatePresence>
        <Btn type="submit" variant="primary" icon={ICONS.check} disabled={pending} className="w-full">
          {pending ? "Zapisuję…" : "Zapisz kategorię"}
        </Btn>
      </form>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <p className="text-[12px] text-dim">{count ? `Usuwa też ${count} ${plural(count, "pracę", "prace", "prac")}.` : "Kategoria jest pusta."}</p>
        <ConfirmBtn
          label="Na pewno?"
          onConfirm={() =>
            start(async () => {
              await deleteCategory(category.id);
              router.push("/panel/admin/portfolio");
            })
          }
        >
          Usuń
        </ConfirmBtn>
      </div>
    </SectionCard>
  );
}
