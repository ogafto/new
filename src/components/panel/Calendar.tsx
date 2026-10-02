"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { deleteOrder, runReminders, saveOrder } from "@/app/panel/admin/kalendarz/actions";
import type { Order } from "@/lib/orders";
import { services } from "@/lib/site";
import { Alert } from "../account/ui";
import { Badge, Btn, Card, CardHead, ConfirmBtn, ease, Empty, field, ICONS, Label, Modal } from "./kit";

type O = Order;
const MONTHS = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const COLOR: Record<O["status"], string> = { planned: "bg-sky-400", active: "bg-accent", done: "bg-emerald-400", cancelled: "bg-white/30" };
const LABEL: Record<O["status"], string> = { planned: "Zaplanowane", active: "W realizacji", done: "Oddane", cancelled: "Anulowane" };
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const diff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const nice = (s: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(`${s}T12:00:00`));

function OrderForm({ order, clients, onDone, defaults }: { order: Partial<O> | null; clients: { id: string; name: string; email: string }[]; onDone: () => void; defaults: Partial<O> }) {
  const [state, action, pending] = useActionState(saveOrder, undefined);
  const [, start] = useTransition();
  const o = { ...defaults, ...order };
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {o.id && <input type="hidden" name="id" value={o.id} />}
      <Label label="Zlecenie" className="sm:col-span-2">
        <input name="title" required defaultValue={o.title} placeholder="np. Strona firmowa + logo" className={`${field} h-11`} />
      </Label>
      <Label label="Klient">
        <input name="client_name" required defaultValue={o.client_name} list="cal-clients" placeholder="Imię / firma" className={`${field} h-11`} />
        <datalist id="cal-clients">
          {clients.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </Label>
      <Label label="E-mail klienta (opcjonalnie)">
        <input name="client_email" type="email" defaultValue={o.client_email ?? ""} className={`${field} h-11`} />
      </Label>
      <Label label="Usługa">
        <select name="service" defaultValue={o.service ?? ""} className={`${field} h-11 bg-surface`}>
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
        <input name="amount" inputMode="numeric" defaultValue={o.amount ?? ""} placeholder="np. 1500" className={`${field} h-11`} />
      </Label>
      <Label label="Start">
        <input name="start_date" type="date" required defaultValue={o.start_date} className={`${field} h-11 [color-scheme:dark]`} />
      </Label>
      <Label label="Termin oddania">
        <input name="due_date" type="date" required defaultValue={o.due_date} className={`${field} h-11 [color-scheme:dark]`} />
      </Label>
      <Label label="Status">
        <select name="status" defaultValue={o.status ?? "planned"} className={`${field} h-11 bg-surface`}>
          {(Object.keys(LABEL) as O["status"][]).map((k) => (
            <option key={k} value={k}>
              {LABEL[k]}
            </option>
          ))}
        </select>
      </Label>
      <Label label="Przypomnienie mailem">
        <select name="remind_days" defaultValue={o.remind_days ?? 3} className={`${field} h-11 bg-surface`}>
          {[0, 1, 2, 3, 5, 7, 14].map((d) => (
            <option key={d} value={d}>
              {d === 0 ? "Tylko w dniu terminu" : `${d} ${d === 1 ? "dzień" : "dni"} przed + w dniu`}
            </option>
          ))}
        </select>
      </Label>
      <Label label="Notatki" className="sm:col-span-2">
        <textarea name="notes" rows={3} defaultValue={o.notes ?? ""} className={`${field} resize-none py-3`} />
      </Label>
      <div className="sm:col-span-2">
        <Alert>{state?.error}</Alert>
      </div>
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        {o.id ? <ConfirmBtn onConfirm={() => start(async () => (await deleteOrder(o.id!), onDone()))} /> : <span />}
        <Btn variant="primary" type="submit" disabled={pending} icon={ICONS.check}>
          {pending ? "Zapisywanie…" : o.id ? "Zapisz zmiany" : "Dodaj zlecenie"}
        </Btn>
      </div>
    </form>
  );
}

