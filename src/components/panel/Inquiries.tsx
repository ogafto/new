"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { deleteInquiry, setInquiryNote, setInquiryStatus } from "@/app/panel/admin/zapytania/actions";
import { Card, ConfirmBtn, ease, Empty, ICONS, Icon } from "./kit";
import { ago, Avatar, CopyBtn, fold, Kbd, Portal, Search, Segmented, useNow } from "./crm/ui";

export type Inquiry = { id: string; name: string; email: string; phone: string | null; company: string | null; topic: string | null; budget: string | null; timeline: string | null; message: string; status: "new" | "contacted" | "won" | "lost"; note: string | null; created_at: number; source?: string | null };
type Status = Inquiry["status"];
type Filter = "all" | Status;

const ST: Record<Status, { label: string; dot: string; text: string }> = {
  new: { label: "Nowe", dot: "bg-accent", text: "text-accent-2" },
  contacted: { label: "W kontakcie", dot: "bg-sky-400", text: "text-sky-200" },
  won: { label: "Zlecenie", dot: "bg-emerald-400", text: "text-emerald-200" },
  lost: { label: "Bez zlecenia", dot: "bg-white/30", text: "text-muted" },
};
const ORDER = Object.keys(ST) as Status[];
const full = (ms: number) => new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(ms);
const desktop = () => typeof window !== "undefined" && matchMedia("(min-width: 1024px)").matches;
const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/* ---------- pozycja na liście ---------- */
function Item({ q, active, now, onClick }: { q: Inquiry; active: boolean; now: number; onClick: () => void }) {
  const unread = q.status === "new";
  return (
    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease }}>
      <button id={`inq-${q.id}`} type="button" onClick={onClick} aria-current={active || undefined} className={`group relative flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${active ? "" : "hover:bg-white/[0.035]"}`}>
        {active && <motion.span layoutId="inq-active" className="absolute inset-0 hidden rounded-2xl lg:block bg-white/[0.06] ring-1 ring-white/[0.08] ring-inset" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
        <span className="relative">
          <Avatar name={q.name} size={38} />
          {unread && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-accent shadow-[0_0_10px_rgb(139_108_255/0.9)] ring-2 ring-[#111117]" />}
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className={`truncate text-[14px] ${unread ? "font-medium text-ink" : "text-ink/85"}`}>{q.name}</span>
            {q.source === "panel" && <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-1.5 text-[10.5px] text-accent-2">panel</span>}
            <span className={`shrink-0 text-[11.5px] tabular-nums ${unread ? "text-accent-2" : "text-dim"}`}>{ago(q.created_at, now)}</span>
          </span>
          <span className={`mt-0.5 block truncate text-[13px] ${unread ? "text-ink/80" : "text-muted"}`}>{q.topic || "Zapytanie ze strony"}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-dim">{q.message}</span>
          <span className="mt-2 flex items-center gap-2 text-[11.5px]">
            <span className={`inline-flex items-center gap-1.5 ${ST[q.status].text}`}>
              <span className={`size-1.5 rounded-full ${ST[q.status].dot}`} />
              {ST[q.status].label}
            </span>
            {q.budget && (
              <>
                <span className="text-dim/60">·</span>
                <span className="truncate text-muted tabular-nums">{q.budget}</span>
              </>
            )}
            {q.note && <Icon d={ICONS.doc} className="ml-auto size-3.5 shrink-0 text-dim" />}
          </span>
        </span>
      </button>
    </motion.li>
  );
}

/* ---------- szczegóły ---------- */
function Chip({ href, icon, children, copy }: { href: string; icon: string; children: string; copy: string }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-line bg-white/[0.025] py-0.5 pr-0.5 pl-3 text-[13px] transition-colors hover:border-line-2">
      <a href={href} className="flex min-w-0 items-center gap-2 py-1 text-ink/90 hover:text-ink">
        <Icon d={icon} className="size-3.5 shrink-0 text-dim" />
        <span className="truncate">{children}</span>
      </a>
      <CopyBtn text={copy} label="Kopiuj" className="ml-1" />
    </span>
  );
}

const action = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-2 px-3.5 text-[13px] text-ink/90 transition-colors hover:border-white/35 hover:bg-white/[0.03] hover:text-ink";

function Detail({ q, now, pos, onStatus, onNote, onDelete, onMove }: { q: Inquiry; now: number; pos: [number, number] | null; onStatus: (s: Status) => void; onNote: (n: string) => void; onDelete: () => void; onMove?: (d: 1 | -1) => void }) {
  const first = q.name.split(" ")[0];
  const [note, setNote] = useState(q.note ?? "");
  const latest = useRef(q.note ?? "");
  const saved = useRef(q.note ?? "");
  const [ns, setNs] = useState<"idle" | "saving" | "saved">("idle");

  const flush = useCallback(async () => {
    const v = latest.current;
    if (v === saved.current) return;
    saved.current = v;
    setNs("saving");
    await setInquiryNote(q.id, v);
    onNote(v);
    setNs("saved");
  }, [q.id, onNote]);

  // autozapis notatki po chwili bez pisania
  useEffect(() => {
    if (note === saved.current) return;
    const t = setTimeout(flush, 800);
    return () => clearTimeout(t);
  }, [note, flush]);
  // przełączenie na inne zapytanie w trakcie pisania — zapisz od razu
  useEffect(
    () => () => {
      if (latest.current !== saved.current) setInquiryNote(q.id, latest.current);
    },
    [q.id],
  );

  const subject = `Re: ${q.topic?.split(",")[0] || "Twoje zapytanie"} — afto.works`;
  const quote = q.message.length > 700 ? `${q.message.slice(0, 700)}…` : q.message;
  const mailto = `mailto:${q.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Cześć ${first},\n\n\n\n—\n${full(q.created_at)} napisałeś/aś:\n> ${quote.replace(/\n/g, "\n> ")}`)}`;
  const meta: [string, string | null, string][] = [
    ["Usługa", q.topic, ICONS.layers],
    ["Budżet", q.budget, ICONS.wallet],
    ["Termin", q.timeline, ICONS.clock],
    ["Firma", q.company, ICONS.site],
  ];

  return (
    <motion.article key={q.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="flex min-h-full flex-col">
      {/* nagłówek */}
      <header className="flex items-start gap-4">
        <Avatar name={q.name} size={52} className="hidden sm:grid" />
        <div className="min-w-0 flex-1">
          <h2 className="h-display text-[24px] leading-tight break-words sm:text-[28px]">{q.name}</h2>
          {q.source === "panel" && <span className="mt-1.5 inline-flex rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[12px] text-accent-2">Zamówienie z panelu klienta</span>}
          <p className="mt-1 text-[13px] text-dim">
            {q.company && <span className="text-muted">{q.company} · </span>}
            <span className="first-letter:uppercase">{full(q.created_at)}</span>
            <span> · {ago(q.created_at, now)}</span>
          </p>
        </div>
        {pos && onMove && (
          <div className="hidden shrink-0 items-center gap-1 lg:flex">
            <span className="mr-1 text-[12px] text-dim tabular-nums">
              {pos[0] + 1} / {pos[1]}
            </span>
            <button type="button" onClick={() => onMove(-1)} disabled={pos[0] === 0} className="grid size-8 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-2 hover:text-ink disabled:opacity-30" aria-label="Poprzednie">
              <Icon d={ICONS.arrowUp} className="size-3.5" />
            </button>
            <button type="button" onClick={() => onMove(1)} disabled={pos[0] >= pos[1] - 1} className="grid size-8 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-2 hover:text-ink disabled:opacity-30" aria-label="Następne">
              <Icon d={ICONS.arrowDown} className="size-3.5" />
            </button>
          </div>
        )}
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip href={`mailto:${q.email}`} icon={ICONS.mail} copy={q.email}>
          {q.email}
        </Chip>
        {q.phone && (
          <Chip href={`tel:${q.phone.replace(/\s/g, "")}`} icon={ICONS.phone} copy={q.phone}>
            {q.phone}
          </Chip>
        )}
      </div>

      {/* akcje */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-line py-3">
        <a href={mailto} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-bg transition-colors hover:bg-white">
          <Icon d={ICONS.mail} className="size-4" />
          Odpowiedz
        </a>
        {q.phone && (
          <a href={`tel:${q.phone.replace(/\s/g, "")}`} className={action}>
            <Icon d={ICONS.phone} className="size-4" />
            Zadzwoń
          </a>
        )}
        <Link href={`/panel/admin/kalendarz?nowe=1&klient=${encodeURIComponent(q.company || q.name)}&email=${encodeURIComponent(q.email)}&tytul=${encodeURIComponent(q.topic?.split(" (")[0] ?? "")}`} className={action}>
          <Icon d={ICONS.calendar} className="size-4" />
          Do kalendarza
        </Link>
        <Link href={`/panel/admin/klienci?zapros=1&email=${encodeURIComponent(q.email)}&imie=${encodeURIComponent(first)}`} className={action}>
          <Icon d={ICONS.users} className="size-4" />
          Zaproś do panelu
        </Link>
        <span className="ml-auto">
          <ConfirmBtn onConfirm={onDelete} />
        </span>
      </div>

      {/* właściwości */}
      <dl className="mt-5 divide-y divide-line/70 rounded-2xl border border-line bg-white/[0.015]">
        <div className="grid grid-cols-1 gap-2.5 px-4 py-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center sm:gap-3 sm:py-2">
          <dt className="flex items-center gap-2 text-[13px] text-dim">
            <Icon d={ICONS.target} className="size-3.5" />
            Status
          </dt>
          <dd className="min-w-0">
            <Segmented id="inq-st" size="sm" grid value={q.status} onChange={onStatus} items={ORDER.map((s) => ({ value: s, label: ST[s].label, dot: ST[s].dot }))} />
          </dd>
        </div>
        {meta.map(([k, v, icon]) => (
          <div key={k} className="grid min-h-[46px] grid-cols-[92px_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 sm:grid-cols-[120px_minmax(0,1fr)]">
            <dt className="flex items-center gap-2 text-[13px] text-dim">
              <Icon d={icon} className="size-3.5" />
              {k}
            </dt>
            <dd className={`text-[14px] leading-snug break-words ${v ? "text-ink/90" : "text-dim"}`}>{v || "—"}</dd>
          </div>
        ))}
      </dl>

      {/* wiadomość */}
      <div className="mt-5">
        <p className="mb-2 text-[13px] text-muted">Wiadomość</p>
        <div className="rounded-2xl border border-line bg-white/[0.02] p-5">
          <p className="text-[15px] leading-[1.7] whitespace-pre-wrap text-ink/90">{q.message}</p>
        </div>
      </div>

      {/* notatka */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] text-muted">Notatka</p>
          <AnimatePresence mode="wait">
            {ns !== "idle" && (
              <motion.span key={ns} className={`flex items-center gap-1.5 text-[12px] ${ns === "saved" ? "text-emerald-300/90" : "text-dim"}`} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {ns === "saved" ? <Icon d={ICONS.check} className="size-3.5" /> : <span className="size-3 animate-spin rounded-full border border-white/20 border-t-white/70" />}
                {ns === "saved" ? "Zapisano" : "Zapisywanie…"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <textarea
          value={note}
          onChange={(e) => {
            latest.current = e.target.value;
            setNote(e.target.value);
            if (ns === "saved") setNs("idle");
          }}
          onBlur={flush}
          rows={4}
          maxLength={2000}
          placeholder="Tylko dla Ciebie"
          className="w-full resize-none rounded-2xl border border-line bg-white/[0.02] px-4 py-3 text-[14px] leading-relaxed text-ink outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-dim hover:border-line-2 focus:border-accent/70 focus:shadow-[0_0_0_4px_rgb(139_108_255/0.1)]"
        />
      </div>
    </motion.article>
  );
}

/* ---------- skrzynka ---------- */
export default function Inquiries({ rows: initial, now: serverNow }: { rows: Inquiry[]; now: number }) {
  const now = useNow(serverNow);
  const [patch, setPatch] = useState<Record<string, Partial<Inquiry> | null>>({});
  const rows = useMemo(() => initial.filter((r) => patch[r.id] !== null).map((r) => ({ ...r, ...patch[r.id] })), [initial, patch]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<string | null>(() => (initial.find((r) => r.status === "new") ?? initial[0])?.id ?? null);
  const [sheet, setSheet] = useState(false);
  const [sticky, setSticky] = useState<string | null>(null);
  const [, start] = useTransition();
  const search = useRef<HTMLInputElement>(null);
  const pane = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const f = fold(query.trim());
    return rows.filter((r) => (filter === "all" || r.status === filter) && (!f || fold([r.name, r.email, r.company, r.topic, r.message, r.phone].join(" ")).includes(f)));
  }, [rows, filter, query]);
  // zmiana statusu nie wyrzuca otwartego zapytania z podglądu, nawet gdy przestaje pasować do filtra
  const active = list.find((r) => r.id === sel) ?? (sticky && sticky === sel ? rows.find((r) => r.id === sel) : undefined) ?? list[0] ?? null;
  const idx = active ? list.findIndex((r) => r.id === active.id) : -1;
  const activeId = active?.id;
  useEffect(() => {
    pane.current?.scrollTo({ top: 0 });
  }, [activeId]);
  const count = (s: Status) => rows.filter((r) => r.status === s).length;

  const select = useCallback((id: string) => {
    setSel(id);
    requestAnimationFrame(() => document.getElementById(`inq-${id}`)?.scrollIntoView({ block: "nearest" }));
  }, []);
  const move = useCallback(
    (d: 1 | -1) => {
      if (!list.length) return;
      const next = list[Math.max(0, Math.min(list.length - 1, (idx < 0 ? -1 : idx) + d))];
      if (next) select(next.id);
    },
    [list, idx, select],
  );

  // ↑/↓ (oraz j/k) — poprzednie/następne, „/” — szukaj, Esc — zamknij podgląd na telefonie
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape" && sheet) return setSheet(false);
      if (typing(e.target) || document.querySelector("[aria-modal=true]:not([data-sheet])")) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "/") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [move, sheet]);

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setSticky(null);
    const inNew = rows.filter((r) => f === "all" || r.status === f);
    if (desktop() && active && !inNew.some((r) => r.id === active.id)) setSel(inNew[0]?.id ?? null);
  };
  const setStatus = (id: string, s: Status) => {
    setSticky(id);
    setPatch((p) => ({ ...p, [id]: { ...p[id], status: s } }));
    start(() => setInquiryStatus(id, s));
  };
  const setNote = useCallback((id: string, note: string) => setPatch((p) => (p[id] === null ? p : { ...p, [id]: { ...p[id], note: note || null } })), []);
  const remove = (id: string) => {
    const i = list.findIndex((r) => r.id === id);
    const next = list[i + 1] ?? list[i - 1];
    setPatch((p) => ({ ...p, [id]: null }));
    setSel(next?.id ?? null);
    if (!next) setSheet(false);
    start(() => deleteInquiry(id));
  };

  if (!initial.length)
    return (
      <Card>
        <Empty icon={ICONS.inbox} title="Skrzynka jest pusta" text="Wiadomości z formularza kontaktowego trafią tutaj." />
      </Card>
    );

  const detail = (q: Inquiry, withNav: boolean) => (
    <Detail
      key={q.id}
      q={q}
      now={now}
      pos={withNav && idx >= 0 ? [idx, list.length] : null}
      onMove={move}
      onStatus={(s) => setStatus(q.id, s)}
      onNote={(n) => setNote(q.id, n)}
      onDelete={() => remove(q.id)}
    />
  );

  return (
    <>
      <Card pad={false} className="lg:h-[calc(100svh-218px)] lg:min-h-[600px]">
        <div className="flex h-full flex-col">
          {/* pasek narzędzi */}
          <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <Segmented
              id="inq-filter"
              value={filter}
              onChange={changeFilter}
              items={[{ value: "all" as Filter, label: "Wszystkie", count: rows.length }, ...ORDER.map((s) => ({ value: s as Filter, label: ST[s].label, dot: ST[s].dot, count: count(s) }))]}
            />
            <Search inputRef={search} value={query} onChange={(v) => (setQuery(v), setSticky(null))} placeholder="Szukaj w zapytaniach" className="w-full sm:w-[260px]" />
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
            {/* lista */}
            <div className="flex min-h-0 min-w-0 flex-col lg:border-r lg:border-line">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]" data-lenis-prevent>
                {list.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-16 text-center">
                    <span className="grid size-11 place-items-center rounded-2xl border border-line-2 text-dim">
                      <Icon d={ICONS.search} className="size-5" />
                    </span>
                    <p className="mt-4 text-[14px]">Nic nie pasuje</p>
                    {(query || filter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setFilter("all");
                        }}
                        className="mt-2 text-[13px] text-accent-2 hover:underline"
                      >
                        Wyczyść filtry
                      </button>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    <AnimatePresence initial={false}>
                      {list.map((q) => (
                        <Item
                          key={q.id}
                          q={q}
                          now={now}
                          active={q.id === active?.id}
                          onClick={() => {
                            setSel(q.id);
                            if (!desktop()) setSheet(true);
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
              <div className="hidden items-center justify-between border-t border-line px-4 py-2.5 text-[11.5px] text-dim lg:flex">
                <span className="tabular-nums">
                  {list.length} z {rows.length}
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span className="mr-2">przełączaj</span>
                  <Kbd>/</Kbd>
                  <span>szukaj</span>
                </span>
              </div>
            </div>

            {/* podgląd (desktop) */}
            <div ref={pane} className="hidden min-h-0 overflow-y-auto overscroll-contain p-6 [scrollbar-width:thin] lg:block xl:p-8" data-lenis-prevent>
              {active ? (
                detail(active, true)
              ) : (
                <div className="grid h-full place-items-center">
                  <Empty icon={ICONS.inbox} title="Wybierz zapytanie" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* podgląd (telefon/tablet) — pełny ekran */}
      <Portal>
        <AnimatePresence>
          {sheet && active && (
            <motion.div className="fixed inset-0 z-[75] flex flex-col bg-bg lg:hidden" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.42, ease }} role="dialog" aria-modal="true" data-sheet aria-label={active.name}>
              <div className="flex items-center justify-between gap-3 border-b border-line px-3 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5">
                <button type="button" onClick={() => setSheet(false)} className="flex h-9 items-center gap-1.5 rounded-full pr-3.5 pl-2 text-[14px] text-muted transition-colors hover:bg-white/5 hover:text-ink">
                  <Icon d="M15 5l-7 7 7 7" className="size-4" />
                  Zapytania
                </button>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-[12px] text-dim tabular-nums">{idx >= 0 ? `${idx + 1} / ${list.length}` : ""}</span>
                  <button type="button" onClick={() => move(-1)} disabled={idx <= 0} className="grid size-9 place-items-center rounded-full border border-line text-muted disabled:opacity-30" aria-label="Poprzednie">
                    <Icon d={ICONS.arrowUp} className="size-4" />
                  </button>
                  <button type="button" onClick={() => move(1)} disabled={idx < 0 || idx >= list.length - 1} className="grid size-9 place-items-center rounded-full border border-line text-muted disabled:opacity-30" aria-label="Następne">
                    <Icon d={ICONS.arrowDown} className="size-4" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+32px)] sm:px-8" data-lenis-prevent>
                {detail(active, false)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
