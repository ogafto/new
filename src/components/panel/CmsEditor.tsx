"use client";

import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { deleteEntry, moveEntry, saveEntry, uploadCmsImage } from "@/app/panel/cms/actions";
import type { Collection, Entry, Field } from "@/lib/cms-schema";
import { shrinkImage } from "@/lib/shrink";
import { Badge, Btn, Card, ConfirmBtn, ease, Empty, field, ICONS, Icon, Label, Toggle } from "./kit";

export type ColWithEntries = Collection & { entries: Entry[] };

function ImageField({ siteId, value, onChange }: { siteId: string; value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const upload = (f?: File) => {
    if (!f) return;
    setErr("");
    const fd = new FormData();
    start(async () => {
      fd.append("file", await shrinkImage(f));
      const r = await uploadCmsImage(siteId, fd);
      if (r.url) onChange(r.url);
      else setErr(r.error ?? "Błąd");
    });
  };
  return (
    <div>
      <div
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files[0]);
        }}
        className="group relative grid aspect-[16/9] max-w-[420px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line-2 bg-white/[0.02] transition-colors hover:border-white/30"
      >
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/50 text-[13px] opacity-0 transition-opacity group-hover:opacity-100">Zmień zdjęcie</span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 text-[13px] text-muted">
            <Icon d={ICONS.upload} />
            {pending ? "Wgrywanie…" : "Wgraj zdjęcie"}
          </span>
        )}
        {pending && <span className="absolute inset-0 grid place-items-center bg-black/60 text-[13px]">Wgrywanie…</span>}
      </div>
      <div className="mt-1.5 flex gap-3 text-[12px]">
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-dim hover:text-red-300">
            Usuń zdjęcie
          </button>
        )}
        {err && <span className="text-red-300">{err}</span>}
      </div>
    </div>
  );
}

// klucze API / hasła: ukryte, widoczne tylko na żądanie; nie trafiają do publicznego API strony
function SecretInput({ value, onChange }: { value: string; onChange: (v: unknown) => void }) {
  const [show, setShow] = useState(false);
  return (
    <span className="block">
      <span className="relative flex items-center">
        <input
          type={show ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Wklej klucz…"
          className={`${field} h-11 pr-11 font-mono text-[13px]`}
        />
        <button type="button" onClick={() => setShow((x) => !x)} className="absolute right-2 grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label={show ? "Ukryj" : "Pokaż"}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </button>
      </span>
      <span className="mt-1.5 block text-[11.5px] text-dim">🔒 Tajne — widzi je tylko serwer Twojej strony, nigdy odwiedzający</span>
    </span>
  );
}

function FieldInput({ f, value, onChange, siteId }: { f: Field; value: unknown; onChange: (v: unknown) => void; siteId: string }) {
  const s = typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
  switch (f.type) {
    case "textarea":
      return <textarea value={s} onChange={(e) => onChange(e.target.value)} rows={Math.min(12, Math.max(3, s.split("\n").length + 1))} className={`${field} resize-y py-3 leading-relaxed`} />;
    case "image":
      return <ImageField siteId={siteId} value={s} onChange={onChange} />;
    case "toggle":
      return <Toggle checked={!!value} onChange={onChange} label={value ? "Tak" : "Nie"} />;
    case "color":
      return (
        <span className="flex items-center gap-2">
          <input type="color" value={s || "#8b6cff"} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-line-2 bg-transparent p-1" />
          <input value={s} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className={`${field} h-11 max-w-[160px]`} />
        </span>
      );
    case "number":
      return <input type="number" value={s} onChange={(e) => onChange(e.target.value)} className={`${field} h-11 max-w-[220px]`} />;
    case "date":
      return <input type="date" value={s} onChange={(e) => onChange(e.target.value)} className={`${field} h-11 max-w-[220px] [color-scheme:dark]`} />;
    case "url":
      return <input type="url" value={s} onChange={(e) => onChange(e.target.value)} placeholder="https://" className={`${field} h-11`} />;
    case "secret":
      return <SecretInput value={s} onChange={onChange} />;
    default:
      return <input value={s} onChange={(e) => onChange(e.target.value)} className={`${field} h-11`} />;
  }
}

function EntryForm({ col, entry, siteId, onSaved, onCancel }: { col: Collection; entry: Entry | null; siteId: string; onSaved: (e: Entry) => void; onCancel?: () => void }) {
  const [data, setData] = useState<Record<string, unknown>>(entry?.data ?? {});
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(data) !== JSON.stringify(entry?.data ?? {});
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        start(async () => {
          const r = await saveEntry(col.id, entry?.id ?? null, data);
          if (r?.error) return setErr(r.error);
          setSaved(true);
          setTimeout(() => setSaved(false), 3500);
          onSaved({ id: r!.id!, collection_id: col.id, data, sort: entry?.sort ?? 999, updated_at: Date.now(), updated_by: null });
        });
      }}
      className="space-y-5"
    >
      {col.fields.map((f) => (
        <Label key={f.key} label={`${f.label}${f.required ? " *" : ""}`} hint={f.help}>
          <FieldInput f={f} value={data[f.key]} onChange={(v) => setData((d) => ({ ...d, [f.key]: v }))} siteId={siteId} />
        </Label>
      ))}
      {err && <p className="text-[13px] text-red-300">{err}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Btn type="submit" variant="primary" icon={ICONS.check} disabled={pending || (!dirty && !!entry)}>
          {pending ? "Zapisywanie…" : entry ? "Zapisz zmiany" : "Dodaj na stronę"}
        </Btn>
        {onCancel && (
          <Btn type="button" variant="ghost" onClick={onCancel}>
            Anuluj
          </Btn>
        )}
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.span key="ok" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[13px] text-emerald-300">
              <Icon d={ICONS.check} className="size-4" /> Zapisane — już na stronie
            </motion.span>
          ) : dirty && entry ? (
            <motion.span key="dirty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] text-amber-200">
              Masz niezapisane zmiany
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}