export default function Calendar({ orders, clients, today, mail, prefill }: { orders: O[]; clients: { id: string; name: string; email: string }[]; today: string; mail: boolean; prefill: Partial<O> | null }) {
  const [y0, m0] = today.split("-").map(Number);
  const [ym, setYm] = useState({ y: y0, m: m0 - 1 });
  const [edit, setEdit] = useState<Partial<O> | null>(prefill ? { ...prefill } : null);
  const [defaults, setDefaults] = useState<Partial<O>>({ start_date: today, due_date: today, remind_days: 3, status: "planned" });
  const [msg, setMsg] = useState("");
  const [sending, start] = useTransition();

  const cells = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(ym.y, ym.m, i - offset + 1);
      return { date: iso(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: i >= offset && i < offset + days };
    });
  }, [ym]);

  const open = orders.filter((o) => o.status === "planned" || o.status === "active");
  const overdue = open.filter((o) => o.due_date < today);
  const soon = open.filter((o) => o.due_date >= today).slice(0, 8);

  const newAt = (date: string) => {
    setDefaults({ start_date: today <= date ? today : date, due_date: date, remind_days: 3, status: "planned" });
    setEdit({});
  };
  const shift = (n: number) => setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <Card pad={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Btn size="sm" variant="ghost" onClick={() => shift(-1)} aria-label="Poprzedni miesiąc">
              ←
            </Btn>
            <AnimatePresence mode="wait">
              <motion.h2 key={`${ym.y}-${ym.m}`} className="min-w-[170px] text-center text-[18px] font-medium tracking-[-0.02em]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                {MONTHS[ym.m]} {ym.y}
              </motion.h2>
            </AnimatePresence>
            <Btn size="sm" variant="ghost" onClick={() => shift(1)} aria-label="Następny miesiąc">
              →
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => setYm({ y: y0, m: m0 - 1 })}>
              Dziś
            </Btn>
          </div>
          <Btn size="sm" variant="primary" icon={ICONS.plus} onClick={() => newAt(today)}>
            Nowe zlecenie
          </Btn>
        </div>

        <div className="grid grid-cols-7 border-b border-line text-center text-[12px] text-dim">
          {DAYS.map((d) => (
            <div key={d} className="py-2.5">
              {d}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={`${ym.y}-${ym.m}`} className="grid grid-cols-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {cells.map((c, i) => {
              const due = orders.filter((o) => o.due_date === c.date);
              const span = orders.filter((o) => o.status !== "cancelled" && o.start_date <= c.date && o.due_date > c.date).slice(0, 3);
              const isToday = c.date === today;
              return (
                <motion.div
                  key={c.date}
                  className={`group relative min-h-[58px] border-line p-1.5 sm:min-h-[112px] sm:p-2 ${i % 7 ? "border-l" : ""} ${i >= 7 ? "border-t" : ""} ${c.inMonth ? "" : "bg-white/[0.012]"}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.006, duration: 0.4, ease }}
                  onDoubleClick={() => newAt(c.date)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`grid size-7 place-items-center rounded-full text-[12.5px] tabular-nums ${isToday ? "bg-accent text-white shadow-[0_0_16px_rgb(139_108_255/0.6)]" : c.inMonth ? "text-muted" : "text-dim/60"}`}>{c.day}</span>
                    <button type="button" onClick={() => newAt(c.date)} className="grid size-6 place-items-center rounded-full text-dim opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/5 hover:text-ink" aria-label={`Dodaj zlecenie na ${c.date}`}>
                      +
                    </button>
                  </div>
                  {/* trwające zlecenia — cienkie paski */}
                  <div className="mt-1 space-y-0.5">
                    {span.map((o) => (
                      <div key={o.id} className={`h-[3px] rounded-full opacity-50 ${COLOR[o.status]}`} title={o.title} />
                    ))}
                  </div>
                  {/* terminy */}
                  <div className="mt-1 space-y-1">
                    {due.slice(0, 2).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setEdit(o)}
                        className={`flex w-full items-center justify-center gap-1.5 truncate rounded-md px-1.5 py-1.5 text-left text-[11.5px] sm:justify-start sm:py-1 transition-colors ${o.status === "done" ? "bg-emerald-400/10 text-emerald-200 line-through decoration-emerald-200/40" : o.due_date < today && o.status !== "cancelled" ? "bg-red-400/15 text-red-200" : "bg-accent/15 text-accent-2 hover:bg-accent/25"}`}
                      >
                        <span className={`size-1.5 shrink-0 rounded-full ${COLOR[o.status]}`} />
                        <span className="hidden truncate sm:inline">{o.title}</span>
                      </button>
                    ))}
                    {due.length > 2 && <p className="px-1.5 text-[11px] text-dim">+{due.length - 2}</p>}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </Card>

      <div className="space-y-4">
        <Card delay={0.1}>
          <CardHead title="Najbliższe" sub={`${open.length} otwartych zleceń`} />
          {overdue.length + soon.length === 0 ? (
            <Empty icon={ICONS.calendar} title="Nic nie goni" text="Dodaj zlecenie — przypomnę o terminie." />
          ) : (
            <ul className="space-y-2">
              {[...overdue, ...soon].map((o) => {
                const d = diff(today, o.due_date);
                return (
                  <li key={o.id}>
                    <button type="button" onClick={() => setEdit(o)} className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:border-line-2">
                      <span className={`h-9 w-1 shrink-0 rounded-full ${d < 0 ? "bg-red-400" : COLOR[o.status]}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px]">{o.title}</span>
                        <span className="block truncate text-[12px] text-dim">
                          {o.client_name} · {nice(o.due_date)}
                          {o.amount ? ` · ${o.amount.toLocaleString("pl-PL")} zł` : ""}
                        </span>
                      </span>
                      <Badge tone={d < 0 ? "red" : d <= 2 ? "amber" : "default"}>{d < 0 ? `−${-d} d` : d === 0 ? "dziś" : `${d} d`}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card delay={0.15}>
          <CardHead title="Przypomnienia" sub={mail ? "Mail codziennie rano na Twój adres" : "Podłącz e-mail w Ustawieniach, żeby dostawać maile"} />
          <Btn
            size="sm"
            variant="outline"
            icon={ICONS.mail}
            disabled={sending}
            onClick={() =>
              start(async () => {
                const r = await runReminders();
                setMsg(r.sent ? `Wysłano przypomnienie (${r.sent})` : "Nic do przypomnienia na dziś");
              })
            }
          >
            {sending ? "Sprawdzam…" : "Sprawdź teraz"}
          </Btn>
          {msg && <p className="mt-3 text-[13px] text-muted">{msg}</p>}
          <div className="mt-5 flex flex-wrap gap-3 text-[12px] text-dim">
            {(Object.keys(LABEL) as O["status"][]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${COLOR[k]}`} />
                {LABEL[k]}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edytuj zlecenie" : "Nowe zlecenie"} wide>
        {edit && <OrderForm key={edit.id ?? "new"} order={edit} defaults={defaults} clients={clients} onDone={() => setEdit(null)} />}
      </Modal>
    </div>
  );
}
