"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { createSite, deleteCollection, deleteSite, regenerateKey, saveCollection, updateSite } from "@/app/panel/cms/actions";
import { FIELD_TYPES, PRESETS, type Collection, type Field, type Site } from "@/lib/cms-schema";
import { Alert } from "../account/ui";
import CmsEditor, { type ColWithEntries } from "./CmsEditor";
import { Badge, Btn, Card, CardHead, ConfirmBtn, ease, Empty, field, ICONS, Icon, Label, Modal, Tabs } from "./kit";

type Client = { id: string; name: string; email: string };

/* ---------- nowa strona ---------- */

export function NewSite({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createSite, undefined);
  useEffect(() => {
    if (state?.ok && state.id) router.push(`/panel/admin/strony/${state.id}`);
  }, [state, router]);
  return (
    <>
      <Btn variant="primary" size="sm" icon={ICONS.plus} onClick={() => setOpen(true)}>
        Nowa strona
      </Btn>
      <Modal open={open} onClose={() => setOpen(false)} title="Nowa strona klienta">
        <form action={action} className="space-y-4">
          <Label label="Nazwa">
            <input name="name" required placeholder="np. Kawiarnia Ziarno" className={`${field} h-11`} />
          </Label>
          <Label label="Domena (opcjonalnie)">
            <input name="domain" placeholder="ziarno.pl" className={`${field} h-11`} />
          </Label>
          <Label label="Klient (kto może edytować)" hint="Klient musi mieć konto — zaproś go w zakładce Klienci.">
            <select name="owner" className={`${field} h-11 bg-surface`}>
              <option value="">— tylko ja —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </Label>
          <div>
            <p className="mb-2 text-[13px] text-muted">Szablon na start</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(PRESETS).map(([k, p], i) => (
                <label key={k} className="cursor-pointer">
                  <input type="radio" name="preset" value={k} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="block h-full rounded-2xl border border-line-2 p-3.5 text-[13.5px] transition-colors peer-checked:border-accent peer-checked:bg-accent/10">
                    {p.name}
                    <span className="mt-1 block text-[12px] text-dim">{p.collections.length ? p.collections.map((c) => c.name).join(", ") : "Bez sekcji"}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Alert>{state?.error}</Alert>
          <Btn type="submit" variant="primary" disabled={pending} className="w-full" icon={ICONS.check}>
            {pending ? "Tworzenie…" : "Utwórz stronę"}
          </Btn>
        </form>
      </Modal>
    </>
  );
}

/* ---------- budowanie sekcji ---------- */

function CollectionEditor({ siteId, col, onClose }: { siteId: string; col: Partial<Collection> | null; onClose: () => void }) {
  const [name, setName] = useState(col?.name ?? "");
  const [key, setKey] = useState(col?.key ?? "");
  const [kind, setKind] = useState<"single" | "list">(col?.kind ?? "single");
  const [fields, setFields] = useState<Field[]>(col?.fields?.length ? col.fields : [{ key: "", label: "", type: "text" }]);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const upd = (i: number, f: Partial<Field>) => setFields((fs) => fs.map((x, j) => (j === i ? { ...x, ...f } : x)));
  const move = (i: number, d: number) =>
    setFields((fs) => {
      const n = [...fs];
      const [x] = n.splice(i, 1);
      n.splice(Math.max(0, Math.min(n.length, i + d)), 0, x);
      return n;
    });
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Nazwa sekcji">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Menu" className={`${field} h-11`} />
        </Label>
        <Label label="Klucz w API" hint="Puste = z nazwy">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="menu" className={`${field} h-11 font-mono text-[13px]`} />
        </Label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["single", "list"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-2xl border p-3.5 text-left text-[13.5px] transition-colors ${kind === k ? "border-accent bg-accent/10" : "border-line-2 hover:border-white/30"}`}>
            {k === "single" ? "Pojedyncza" : "Lista"}
            <span className="mt-0.5 block text-[12px] text-dim">{k === "single" ? "np. baner, o nas, kontakt" : "np. menu, usługi, galeria"}</span>
          </button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-[13px] text-muted">Pola</p>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {fields.map((f, i) => (
              <motion.li key={i} layout className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1.2fr_1fr_auto_auto]" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease }}>
                <input value={f.label} onChange={(e) => upd(i, { label: e.target.value })} placeholder="Etykieta, np. Cena" className={`${field} h-10`} />
                <select value={f.type} onChange={(e) => upd(i, { type: e.target.value as Field["type"] })} className={`${field} h-10 bg-surface max-sm:col-span-2 max-sm:row-start-2`}>
                  {FIELD_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 px-1 text-[12.5px] text-muted max-sm:row-start-3">
                  <input type="checkbox" checked={!!f.required} onChange={(e) => upd(i, { required: e.target.checked })} className="accent-[#8b6cff]" />
                  wymagane
                </label>
                <span className="flex items-center max-sm:row-start-1 max-sm:col-start-2">
                  <button type="button" onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label="W górę">
                    <Icon d={ICONS.arrowUp} className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label="W dół">
                    <Icon d={ICONS.arrowDown} className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-full text-dim hover:text-red-300" aria-label="Usuń pole">
                    <Icon d={ICONS.close} className="size-3.5" />
                  </button>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <Btn type="button" size="sm" variant="ghost" icon={ICONS.plus} className="mt-2" onClick={() => setFields((fs) => [...fs, { key: "", label: "", type: "text" }])}>
          Dodaj pole
        </Btn>
      </div>
      <Alert>{err}</Alert>
      <Btn
        variant="primary"
        className="w-full"
        icon={ICONS.check}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await saveCollection(siteId, { id: col?.id, name, key, kind, fields });
            if (r?.error) setErr(r.error);
            else onClose();
          })
        }
      >
        {pending ? "Zapisywanie…" : "Zapisz sekcję"}
      </Btn>
    </div>
  );
}

function Structure({ siteId, collections }: { siteId: string; collections: Collection[] }) {
  const [edit, setEdit] = useState<Partial<Collection> | null>(null);
  const [, start] = useTransition();
  return (
    <Card>
      <CardHead title="Sekcje i pola" sub="To, co klient może edytować — i jak wygląda w API">
        <Btn size="sm" variant="primary" icon={ICONS.plus} onClick={() => setEdit({})}>
          Sekcja
        </Btn>
      </CardHead>
      {collections.length === 0 ? (
        <Empty icon={ICONS.layers} title="Brak sekcji" text="Dodaj sekcję, np. „Baner główny” albo „Menu”." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {collections.map((c) => (
            <li key={c.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px]">{c.name}</p>
                  <p className="mt-0.5 font-mono text-[12px] text-dim">
                    {c.key} · {c.kind === "list" ? "lista" : "pojedyncza"}
                  </p>
                </div>
                <span className="flex">
                  <Btn size="sm" variant="ghost" icon={ICONS.edit} onClick={() => setEdit(c)}>
                    <span className="sr-only">Edytuj</span>
                  </Btn>
                  <ConfirmBtn onConfirm={() => start(() => deleteCollection(siteId, c.id))} label="Z treściami?">
                    <span className="sr-only">Usuń</span>
                  </ConfirmBtn>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.fields.map((f) => (
                  <Badge key={f.key}>
                    {f.label}
                    <span className="text-dim">· {FIELD_TYPES.find((t) => t.type === f.type)?.label}</span>
                  </Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edytuj sekcję" : "Nowa sekcja"} wide>
        {edit && <CollectionEditor key={edit.id ?? "new"} siteId={siteId} col={edit} onClose={() => setEdit(null)} />}
      </Modal>
    </Card>
  );
}

function Copy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => navigator.clipboard?.writeText(text).then(() => (setOk(true), setTimeout(() => setOk(false), 1400)))} className="grid size-8 shrink-0 place-items-center rounded-full text-dim transition-colors hover:bg-white/5 hover:text-ink" aria-label="Kopiuj">
      <Icon d={ok ? ICONS.check : ICONS.copy} className="size-4" />
    </button>
  );
}

function Integration({ site, origin, collections }: { site: Site; origin: string; collections: Collection[] }) {
  const [, start] = useTransition();
  const api = `${origin}/api/cms/${site.public_key}`;
  const snippet = `// Next.js (strona klienta) — treści z panelu afto.works
const res = await fetch("${api}", { next: { revalidate: 60 } });
const { content } = await res.json();

// np. content.${collections[0]?.key ?? "hero"}${collections[0]?.kind === "list" ? "[0]" : ""}`;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHead title="API treści" sub="Publiczne, tylko do odczytu (CORS włączony)" />
        <ul className="space-y-2 font-mono text-[12.5px]">
          {[api, ...collections.map((c) => `${api}/${c.key}`)].map((u) => (
            <li key={u} className="flex items-center gap-2 rounded-xl bg-white/[0.03] py-1.5 pr-1.5 pl-3">
              <span className="min-w-0 flex-1 truncate text-muted">{u.replace(origin, "")}</span>
              <a href={u} target="_blank" className="grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label="Otwórz">
                <Icon d={ICONS.site} className="size-4" />
              </a>
              <Copy text={u} />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-3 text-[12.5px] text-dim">
          <span>Klucz zmienisz, jeśli wyciekł — stary przestanie działać.</span>
          <ConfirmBtn onConfirm={() => start(() => regenerateKey(site.id))} label="Nowy klucz?">
            Nowy klucz
          </ConfirmBtn>
        </div>
      </Card>
      <Card delay={0.05}>
        <CardHead title="Jak podpiąć stronę" sub="Przykład dla Next.js — działa z każdą technologią (zwykły JSON)" />
        <div className="relative">
          <pre className="overflow-x-auto rounded-2xl bg-[#060608] p-4 text-[12.5px] leading-relaxed text-accent-2" data-lenis-prevent>
            {snippet}
          </pre>
          <span className="absolute top-2 right-2">
            <Copy text={snippet} />
          </span>
        </div>
        <p className="mt-4 text-[13px] text-dim">
          Webhook (Ustawienia) wywołuje się po każdej zmianie treści — np. Vercel Deploy Hook, żeby strona klienta przebudowała się sama.
        </p>
      </Card>
    </div>
  );
}

function Settings({ site, clients }: { site: Site; clients: Client[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card>
      <form
        className="grid max-w-[640px] gap-4"
        action={(f) =>
          start(async () => {
            setMsg(await updateSite(site.id, f));
          })
        }
      >
        <Label label="Nazwa">
          <input name="name" defaultValue={site.name} className={`${field} h-11`} />
        </Label>
        <Label label="Domena">
          <input name="domain" defaultValue={site.domain ?? ""} className={`${field} h-11`} />
        </Label>
        <Label label="Klient (może edytować treści)">
          <select name="owner" defaultValue={site.owner_id ?? ""} className={`${field} h-11 bg-surface`}>
            <option value="">— tylko ja —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </Label>
        <Label label="Webhook po zmianie treści (opcjonalnie)" hint="np. Vercel Deploy Hook (https://api.vercel.com/v1/integrations/deploy/…)">
          <input name="webhook" defaultValue={site.webhook_url ?? ""} placeholder="https://" className={`${field} h-11 font-mono text-[13px]`} />
        </Label>
        {msg?.error && <p className="text-[13px] text-red-300">{msg.error}</p>}
        {msg?.ok && <p className="text-[13px] text-emerald-300">Zapisano ✓</p>}
        <div className="flex items-center justify-between gap-3 pt-2">
          <ConfirmBtn onConfirm={() => start(async () => (await deleteSite(site.id), router.push("/panel/admin/strony")))} label="Usunąć stronę i treści?">
            Usuń stronę
          </ConfirmBtn>
          <Btn type="submit" variant="primary" disabled={pending} icon={ICONS.check}>
            Zapisz
          </Btn>
        </div>
      </form>
    </Card>
  );
}

export default function SiteAdmin({ site, collections, clients, origin }: { site: Site; collections: ColWithEntries[]; clients: Client[]; origin: string }) {
  const [tab, setTab] = useState<"content" | "structure" | "api" | "settings">("content");
  return (
    <>
      <div className="mb-5">
        <Tabs
          id="site"
          value={tab}
          onChange={setTab}
          items={[
            { value: "content", label: "Treści" },
            { value: "structure", label: "Sekcje i pola" },
            { value: "api", label: "Integracja" },
            { value: "settings", label: "Ustawienia" },
          ]}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}>
          {tab === "content" && <CmsEditor key={JSON.stringify(collections.map((c) => [c.id, c.fields.length]))} siteId={site.id} collections={collections} />}
          {tab === "structure" && <Structure siteId={site.id} collections={collections} />}
          {tab === "api" && <Integration site={site} origin={origin} collections={collections} />}
          {tab === "settings" && <Settings site={site} clients={clients} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