const titleOf = (col: Collection, e: Entry) => {
  const f = col.fields.find((x) => x.type === "text" || x.type === "textarea");
  const v = f ? e.data[f.key] : null;
  return typeof v === "string" && v ? v : "Bez tytułu";
};
const thumbOf = (col: Collection, e: Entry) => {
  const f = col.fields.find((x) => x.type === "image");
  const v = f ? e.data[f.key] : null;
  return typeof v === "string" && v ? v : null;
};

const subOf = (col: Collection, e: Entry) => {
  const f = col.fields.filter((x) => x.type === "text" || x.type === "textarea" || x.type === "number")[1];
  const v = f ? e.data[f.key] : null;
  return v === null || v === undefined || v === "" ? null : `${f!.label}: ${String(v).slice(0, 90)}`;
};

function ListEditor({ col, siteId, onChange }: { col: ColWithEntries; siteId: string; onChange: (entries: Entry[]) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();
  const entries = col.entries;
  const item = col.item || "element";
  const reorder = (next: Entry[]) => {
    onChange(next);
    start(() =>
      moveEntry(
        col.id,
        next.map((x) => x.id),
      ),
    );
  };
  const shift = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= entries.length) return;
    const next = [...entries];
    [next[i], next[j]] = [next[j], next[i]];
    reorder(next);
  };
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-muted">
          {entries.length ? `${entries.length} na stronie · kolejność jak tutaj` : "Na razie pusto — ta część strony się nie wyświetla"}
        </p>
        <Btn variant="primary" icon={ICONS.plus} onClick={() => setAdding(true)}>
          {`Dodaj ${item}`}
        </Btn>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div
            className="mb-3 overflow-hidden rounded-2xl border border-accent/40 bg-accent/[0.04] p-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <p className="mb-4 text-[14px] text-accent-2">{`Nowy ${item} — wypełnij i kliknij „Dodaj na stronę”`}</p>
            <EntryForm col={col} entry={null} siteId={siteId} onCancel={() => setAdding(false)} onSaved={(e) => (onChange([...entries, e]), setAdding(false))} />
          </motion.div>
        )}
      </AnimatePresence>
      {entries.length === 0 && !adding ? (
        <Empty icon={ICONS.layers} title="Nic tu jeszcze nie ma" text={`Kliknij „Dodaj ${item}” — pojawi się na stronie od razu po zapisaniu.`} />
      ) : (
        <Reorder.Group axis="y" values={entries} onReorder={onChange} className="space-y-2" as="ul">
          {entries.map((e, i) => {
            const thumb = thumbOf(col, e);
            const sub = subOf(col, e);
            return (
              <Reorder.Item
                key={e.id}
                value={e}
                className="overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.04] ring-inset"
                onDragEnd={() =>
                  start(() =>
                    moveEntry(
                      col.id,
                      entries.map((x) => x.id),
                    ),
                  )
                }
              >
                <div className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3">
                  <span className="hidden cursor-grab text-dim active:cursor-grabbing sm:block" title="Przeciągnij, żeby zmienić kolejność">
                    <Icon d={ICONS.drag} />
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[12px] text-muted tabular-nums">{i + 1}</span>
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                  )}
                  <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[14.5px]">{titleOf(col, e)}</span>
                    {sub && <span className="block truncate text-[12.5px] text-dim">{sub}</span>}
                  </button>
                  <span className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => shift(i, -1)} disabled={i === 0} className="grid h-4 w-7 place-items-center text-dim hover:text-ink disabled:opacity-20" aria-label="W górę">
                      <Icon d="M6 15l6-6 6 6" className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => shift(i, 1)} disabled={i === entries.length - 1} className="grid h-4 w-7 place-items-center text-dim hover:text-ink disabled:opacity-20" aria-label="W dół">
                      <Icon d="M6 9l6 6 6-6" className="size-3.5" />
                    </button>
                  </span>
                  <Btn size="sm" variant={open === e.id ? "outline" : "ghost"} icon={ICONS.edit} onClick={() => setOpen(open === e.id ? null : e.id)}>
                    <span className="hidden sm:inline">{open === e.id ? "Zwiń" : "Edytuj"}</span>
                  </Btn>
                  <ConfirmBtn onConfirm={() => start(async () => (await deleteEntry(col.id, e.id), onChange(entries.filter((x) => x.id !== e.id))))}>
                    <span className="sr-only">Usuń</span>
                  </ConfirmBtn>
                </div>
                <AnimatePresence initial={false}>
                  {open === e.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
                      <div className="border-t border-line p-5">
                        <EntryForm col={col} entry={e} siteId={siteId} onSaved={(n) => onChange(entries.map((x) => (x.id === n.id ? n : x)))} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}
    </div>
  );
}

