"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { plural } from "@/lib/format";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { deleteOrder, runReminders, saveOrder } from "@/app/panel/admin/kalendarz/actions";
import type { Order } from "@/lib/orders";
import { services } from "@/lib/site";
import { Alert } from "../account/ui";
import { Badge, Btn, Card, ConfirmBtn, ease, Empty, field, Icon, ICONS, Label, Modal, PageHead } from "./kit";
import { fold, Portal, Search, Segmented } from "./crm/ui";

type O = Order;
type Tone = O["status"] | "overdue";
type Client = { id: string; name: string; email: string };

const MONTHS = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const LABEL: Record<O["status"], string> = { planned: "Zaplanowane", active: "W realizacji", done: "Oddane", cancelled: "Anulowane" };
const TONE: Record<Tone, { bar: string; dot: string; badge: "sky" | "accent" | "green" | "default" | "red"; label: string }> = {
  planned: { bar: "bg-sky-400/[0.14] text-sky-100 hover:bg-sky-400/[0.22] before:bg-sky-400", dot: "bg-sky-400", badge: "sky", label: "Zaplanowane" },
  active: { bar: "bg-accent/[0.2] text-[#e4ddff] hover:bg-accent/[0.3] before:bg-accent-2", dot: "bg-accent", badge: "accent", label: "W realizacji" },
  done: { bar: "bg-emerald-400/[0.11] text-emerald-100/90 hover:bg-emerald-400/[0.18] before:bg-emerald-400", dot: "bg-emerald-400", badge: "green", label: "Oddane" },
  cancelled: { bar: "bg-white/[0.05] text-muted line-through decoration-white/30 hover:bg-white/[0.08] before:bg-white/30", dot: "bg-white/30", badge: "default", label: "Anulowane" },
  overdue: { bar: "bg-red-400/[0.16] text-red-100 hover:bg-red-400/[0.24] before:bg-red-400", dot: "bg-red-400", badge: "red", label: "Po terminie" },
};
const LANES = 3;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const noon = (s: string) => new Date(`${s}T12:00:00`);
const nice = (s: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(noon(s));
const long = (s: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" }).format(noon(s));
const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
const isOpen = (o: O) => o.status === "planned" || o.status === "active";
const rel = (d: number) => (d < 0 ? `${-d} d po` : d === 0 ? "dziś" : d === 1 ? "jutro" : `za ${d} d`);

/* ---------- formularz zlecenia ---------- */
function OrderForm({ order, clients, onDone }: { order: Partial<O>; clients: Client[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveOrder, undefined);
  const [, start] = useTransition();
  const [status, setStatus] = useState<O["status"]>(order.status ?? "planned");
  const [email, setEmail] = useState(order.client_email ?? "");
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {order.id && <input type="hidden" name="id" value={order.id} />}
      <input type="hidden" name="status" value={status} />
      <Label label="Zlecenie" className="sm:col-span-2">
        <input name="title" required defaultValue={order.title} placeholder="np. Strona firmowa + logo" className={`${field} h-11`} />
      </Label>
      <Label label="Klient">
        <input
          name="client_name"
          required
          defaultValue={order.client_name}
          list="cal-clients"
          placeholder="Imię / firma"
          className={`${field} h-11`}
          onChange={(e) => {
            const c = clients.find((x) => x.name === e.target.value);
            if (c && !email) setEmail(c.email);
          }}
        />
        <datalist id="cal-clients">
          {clients.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </Label>
      <Label label="E-mail klienta">
        <input name="client_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcjonalnie" className={`${field} h-11`} />
      </Label>
      <Label label="Usługa">
        <select name="service" defaultValue={order.service ?? ""} className={`${field} h-11 bg-surface`}>
          <option value="">—</option>
          {services.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
          <option value="Inne">Inne</option>
        </select>
      </Label>
      <Label label="Kwota (zł)">
        <input name="amount" inputMode="numeric" defaultValue={order.amount ?? ""} placeholder="np. 1500" className={`${field} h-11 tabular-nums`} />
      </Label>
      <Label label="Start">
        <input name="start_date" type="date" required defaultValue={order.start_date} className={`${field} h-11 [color-scheme:dark]`} />
      </Label>
      <Label label="Termin oddania">
        <input name="due_date" type="date" required defaultValue={order.due_date} className={`${field} h-11 [color-scheme:dark]`} />
      </Label>
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-[13px] text-muted">Status</span>
        <Segmented id="ord-status" grid value={status} onChange={setStatus} items={(Object.keys(LABEL) as O["status"][]).map((k) => ({ value: k, label: LABEL[k], dot: TONE[k].dot }))} />
      </div>
      <Label label="Przypomnienie mailem" className="sm:col-span-2">
        <select name="remind_days" defaultValue={order.remind_days ?? 3} className={`${field} h-11 bg-surface`}>
          {[0, 1, 2, 3, 5, 7, 14].map((d) => (
            <option key={d} value={d}>
              {d === 0 ? "Tylko w dniu terminu" : `${d} ${d === 1 ? "dzień" : "dni"} przed + w dniu`}
            </option>
          ))}
        </select>
      </Label>
      <Label label="Notatki" className="sm:col-span-2">
        <textarea name="notes" rows={3} defaultValue={order.notes ?? ""} className={`${field} resize-none py-3`} />
      </Label>
      <div className="sm:col-span-2">
        <Alert>{state?.error}</Alert>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-5 sm:col-span-2">
        {order.id ? <ConfirmBtn onConfirm={() => start(async () => (await deleteOrder(order.id!), onDone()))} /> : <span />}
        <Btn variant="primary" type="submit" disabled={pending} icon={ICONS.check}>
          {pending ? "Zapisywanie…" : order.id ? "Zapisz zmiany" : "Dodaj zlecenie"}
        </Btn>
      </div>
    </form>
  );
}

/* ---------- układ tygodnia: paski wielodniowe w torach ---------- */
type Seg = { o: O; s: number; e: number; lane: number; head: boolean; tail: boolean };
function layoutWeek(days: string[], evs: O[]) {
  const [ws, we] = [days[0], days[6]];
  const inWeek = evs.filter((o) => o.start_date <= we && o.due_date >= ws).sort((a, b) => a.start_date.localeCompare(b.start_date) || b.due_date.localeCompare(a.due_date));
  const occ: boolean[][] = [];
  const segs: Seg[] = [];
  const more = Array(7).fill(0) as number[];
  for (const o of inWeek) {
    const s = o.start_date < ws ? 0 : days.indexOf(o.start_date);
    const e = o.due_date > we ? 6 : days.indexOf(o.due_date);
    if (s < 0 || e < 0) continue;
    let lane = 0;
    while (occ[lane]?.slice(s, e + 1).some(Boolean)) lane++;
    occ[lane] ??= Array(7).fill(false);
    for (let i = s; i <= e; i++) occ[lane][i] = true;
    if (lane < LANES) segs.push({ o, s, e, lane, head: o.start_date >= ws, tail: o.due_date <= we });
    else for (let i = s; i <= e; i++) more[i]++;
  }
  return { segs, more };
}

/* ---------- pozycja agendy ---------- */
function AgendaItem({ o, today, onClick, note }: { o: O; today: string; onClick: () => void; note?: string }) {
  const t: Tone = isOpen(o) && o.due_date < today ? "overdue" : o.status;
  const d = diff(today, o.due_date);
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.04]">
      <span className={`h-8 w-[3px] shrink-0 rounded-full ${TONE[t].dot}`} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13.5px] ${o.status === "cancelled" ? "text-muted line-through" : ""}`}>{o.title}</span>
        <span className="block truncate text-[12px] text-dim">
          {o.client_name}
          {note ? ` · ${note}` : ""}
          {o.amount ? ` · ${zl(o.amount)}` : ""}
        </span>
      </span>
      {isOpen(o) && <span className={`shrink-0 text-[12px] tabular-nums ${d < 0 ? "text-red-300" : d <= 2 ? "text-amber-200" : "text-dim"}`}>{rel(d)}</span>}
    </button>
  );
}

/* ---------- kalendarz ---------- */
export default function Calendar({ orders, clients, today, mail }: { orders: O[]; clients: Client[]; today: string; mail: boolean }) {
  const sp = useSearchParams();
  const path = usePathname();
  const [y0, m0] = today.split("-").map(Number);
  const [ym, setYm] = useState({ y: y0, m: m0 - 1 });
  const [dir, setDir] = useState(0);
  const [view, setView] = useState<"month" | "list">("month");
  const [edit, setEdit] = useState<Partial<O> | null>(null);
  const [day, setDay] = useState(today);
  const [msg, setMsg] = useState("");
  const [sending, start] = useTransition();
  const dayCard = useRef<HTMLDivElement>(null);

  // ?nowe=1 (&klient, &email, &tytul) — od razu nowe zlecenie
  const flag = sp.get("nowe");
  const [seen, setSeen] = useState<string | null>(null);
  if (flag !== seen) {
    setSeen(flag);
    if (flag) setEdit({ client_name: sp.get("klient") ?? "", client_email: sp.get("email") ?? "", title: sp.get("tytul") ?? "", start_date: today, due_date: today, remind_days: 3, status: "planned" });
  }
  const close = () => {
    setEdit(null);
    if (flag) window.history.replaceState(null, "", path);
  };

  const weeks = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const n = Math.ceil((offset + new Date(ym.y, ym.m + 1, 0).getDate()) / 7);
    return Array.from({ length: n }, (_, w) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(ym.y, ym.m, w * 7 + i - offset + 1);
        return { date: iso(d), day: d.getDate(), inMonth: d.getMonth() === ym.m };
      }),
    );
  }, [ym]);

  const visible = useMemo(() => orders.filter((o) => o.status !== "cancelled"), [orders]);
  const open = orders.filter(isOpen);
  const overdue = open.filter((o) => o.due_date < today);
  const upcoming = open.filter((o) => o.due_date >= today).slice(0, 10);
  const groups: { key: string; label: string; items: O[] }[] = [];
  for (const o of upcoming) {
    const d = diff(today, o.due_date);
    const label = d === 0 ? "Dziś" : d === 1 ? "Jutro" : new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short" }).format(noon(o.due_date));
    const last = groups[groups.length - 1];
    if (last?.key === o.due_date) last.items.push(o);
    else groups.push({ key: o.due_date, label, items: [o] });
  }
  const onDay = visible.filter((o) => o.start_date <= day && o.due_date >= day);
  const monthValue = visible.filter((o) => o.due_date.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`)).reduce((a, o) => a + (o.amount ?? 0), 0);

  const newAt = (date: string) => setEdit({ start_date: today <= date ? today : date, due_date: date, remind_days: 3, status: "planned" });
  const shift = (n: number) => {
    setDir(n);
    setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  };
  const pick = (date: string) => {
    setDay(date);
    if (!matchMedia("(min-width: 1280px)").matches) requestAnimationFrame(() => dayCard.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  const goToday = () => {
    setDir(0);
    setYm({ y: y0, m: m0 - 1 });
    setDay(today);
  };

  return (
    <>
      <PageHead kicker="Klienci" title="Kalendarz">
        <Segmented
          id="cal-view"
          value={view}
          onChange={setView}
          items={[
            { value: "month", label: "Miesiąc" },
            { value: "list", label: "Lista" },
          ]}
        />
        <Btn variant="primary" icon={ICONS.plus} onClick={() => newAt(day >= today ? day : today)}>
          Nowe zlecenie
        </Btn>
      </PageHead>

      {view === "month" ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card pad={false}>
            {/* pasek miesiąca */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.h2 key={`${ym.y}-${ym.m}`} className="h-display text-[22px] leading-tight whitespace-nowrap sm:text-[26px]" initial={{ opacity: 0, y: dir >= 0 ? 10 : -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: dir >= 0 ? -10 : 10 }} transition={{ duration: 0.25, ease }}>
                      {MONTHS[ym.m]} <span className="text-dim">{ym.y}</span>
                    </motion.h2>
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {monthValue > 0 && <span className="mr-2 hidden text-[12.5px] text-dim tabular-nums md:inline">{zl(monthValue)} w terminach</span>}
                <Btn size="sm" variant="outline" onClick={goToday}>
                  Dziś
                </Btn>
                <div className="flex rounded-full border border-line-2">
                  <button type="button" onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-l-full text-muted transition-colors hover:bg-white/[0.05] hover:text-ink" aria-label="Poprzedni miesiąc">
                    <Icon d="M15 5l-7 7 7 7" className="size-4" />
                  </button>
                  <span className="w-px bg-line-2" />
                  <button type="button" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-r-full text-muted transition-colors hover:bg-white/[0.05] hover:text-ink" aria-label="Następny miesiąc">
                    <Icon d="M9 5l7 7-7 7" className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 border-y border-line text-[11.5px] tracking-[0.04em] text-dim uppercase">
              {DAYS.map((d, i) => (
                <div key={d} className={`px-2 py-2 text-center sm:px-3 sm:text-left ${i > 4 ? "text-dim/70" : ""}`}>
                  {d}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${ym.y}-${ym.m}`} initial={{ opacity: 0, x: dir * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -16 }} transition={{ duration: 0.25, ease }}>
                {weeks.map((week, w) => {
                  const days = week.map((c) => c.date);
                  const { segs, more } = layoutWeek(days, visible);
                  return (
                    <div key={days[0]} className={`relative grid grid-cols-7 ${w ? "border-t border-line" : ""}`}>
                      {week.map((c, i) => {
                        const isToday = c.date === today;
                        const sel = c.date === day;
                        const dots = visible.filter((o) => o.start_date <= c.date && o.due_date >= c.date);
                        return (
                          <div
                            key={c.date}
                            role="button"
                            tabIndex={-1}
                            onClick={() => pick(c.date)}
                            onDoubleClick={() => newAt(c.date)}
                            className={`group relative h-[54px] cursor-pointer p-1 transition-colors sm:h-[134px] sm:p-1.5 ${i ? "border-l border-line" : ""} ${i > 4 ? "bg-white/[0.012]" : ""} ${sel ? "!bg-white/[0.045]" : "hover:bg-white/[0.02]"} ${isToday ? "bg-accent/[0.05]" : ""}`}
                          >
                            <div className="flex items-center justify-center sm:justify-between">
                              <span
                                className={`grid size-7 place-items-center rounded-full text-[12.5px] tabular-nums transition-colors ${isToday ? "bg-accent font-medium text-white shadow-[0_0_18px_rgb(139_108_255/0.65)]" : sel ? "bg-white/10 text-ink" : c.inMonth ? "text-ink/80" : "text-dim/50"}`}
                              >
                                {c.day}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  newAt(c.date);
                                }}
                                className="hidden size-6 place-items-center rounded-full text-dim opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-ink sm:grid"
                                aria-label={`Nowe zlecenie: ${c.date}`}
                              >
                                <Icon d={ICONS.plus} className="size-3.5" />
                              </button>
                            </div>
                            {/* telefon: kropki */}
                            <div className="mt-1 flex justify-center gap-[3px] sm:hidden">
                              {dots.slice(0, 3).map((o) => (
                                <span key={o.id} className={`size-[5px] rounded-full ${TONE[isOpen(o) && o.due_date < today ? "overdue" : o.status].dot}`} />
                              ))}
                            </div>
                            {more[i] > 0 && (
                              <span className="absolute bottom-1.5 left-2 hidden text-[11px] text-muted hover:text-ink sm:block">
                                +{more[i]} więcej
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {/* paski zleceń */}
                      <div className="pointer-events-none absolute inset-x-0 top-[38px] hidden sm:block">
                        {segs.map((g) => {
                          const t: Tone = isOpen(g.o) && g.o.due_date < today ? "overdue" : g.o.status;
                          return (
                            <motion.button
                              key={g.o.id}
                              type="button"
                              onClick={() => setEdit(g.o)}
                              title={`${g.o.title} · ${g.o.client_name} · ${nice(g.o.start_date)} – ${nice(g.o.due_date)}`}
                              initial={{ opacity: 0, scaleX: 0.9 }}
                              animate={{ opacity: 1, scaleX: 1 }}
                              transition={{ duration: 0.35, delay: 0.05 + w * 0.03, ease }}
                              className={`pointer-events-auto absolute flex h-[20px] origin-left items-center gap-1.5 overflow-hidden px-2 text-left text-[11.5px] leading-none whitespace-nowrap transition-colors ${TONE[t].bar} ${g.head ? "rounded-l-md pl-2.5 before:absolute before:inset-y-0 before:left-0 before:w-[3px]" : ""} ${g.tail ? "rounded-r-md" : ""}`}
                              style={{ top: g.lane * 23, left: `calc(${(g.s / 7) * 100}% + ${g.head ? 5 : 0}px)`, width: `calc(${((g.e - g.s + 1) / 7) * 100}% - ${(g.head ? 5 : 0) + (g.tail ? 5 : 0)}px)` }}
                            >
                              <span className="truncate">
                                {g.head || g.s === 0 ? g.o.title : ""}
                                {(g.head || g.s === 0) && g.e - g.s >= 2 && <span className="opacity-60"> · {g.o.client_name}</span>}
                              </span>
                              {g.tail && g.e - g.s >= 1 && (
                                <svg viewBox="0 0 12 12" className="ml-auto size-2.5 shrink-0 opacity-70" fill="currentColor" aria-hidden>
                                  <path d="M3 1.5v9M3 2h6.5l-1.5 2.5L9.5 7H3z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                                </svg>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 text-[12px] text-dim sm:px-5">
              {(["planned", "active", "done", "overdue"] as Tone[]).map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${TONE[k].dot}`} />
                  {TONE[k].label}
                </span>
              ))}
            </div>
          </Card>

          {/* prawa kolumna */}
          <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div ref={dayCard} className="scroll-mt-24">
              <Card delay={0.06}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-dim">{day === today ? "Dziś" : diff(today, day) === 1 ? "Jutro" : diff(today, day) === -1 ? "Wczoraj" : "Wybrany dzień"}</p>
                    <h3 className="mt-0.5 text-[16px] font-medium tracking-[-0.01em] first-letter:uppercase">{long(day)}</h3>
                  </div>
                  <button type="button" onClick={() => newAt(day)} className="grid size-8 shrink-0 place-items-center rounded-full border border-line-2 text-muted transition-colors hover:border-white/35 hover:text-ink" aria-label="Nowe zlecenie tego dnia">
                    <Icon d={ICONS.plus} className="size-4" />
                  </button>
                </div>
                {onDay.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line-2 py-6 text-center text-[13px] text-dim">Wolne</p>
                ) : (
                  <div className="-mx-2 space-y-0.5">
                    {onDay.map((o) => (
                      <AgendaItem key={o.id} o={o} today={today} onClick={() => setEdit(o)} note={o.due_date === day ? "termin" : o.start_date === day ? "start" : `do ${nice(o.due_date)}`} />
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card delay={0.1}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-[16px] font-medium tracking-[-0.01em]">Najbliższe</h3>
                <span className="text-[12.5px] text-dim tabular-nums">{open.length} otwartych</span>
              </div>
              {overdue.length + upcoming.length === 0 ? (
                <Empty icon={ICONS.calendar} title="Nic nie goni" />
              ) : (
                <div className="space-y-3">
                  {overdue.length > 0 && (
                    <section>
                      <p className="mb-1 flex items-center gap-2 text-[11.5px] tracking-[0.04em] text-red-300/90 uppercase">
                        <span className="size-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgb(248_113_113/0.8)]" />
                        Po terminie
                      </p>
                      <div className="-mx-2">
                        {overdue.map((o) => (
                          <AgendaItem key={o.id} o={o} today={today} onClick={() => setEdit(o)} />
                        ))}
                      </div>
                    </section>
                  )}
                  {groups.map((g) => (
                    <section key={g.key}>
                      <p className={`mb-1 text-[11.5px] tracking-[0.04em] uppercase ${g.key === today ? "text-accent-2" : "text-dim"}`}>{g.label}</p>
                      <div className="-mx-2">
                        {g.items.map((o) => (
                          <AgendaItem key={o.id} o={o} today={today} onClick={() => setEdit(o)} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </Card>

            <Card delay={0.14} className="md:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${mail ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.05] text-dim"}`}>
                    <Icon d={ICONS.bell} className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px]">Przypomnienia</p>
                    <p className="truncate text-[12px] text-dim">{msg || (mail ? "Codziennie rano na e-mail" : "E-mail niepodłączony")}</p>
                  </div>
                </div>
                <Btn
                  size="sm"
                  variant="outline"
                  disabled={sending}
                  onClick={() =>
                    start(async () => {
                      const r = await runReminders();
                      setMsg(r.sent ? `Wysłano (${r.sent})` : "Nic na dziś");
                    })
                  }
                >
                  {sending ? "Sprawdzam…" : "Sprawdź"}
                </Btn>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <OrderList orders={orders} today={today} onOpen={setEdit} onNew={() => newAt(today)} />
      )}

      <Portal>
        <Modal open={!!edit} onClose={close} title={edit?.id ? "Edytuj zlecenie" : "Nowe zlecenie"} wide>
          {edit?.id && (
            <Link href={`/panel/admin/zlecenia/${edit.id}`} className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-accent/[0.08] px-4 py-3 text-[13.5px] ring-1 ring-accent/20 transition-colors ring-inset hover:bg-accent/[0.14]">
              <span>
                <span className="block text-ink">Pliki, strona w CMS, wiadomość dla klienta</span>
                <span className="block text-[12px] text-muted">Otwórz pełną kartę zlecenia</span>
              </span>
              <Icon d="M9 6l6 6-6 6" className="size-4" />
            </Link>
          )}
          {edit && <OrderForm key={edit.id ?? "new"} order={edit} clients={clients} onDone={close} />}
        </Modal>
      </Portal>
    </>
  );
}

/* ---------- widok listy ---------- */
type LF = "open" | "all" | "done" | "cancelled";
function OrderList({ orders, today, onOpen, onNew }: { orders: O[]; today: string; onOpen: (o: O) => void; onNew: () => void }) {
  const [f, setF] = useState<LF>("open");
  const [q, setQ] = useState("");
  const n = (k: LF) => orders.filter((o) => (k === "all" ? true : k === "open" ? isOpen(o) : o.status === k)).length;
  const list = useMemo(() => {
    const s = fold(q.trim());
    const r = orders.filter((o) => (f === "all" || (f === "open" ? isOpen(o) : o.status === f)) && (!s || fold(`${o.title} ${o.client_name} ${o.service ?? ""}`).includes(s)));
    return f === "open" ? r : [...r].sort((a, b) => b.due_date.localeCompare(a.due_date));
  }, [orders, f, q]);
  const total = list.reduce((a, o) => a + (o.amount ?? 0), 0);

  return (
    <Card pad={false}>
      <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <Segmented
          id="ord-list"
          value={f}
          onChange={setF}
          items={[
            { value: "open", label: "Otwarte", count: n("open") },
            { value: "all", label: "Wszystkie", count: n("all") },
            { value: "done", label: "Oddane", dot: TONE.done.dot, count: n("done") },
            { value: "cancelled", label: "Anulowane", dot: TONE.cancelled.dot, count: n("cancelled") },
          ]}
        />
        <Search value={q} onChange={setQ} placeholder="Szukaj zlecenia" className="w-full sm:w-[240px]" />
      </div>

      {orders.length === 0 ? (
        <Empty icon={ICONS.calendar} title="Brak zleceń">
          <Btn variant="primary" size="sm" icon={ICONS.plus} onClick={onNew}>
            Nowe zlecenie
          </Btn>
        </Empty>
      ) : list.length === 0 ? (
        <p className="py-14 text-center text-[13.5px] text-dim">Brak wyników</p>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full table-fixed text-[14px]">
              <thead>
                <tr className="border-b border-line text-left text-[12.5px] text-dim">
                  <th className="py-3 pr-3 pl-5 font-normal">Zlecenie</th>
                  <th className="hidden w-[16%] px-3 py-3 font-normal xl:table-cell">Usługa</th>
                  <th className="w-[24%] px-3 py-3 font-normal">Okres</th>
                  <th className="w-[13%] px-3 py-3 font-normal">Termin</th>
                  <th className="w-[12%] px-3 py-3 text-right font-normal">Kwota</th>
                  <th className="w-[150px] py-3 pr-5 pl-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {list.map((o) => {
                    const t: Tone = isOpen(o) && o.due_date < today ? "overdue" : o.status;
                    const d = diff(today, o.due_date);
                    const len = Math.max(1, diff(o.start_date, o.due_date));
                    const pct = o.status === "done" ? 100 : Math.max(0, Math.min(100, (diff(o.start_date, today) / len) * 100));
                    return (
                      <motion.tr key={o.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={() => onOpen(o)} className="cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-white/[0.03]">
                        <td className="py-3 pr-3 pl-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`h-8 w-[3px] shrink-0 rounded-full ${TONE[t].dot}`} />
                            <div className="min-w-0">
                              <p className={`truncate ${o.status === "cancelled" ? "text-muted line-through" : ""}`}>{o.title}</p>
                              <p className="truncate text-[12.5px] text-dim">{o.client_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden truncate px-3 py-3 text-muted xl:table-cell">{o.service || <span className="text-dim">—</span>}</td>
                        <td className="px-3 py-3">
                          <p className="text-[13px] text-muted tabular-nums">
                            {nice(o.start_date)} – {nice(o.due_date)}
                          </p>
                          <div className="mt-1.5 h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-white/[0.06]">
                            <motion.div className={`h-full rounded-full ${TONE[t].dot}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease }} />
                          </div>
                        </td>
                        <td className={`px-3 py-3 text-[13px] tabular-nums ${!isOpen(o) ? "text-dim" : d < 0 ? "text-red-300" : d <= 2 ? "text-amber-200" : "text-muted"}`}>{isOpen(o) ? rel(d) : nice(o.due_date)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{o.amount ? zl(o.amount) : <span className="text-dim">—</span>}</td>
                        <td className="py-3 pr-5 pl-3">
                          <Badge tone={TONE[t].badge}>
                            <span className={`size-1.5 rounded-full ${TONE[t].dot}`} />
                            {TONE[t].label}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
              {total > 0 && (
                <tfoot>
                  <tr className="border-t border-line text-[13px]">
                    <td className="py-3 pr-3 pl-5 text-dim" colSpan={1}>
                      {list.length} {plural(list.length, "zlecenie", "zlecenia", "zleceń")}
                    </td>
                    <td className="hidden xl:table-cell" />
                    <td />
                    <td />
                    <td className="px-3 py-3 text-right text-ink tabular-nums">{zl(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <ul className="space-y-2 p-3 md:hidden">
            {list.map((o) => {
              const t: Tone = isOpen(o) && o.due_date < today ? "overdue" : o.status;
              const d = diff(today, o.due_date);
              return (
                <li key={o.id}>
                  <button type="button" onClick={() => onOpen(o)} className="flex w-full gap-3 rounded-2xl border border-line bg-white/[0.015] p-4 text-left transition-colors active:bg-white/[0.04]">
                    <span className={`w-[3px] shrink-0 self-stretch rounded-full ${TONE[t].dot}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={`min-w-0 text-[14.5px] leading-snug ${o.status === "cancelled" ? "text-muted line-through" : ""}`}>{o.title}</span>
                        {o.amount ? <span className="shrink-0 text-[14px] tabular-nums">{zl(o.amount)}</span> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-dim">{o.client_name}</span>
                      <span className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-dim">
                        <Badge tone={TONE[t].badge}>{TONE[t].label}</Badge>
                        <span className="tabular-nums">
                          {nice(o.start_date)} – {nice(o.due_date)}
                        </span>
                        {isOpen(o) && <span className={`tabular-nums ${d < 0 ? "text-red-300" : d <= 2 ? "text-amber-200" : ""}`}>· {rel(d)}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
