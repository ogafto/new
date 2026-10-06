"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { createOrderSite, deleteOrderFile, linkOrderSite, registerOrderFile, updateOrder, uploadOrderLocal } from "@/app/panel/admin/zlecenia/actions";
import { createPayment } from "@/app/panel/admin/finanse/actions";
import { ConfirmBtn, field, Icon, ICONS, Label, Toggle } from "./kit";
import { CopyBtn, Segmented } from "./crm/ui";
import { Panel } from "./dash";

/* Zlecenie od strony admina: status, wiadomość dla klienta, pliki do oddania, strona w CMS, płatności */

type Status = "planned" | "active" | "done" | "cancelled";
type FileRow = { id: string; name: string; size: number; kind: string; created_at: number };
type SiteRow = { id: string; name: string; domain: string | null; public_key?: string };
type Pay = { id: string; title: string; amount: number; status: string; stripe_url: string | null };

const ST: { value: Status; label: string; dot: string }[] = [
  { value: "planned", label: "Zaplanowane", dot: "bg-sky-400" },
  { value: "active", label: "W realizacji", dot: "bg-accent" },
  { value: "done", label: "Oddane", dot: "bg-emerald-400" },
  { value: "cancelled", label: "Anulowane", dot: "bg-white/30" },
];

const KIND_ICON: Record<string, string> = {
  archiwum: "M4 7h16v13H4zM4 7l2-3h12l2 3M10 11h4",
  grafika: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01",
  wideo: "M4 6h12v12H4zM16 10l4-2v8l-4-2",
  pdf: "M7 3h7l5 5v13H7zM14 3v5h5M9 14h6M9 17h4",
  projekt: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  font: "M5 19L11 5h2l6 14M8 13h8",
  plik: "M7 3h7l5 5v13H7zM14 3v5h5",
};
const size = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : b >= 1e3 ? `${Math.round(b / 1e3)} kB` : `${b} B`);
const safe = (n: string) =>
  n
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(-80);

export function StatusNote({ id, status, note, hasFiles, hasEmail }: { id: string; status: Status; note: string; hasFiles: boolean; hasEmail: boolean }) {
  const router = useRouter();
  const [st, setSt] = useState(status);
  const [text, setText] = useState(note);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [notify, setNotify] = useState(true);
  const [msg, setMsg] = useState("");
  const [, start] = useTransition();
  const last = useRef(note);

  useEffect(() => {
    if (text === last.current) return;
    const t = setTimeout(() => {
      last.current = text;
      setSaved("saving");
      start(async () => {
        await updateOrder(id, { client_note: text });
        setSaved("saved");
      });
    }, 900);
    return () => clearTimeout(t);
  }, [text, id]);

  const change = (s: Status) => {
    setSt(s);
    setMsg("");
    start(async () => {
      const r = await updateOrder(id, { status: s, notify: s === "done" && notify && hasEmail, client_note: text });
      setMsg(s === "done" ? (r.mailed ? "Oddane — klient dostał maila z linkiem do plików." : "Oddane — klient widzi to w panelu.") : "");
      router.refresh();
    });
  };

  return (
    <Panel title="Status i wiadomość dla klienta" i={0}>
      <Segmented id="ord-st" value={st} onChange={change} items={ST} grid />
      {st !== "done" && hasEmail && (
        <div className="mt-3">
          <Toggle checked={notify} onChange={setNotify} label={`Przy „Oddane” wyślij klientowi maila${hasFiles ? " z linkiem do plików" : ""}`} />
        </div>
      )}
      <AnimatePresence>
        {msg && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden rounded-xl bg-emerald-400/[0.08] px-3 py-2 text-[13px] text-emerald-200">
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="mt-5 mb-1.5 flex items-center justify-between">
        <span className="text-[13px] text-muted">Wiadomość widoczna w zleceniu klienta</span>
        <span className="text-[12px] text-dim">{saved === "saving" ? "Zapisywanie…" : saved === "saved" ? "Zapisano ✓" : ""}</span>
      </div>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved("idle");
        }}
        maxLength={2000}
        placeholder="Np. Pierwsza wersja strony gotowa — link do podglądu: … Czekam na teksty do zakładki O nas."
        className={`${field} resize-none py-3 leading-relaxed`}
      />
    </Panel>
  );
}