// Edytor treści: po lewej sekcje, po prawej formularz / lista
export default function CmsEditor({ siteId, collections, admin = false }: { siteId: string; collections: ColWithEntries[]; admin?: boolean }) {
  const [cols, setCols] = useState(collections);
  const [active, setActive] = useState(collections[0]?.id ?? "");
  const col = cols.find((c) => c.id === active);

  if (!cols.length)
    return (
      <Card>
        <Empty icon={ICONS.layers} title="Strona jest w przygotowaniu" text="Gdy podepnę ją do panelu, zobaczysz tu wszystko, co możesz zmienić — teksty, zdjęcia, ofertę." />
      </Card>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* telefon: sekcje jako przewijane chipsy */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden" data-lenis-prevent>
        {cols.map((c) => (
          <button key={c.id} type="button" onClick={() => setActive(c.id)} className={`shrink-0 rounded-full px-4 py-2 text-[13.5px] transition-colors ${active === c.id ? "bg-ink text-bg" : "bg-white/[0.05] text-muted"}`}>
            {c.name}
            {c.kind === "list" && <span className="ml-1.5 opacity-60">{c.entries.length}</span>}
          </button>
        ))}
      </div>
      <Card pad={false} className="hidden lg:block lg:self-start">
        <p className="px-5 pt-4 pb-1 text-[12.5px] text-dim">Części strony</p>
        <ul className="p-2">
          {cols.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActive(c.id)}
                className={`relative flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${active === c.id ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {active === c.id && <motion.span layoutId="cms-col" className="absolute inset-0 rounded-xl bg-white/[0.06]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <span className="relative min-w-0">
                  <span className="block truncate">{c.name}</span>
                  {c.hint && <span className="block truncate text-[11.5px] text-dim">{c.hint}</span>}
                </span>
                <span className="relative shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-dim tabular-nums">{c.kind === "list" ? c.entries.length : "edytuj"}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      {col && (
        <Card key={col.id}>
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-medium tracking-[-0.02em]">{col.name}</h2>
              <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-muted">
                {col.hint || (col.kind === "list" ? `Dodawaj, zmieniaj i usuwaj — kolejność tutaj to kolejność na stronie.` : "Zmień, co chcesz, i kliknij „Zapisz zmiany” — od razu pojawi się na stronie.")}
              </p>
            </div>
            {admin && <Badge>{col.key}</Badge>}
          </div>
          {col.kind === "single" ? (
            <EntryForm col={col} entry={col.entries[0] ?? null} siteId={siteId} onSaved={(e) => setCols((cs) => cs.map((c) => (c.id === col.id ? { ...c, entries: [e] } : c)))} />
          ) : (
            <ListEditor col={col} siteId={siteId} onChange={(entries) => setCols((cs) => cs.map((c) => (c.id === col.id ? { ...c, entries } : c)))} />
          )}
        </Card>
      )}
    </div>
  );
}
