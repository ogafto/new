"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { checkSite, createSite, deleteCollection, deleteSite, regenerateKey, regenerateSecret, saveCollection, updateSite } from "@/app/panel/cms/actions";
import { cmsPrompt } from "@/lib/cms-prompt";
import { FIELD_TYPES, PRESETS, siteHref, type Collection, type Field, type Site } from "@/lib/cms-schema";
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

const agoText = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60000);
  return m < 1 ? "przed chwilą" : m < 60 ? `${m} min temu` : m < 1440 ? `${Math.round(m / 60)} h temu` : `${Math.round(m / 1440)} dni temu`;
};

function Connection({ site }: { site: Site }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);
  const seen = Number(site.last_seen ?? 0);
  const live = seen && now && now - seen < 7 * 86_400_000;
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ring-inset ${live ? "bg-emerald-400/[0.06] ring-emerald-400/20" : "bg-amber-300/[0.05] ring-amber-300/20"}`}>
      <span className={`relative grid size-10 shrink-0 place-items-center rounded-xl ${live ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-300/15 text-amber-200"}`}>
        {live && <span className="absolute inset-0 animate-ping rounded-xl ring-1 ring-emerald-400/40" />}
        <Icon d={live ? ICONS.check : ICONS.globe} className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px]">{live ? "Strona połączona z API" : "Strona jeszcze nie pobiera treści"}</span>
        <span className="block truncate text-[12.5px] text-dim">{seen && now ? `ostatnio ${agoText(seen)}${site.last_origin ? ` · ${site.last_origin}` : ""}` : "Wklej prompt poniżej w AI pracującym na kodzie strony — po pierwszym pobraniu zobaczysz tu ✓"}</span>
      </span>
    </div>
  );
}