export function Files({ orderId, files, blob }: { orderId: string; files: FileRow[]; blob: "public" | "private" | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<{ name: string; progress: number; error?: string }[]>([]);
  const [over, setOver] = useState(false);
  const [, start] = useTransition();

  const upload = async (list: File[]) => {
    if (!list.length) return;
    setQueue(list.map((f) => ({ name: f.name, progress: 0 })));
    const set = (i: number, p: Partial<{ progress: number; error: string }>) => setQueue((q) => q.map((x, j) => (j === i ? { ...x, ...p } : x)));
    if (blob) {
      const { upload: up } = await import("@vercel/blob/client");
      await Promise.all(
        list.map(async (f, i) => {
          try {
            const r = await up(`zlecenia/${orderId}/${safe(f.name)}`, f, { access: blob, handleUploadUrl: "/api/orders/upload", multipart: f.size > 8_000_000, onUploadProgress: (e) => set(i, { progress: e.percentage }) });
            const res = await registerOrderFile({ orderId, name: f.name, url: r.url, pathname: r.pathname, size: f.size, mime: f.type });
            set(i, res.error ? { error: res.error } : { progress: 100 });
          } catch (e) {
            set(i, { error: e instanceof Error ? e.message : "Błąd wgrywania" });
          }
        }),
      );
    } else {
      const fd = new FormData();
      fd.set("orderId", orderId);
      list.forEach((f) => fd.append("file", f));
      const r = await uploadOrderLocal(fd);
      setQueue((q) => q.map((x) => (r.error ? { ...x, error: r.error } : { ...x, progress: 100 })));
    }
    router.refresh();
    setTimeout(() => setQueue((q) => q.filter((x) => x.error)), 1500);
  };

  return (
    <Panel title={`Pliki dla klienta${files.length ? ` · ${files.length}` : ""}`} i={1}>
      <button
        type="button"
        onClick={() => input.current?.click()}
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
        className={`flex w-full items-center gap-4 rounded-2xl border border-dashed p-4 text-left transition-colors ${over ? "border-accent bg-accent/[0.08]" : "border-line-2 hover:border-white/30 hover:bg-white/[0.02]"}`}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-[0_0_20px_-6px_rgb(139_108_255/0.9)]">
          <Icon d={ICONS.upload} className="size-5" />
        </span>
        <span>
          <span className="block text-[14.5px]">Wgraj pliki dla klienta</span>
          <span className="block text-[12.5px] text-dim">Przeciągnij albo kliknij · ZIP, PDF, grafiki, wideo, projekty · do 500 MB{blob ? "" : " · dysk serwera"}</span>
        </span>
      </button>
      <input ref={input} type="file" multiple className="hidden" onChange={(e) => upload(Array.from(e.target.files ?? []))} />

      {queue.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {queue.map((q, i) => (
            <li key={i} className="rounded-xl bg-white/[0.03] px-3 py-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="truncate">{q.name}</span>
                <span className={q.error ? "text-red-300" : "text-dim"}>{q.error ?? `${Math.round(q.progress)}%`}</span>
              </div>
              {!q.error && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${q.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-3 space-y-2">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-accent-2">
              <Icon d={KIND_ICON[f.kind] ?? KIND_ICON.plik} className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px]">{f.name}</span>
              <span className="block text-[12px] text-dim">
                {size(f.size)} · {f.kind}
              </span>
            </span>
            <a href={`/api/pliki/${f.id}`} className="grid size-8 place-items-center rounded-full text-dim transition-colors hover:bg-white/[0.06] hover:text-ink" aria-label="Pobierz">
              <Icon d={ICONS.download} className="size-4" />
            </a>
            <ConfirmBtn onConfirm={() => start(async () => (await deleteOrderFile(f.id), router.refresh()))}>{""}</ConfirmBtn>
          </li>
        ))}
      </ul>
      {!files.length && !queue.length && <p className="mt-3 text-[13px] text-dim">Klient zobaczy tu pliki do pobrania — np. paczkę z logo, PDF z brand bookiem albo eksport strony.</p>}
    </Panel>
  );
}

export function SiteLink({ orderId, site, sites, clientHasAccount, origin }: { orderId: string; site: SiteRow | null; sites: SiteRow[]; clientHasAccount: boolean; origin: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [preset, setPreset] = useState("firma");
  const [pick, setPick] = useState(sites[0]?.id ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (f: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError("");
      const r = await f();
      if (r.error) setError(r.error);
      router.refresh();
    });

  if (site)
    return (
      <Panel
        title="Strona klienta (CMS)"
        i={2}
        action={
          <button type="button" onClick={() => run(() => linkOrderSite(orderId, null))} className="text-[13px] text-dim hover:text-red-200">
            Odepnij
          </button>
        }
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(140deg,rgb(139_108_255/0.18),rgb(139_108_255/0.03))] p-4 ring-1 ring-accent/20 ring-inset">
          <p className="text-[16px]">{site.name}</p>
          <p className="mt-0.5 text-[13px] text-muted">{site.domain ?? "bez domeny"} · klient edytuje treści w swoim zleceniu</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/panel/admin/strony/${site.id}`} className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-bg hover:bg-white">
              <Icon d={ICONS.layers} className="size-4" /> Sekcje i pola
            </Link>
            <Link href={`/panel/strona/${site.id}`} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] hover:bg-white/[0.12]">
              <Icon d={ICONS.edit} className="size-4" /> Treści
            </Link>
          </div>
        </div>
        {site.public_key && (
          <div className="mt-4">
            <p className="mb-1.5 text-[12.5px] text-dim">Adres API dla strony klienta (podepnij w jej kodzie — pobiera treści jako JSON)</p>
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] py-1.5 pr-1.5 pl-3">
              <code className="min-w-0 flex-1 truncate text-[12.5px] text-accent-2">{`${origin}/api/cms/${site.public_key}`}</code>
              <CopyBtn text={`${origin}/api/cms/${site.public_key}`} />
            </div>
          </div>
        )}
      </Panel>
    );

  return (
    <Panel title="Strona klienta (CMS)" i={2}>
      <p className="-mt-1 mb-4 text-[13px] leading-relaxed text-muted">Podepnij stronę, którą klient będzie sam edytował z panelu (teksty, zdjęcia, oferta). Twoja strona pobiera treści z API — backend może być dowolny.</p>
      {!clientHasAccount ? (
        <p className="rounded-xl bg-amber-300/[0.07] px-3 py-2.5 text-[13px] text-amber-100">Klient nie ma jeszcze konta w panelu — najpierw go zaproś (Klienci → Zaproś klienta).</p>
      ) : (
        <>
          <Segmented
            id="site-mode"
            size="sm"
            value={mode}
            onChange={setMode}
            items={[
              { value: "new", label: "Nowa strona" },
              { value: "existing", label: `Istniejąca${sites.length ? ` · ${sites.length}` : ""}` },
            ]}
          />
          {mode === "new" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Label label="Nazwa">
                <input className={`${field} h-10`} value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Kawiarnia Ziarno" />
              </Label>
              <Label label="Domena">
                <input className={`${field} h-10`} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ziarno.pl" />
              </Label>
              <Label label="Zestaw sekcji" className="sm:col-span-2">
                <select className={`${field} h-10`} value={preset} onChange={(e) => setPreset(e.target.value)}>
                  <option value="firma">Strona firmowa (hero, o nas, usługi, kontakt)</option>
                  <option value="gastro">Gastronomia (menu, godziny, galeria)</option>
                  <option value="pusta">Pusta — ustawię sekcje sam</option>
                </select>
              </Label>
              <button type="button" disabled={pending} onClick={() => run(() => createOrderSite(orderId, { name, domain, preset }))} className="h-10 rounded-full bg-ink text-[13.5px] font-medium text-bg transition-colors hover:bg-white disabled:opacity-60 sm:col-span-2">
                {pending ? "Tworzenie…" : "Utwórz i podepnij"}
              </button>
            </div>
          ) : sites.length ? (
            <div className="mt-4 flex gap-2">
              <select className={`${field} h-10 flex-1`} value={pick} onChange={(e) => setPick(e.target.value)}>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.domain ? ` · ${s.domain}` : ""}
                  </option>
                ))}
              </select>
              <button type="button" disabled={pending || !pick} onClick={() => run(() => linkOrderSite(orderId, pick))} className="h-10 shrink-0 rounded-full bg-ink px-5 text-[13.5px] font-medium text-bg hover:bg-white disabled:opacity-60">
                Podepnij
              </button>
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-dim">Nie ma jeszcze żadnej strony w CMS.</p>
          )}
        </>
      )}
      {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}
    </Panel>
  );
}

export function OrderPayments({ order, payments }: { order: { id: string; title: string; client_name: string; client_email: string | null; user_id: string | null; service: string | null }; payments: Pay[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState(`${order.title} (zaliczka)`);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const zl = (gr: number) => `${(gr / 100).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;
  return (
    <Panel title="Płatności za zlecenie" i={3}>
      {payments.length > 0 && (
        <ul className="mb-4 space-y-2">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-2.5">
              <span className={`size-2 shrink-0 rounded-full ${p.status === "paid" ? "bg-emerald-400" : "bg-amber-300"}`} />
              <span className="min-w-0 flex-1 truncate text-[14px]">{p.title}</span>
              <span className="text-[14px] tabular-nums">{zl(Number(p.amount))}</span>
              <span className={`text-[12px] ${p.status === "paid" ? "text-emerald-300" : "text-amber-200"}`}>{p.status === "paid" ? "opłacone" : "czeka"}</span>
              {p.stripe_url && <CopyBtn text={p.stripe_url} label="Kopiuj link" />}
            </li>
          ))}
        </ul>
      )}
      <form
        className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          start(async () => {
            const r = await createPayment({ title, client_name: order.client_name, client_email: order.client_email ?? "", user_id: order.user_id ?? "", service: order.service ?? "", amount, due_date: "", method: "stripe", notes: "", paid: false, send: !!order.client_email, order_id: order.id });
            if (r.error && !r.url) return setError(r.error);
            setAmount("");
            router.refresh();
          });
        }}
      >
        <input className={`${field} h-10`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł płatności" />
        <input className={`${field} h-10`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Kwota zł" />
        <button type="submit" disabled={pending || !amount} className="h-10 rounded-full bg-ink px-4 text-[13.5px] font-medium text-bg hover:bg-white disabled:opacity-50">
          {pending ? "…" : "Wyślij link"}
        </button>
      </form>
      <p className="mt-2 text-[12px] text-dim">Link Stripe trafi do klienta mailem i pojawi się w jego zleceniu.</p>
      {error && <p className="mt-2 text-[13px] text-red-300">{error}</p>}
    </Panel>
  );
}

