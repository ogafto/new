"use client";

import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { deleteEntry, moveEntry, saveEntry, uploadCmsImage } from "@/app/panel/cms/actions";
import type { Collection, Entry, Field } from "@/lib/cms-schema";
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
    fd.append("file", f);
    start(async () => {
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
          setTimeout(() => setSaved(false), 1800);
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
      <div className="flex items-center gap-2">
        <Btn type="submit" variant="primary" size="sm" icon={ICONS.check} disabled={pending || (!dirty && !!entry)}>
          {pending ? "Zapisywanie…" : saved ? "Zapisano ✓" : "Zapisz i opublikuj"}
        </Btn>
        {onCancel && (
          <Btn type="button" size="sm" variant="ghost" onClick={onCancel}>
            Anuluj
          </Btn>
        )}
        {dirty && entry && <span className="text-[12px] text-amber-200">Niezapisane zmiany</span>}
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

function ListEditor({ col, siteId, onChange }: { col: ColWithEntries; siteId: string; onChange: (entries: Entry[]) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();
  const entries = col.entries;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-dim">
          {entries.length} {entries.length === 1 ? "pozycja" : "pozycji"} · przeciągnij, żeby zmienić kolejność
        </p>
        <Btn size="sm" variant="primary" icon={ICONS.plus} onClick={() => setAdding(true)}>
          Dodaj
        </Btn>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div className="mb-3 overflow-hidden rounded-2xl border border-accent/40 bg-accent/[0.04] p-5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease }}>
            <p className="mb-4 text-[14px] text-accent-2">Nowa pozycja</p>
            <EntryForm col={col} entry={null} siteId={siteId} onCancel={() => setAdding(false)} onSaved={(e) => (onChange([...entries, e]), setAdding(false))} />
          </motion.div>
        )}
      </AnimatePresence>
      {entries.length === 0 && !adding ? (
        <Empty icon={ICONS.layers} title="Pusto" text="Dodaj pierwszą pozycję — pojawi się na stronie." />
      ) : (
        <Reorder.Group axis="y" values={entries} onReorder={onChange} className="space-y-2" as="ul">
          {entries.map((e) => {
            const thumb = thumbOf(col, e);
            return (
              <Reorder.Item key={e.id} value={e} className="overflow-hidden rounded-2xl border border-line bg-surface" onDragEnd={() => start(() => moveEntry(col.id, entries.map((x) => x.id)))}>
                <div className="flex items-center gap-3 p-3">
                  <span className="cursor-grab text-dim active:cursor-grabbing">
                    <Icon d={ICONS.drag} />
                  </span>
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                  )}
                  <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} className="min-w-0 flex-1 truncate text-left text-[14.5px]">
                    {titleOf(col, e)}
                  </button>
                  <Btn size="sm" variant="ghost" icon={ICONS.edit} onClick={() => setOpen(open === e.id ? null : e.id)}>
                    <span className="hidden sm:inline">Edytuj</span>
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
export default function CmsEditor({ siteId, collections }: { siteId: string; collections: ColWithEntries[] }) {
  const [cols, setCols] = useState(collections);
  const [active, setActive] = useState(collections[0]?.id ?? "");
  const col = cols.find((c) => c.id === active);

  if (!cols.length)
    return (
      <Card>
        <Empty icon={ICONS.layers} title="Ta strona nie ma jeszcze sekcji" text="Administrator musi najpierw dodać sekcje i pola do edycji." />
      </Card>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card pad={false} className="lg:self-start">
        <ul className="p-2">
          {cols.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setActive(c.id)} className={`relative flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${active === c.id ? "text-ink" : "text-muted hover:text-ink"}`}>
                {active === c.id && <motion.span layoutId="cms-col" className="absolute inset-0 rounded-xl bg-white/[0.06]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <span className="relative truncate">{c.name}</span>
                <span className="relative text-[11.5px] text-dim">{c.kind === "list" ? c.entries.length : "•"}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      {col && (
        <Card key={col.id}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-medium tracking-[-0.02em]">{col.name}</h2>
              <p className="mt-0.5 text-[12.5px] text-dim">{col.kind === "list" ? "Lista pozycji" : "Pojedyncza sekcja"}</p>
            </div>
            <Badge>{col.key}</Badge>
          </div>
          {col.kind === "single" ? (
            <EntryForm
              col={col}
              entry={col.entries[0] ?? null}
              siteId={siteId}
              onSaved={(e) => setCols((cs) => cs.map((c) => (c.id === col.id ? { ...c, entries: [e] } : c)))}
            />
          ) : (
            <ListEditor col={col} siteId={siteId} onChange={(entries) => setCols((cs) => cs.map((c) => (c.id === col.id ? { ...c, entries } : c)))} />
          )}
        </Card>
      )}
    </div>
  );
}