function Integration({ site, origin, collections }: { site: Site; origin: string; collections: Collection[] }) {
  const [, start] = useTransition();
  const [show, setShow] = useState(false);
  const [brief, setBrief] = useState("");
  const api = `${origin}/api/cms/${site.public_key}`;
  const secret = site.secret_key ?? "";
  const prompt = cmsPrompt({ site: site.name, domain: site.domain, api, publicKey: site.public_key, secretKey: secret, origin, collections, brief });
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
      <div className="space-y-4">
        <Card>
          <CardHead title="Połączenie" sub="Czy strona klienta pobiera treści z panelu" />
          <Connection site={site} />
          <div className="mt-5 space-y-3">
            <div>
              <p className="mb-1.5 text-[12.5px] text-dim">Adres API (publiczny — bez sekretów)</p>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] py-1.5 pr-1.5 pl-3 font-mono text-[12.5px]">
                <span className="min-w-0 flex-1 truncate text-accent-2">{api}</span>
                <a href={api} target="_blank" className="grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label="Otwórz">
                  <Icon d={ICONS.site} className="size-4" />
                </a>
                <Copy text={api} />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[12.5px] text-dim">Klucz sekretny — tylko na serwerze strony (pola „sekret”, zgłaszanie pól)</p>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] py-1.5 pr-1.5 pl-3 font-mono text-[12.5px]">
                <span className="min-w-0 flex-1 truncate text-muted">{show ? secret : `${secret.slice(0, 6)}${"•".repeat(22)}`}</span>
                <button type="button" onClick={() => setShow((x) => !x)} className="grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label={show ? "Ukryj" : "Pokaż"}>
                  <Icon d={ICONS.eye} className="size-4" />
                </button>
                <Copy text={secret} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[12.5px] text-dim">
              <span>Wyciekł klucz? Nowy unieważnia stary.</span>
              <span className="flex gap-1">
                <ConfirmBtn onConfirm={() => start(() => regenerateKey(site.id))} label="Nowy publiczny?">
                  Publiczny
                </ConfirmBtn>
                <ConfirmBtn onConfirm={() => start(() => regenerateSecret(site.id))} label="Nowy sekretny?">
                  Sekretny
                </ConfirmBtn>
              </span>
            </div>
          </div>
        </Card>
        <Card delay={0.04}>
          <CardHead title="Jak to działa" />
          <ol className="space-y-3 text-[13.5px] leading-relaxed text-muted">
            {[
              ["Opisz potrzeby klienta", "np. sklep pod serwer Minecraft: rangi, ceny, płatności przez jego Stripe, komendy RCON po zakupie."],
              ["Skopiuj prompt do AI", "wklej w Claude Code / Cursor otwartym na kodzie strony klienta — klucze są już w środku."],
              ["AI zgłasza pola do edycji", "sekcje pojawią się tu i w panelu klienta same (PUT /schema)."],
              ["Klient edytuje", "teksty, zdjęcia, ofertę i swoje klucze (pola „sekret” nigdy nie trafiają do przeglądarki)."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/20 text-[12px] text-accent-2">{i + 1}</span>
                <span>
                  <span className="text-ink">{t}</span> — {d}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <Card delay={0.08} glow>
        <CardHead title="Prompt dla AI" sub="Podpina dowolną stronę: Next.js, PHP, WordPress, sklep, panel gry…">
          <Copy text={prompt} />
        </CardHead>
        <Label label="Czego potrzebuje klient (trafi do promptu)">
          <textarea
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Np. Sklep internetowy pod serwer Minecraft: rangi i przedmioty z cenami, płatności przez Stripe klienta, po zakupie komenda przez RCON, ogłoszenia i regulamin do edycji."
            className={`${field} resize-none py-3 leading-relaxed`}
          />
        </Label>
        <div className="relative mt-4">
          <pre className="max-h-[460px] overflow-auto rounded-2xl bg-[#060608] p-4 text-[12px] leading-relaxed whitespace-pre-wrap text-muted" data-lenis-prevent>
            {prompt}
          </pre>
          <span className="absolute top-2 right-2 rounded-full bg-[#060608]">
            <Copy text={prompt} />
          </span>
        </div>
        <p className="mt-3 text-[12.5px] text-dim">Prompt zawiera klucz sekretny — wklejaj go tylko w swoje narzędzia, nie wysyłaj klientowi.</p>
      </Card>
    </div>
  );
}

function Preview({ site }: { site: Site }) {
  const href = siteHref(site.domain);
  const [state, setState] = useState<{ ok: boolean; status?: number; ms?: number; frame?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!href) return;
    start(async () => setState(await checkSite(site.id)));
  }, [href, site.id, n]);
  if (!href)
    return (
      <Card>
        <Empty icon={ICONS.globe} title="Brak adresu strony" text="Dodaj domenę albo adres IP (np. http://51.68.10.20:3000) w Ustawieniach, żeby zobaczyć tu podgląd." />
      </Card>
    );
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] bg-surface p-4 ring-1 ring-white/[0.04] ring-inset">
          <p className="text-[12.5px] text-dim">Strona</p>
          <p className="mt-1 flex items-center gap-2 text-[16px]">
            <span className={`size-2 rounded-full ${!state ? "bg-white/30" : state.ok ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-red-400"}`} />
            {!state || pending ? "Sprawdzam…" : state.ok ? "Online" : `Nie odpowiada${state.status ? ` (${state.status})` : ""}`}
          </p>
          <p className="text-[12px] text-dim">{state?.ms ? `${state.ms} ms` : " "}</p>
        </div>
        <div className="rounded-[22px] bg-surface p-4 ring-1 ring-white/[0.04] ring-inset sm:col-span-2">
          <Connection site={site} />
        </div>
      </div>
      <Card pad={false}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-full bg-white/[0.04] px-3 py-1 text-center text-[12.5px] text-muted">{href.replace(/^https?:\/\//, "")}</span>
          <button type="button" onClick={() => setN((x) => x + 1)} className="grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label="Odśwież">
            <Icon d={ICONS.refresh} className="size-4" />
          </button>
          <a href={href} target="_blank" rel="noopener noreferrer" className="grid size-8 place-items-center rounded-full text-dim hover:text-ink" aria-label="Otwórz">
            <Icon d={ICONS.site} className="size-4" />
          </a>
        </div>
        {state && state.frame === false ? (
          <div className="grid h-[420px] place-items-center p-6 text-center">
            <div>
              <p className="text-[15px]">Strona nie pozwala się osadzić w podglądzie</p>
              <p className="mt-1 text-[13px] text-dim">Ma nagłówek X-Frame-Options / CSP frame-ancestors — otwórz ją w nowej karcie.</p>
            </div>
          </div>
        ) : (
          <iframe key={n} src={href} title={`Podgląd: ${site.name}`} className="h-[min(70vh,720px)] w-full bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" loading="lazy" />
        )}
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
        <Label label="Adres strony — domena albo IP" hint="np. sklep-klienta.pl albo http://51.68.10.20:3000 (bez https podaj z http://)">
          <input name="domain" defaultValue={site.domain ?? ""} placeholder="sklep-klienta.pl" className={`${field} h-11`} />
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
  const [tab, setTab] = useState<"preview" | "content" | "structure" | "api" | "settings">(site.last_seen ? "preview" : "api");
  return (
    <>
      <div className="mb-5">
        <Tabs
          id="site"
          value={tab}
          onChange={setTab}
          items={[
            { value: "preview", label: "Podgląd" },
            { value: "content", label: "Treści" },
            { value: "structure", label: "Sekcje i pola" },
            { value: "api", label: "Integracja i prompt AI" },
            { value: "settings", label: "Ustawienia" },
          ]}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}>
          {tab === "preview" && <Preview site={site} />}
          {tab === "content" && <CmsEditor key={JSON.stringify(collections.map((c) => [c.id, c.fields.length]))} siteId={site.id} collections={collections} admin />}
          {tab === "structure" && <Structure siteId={site.id} collections={collections} />}
          {tab === "api" && <Integration site={site} origin={origin} collections={collections} />}
          {tab === "settings" && <Settings site={site} clients={clients} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
