"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cancelPayment, checkStripe, deleteExpense, deletePayment, sendPaymentEmail, setPaid } from "@/app/panel/admin/finanse/actions";
import { Badge, Btn, Card, CardHead, ConfirmBtn, ease, Empty, Icon, ICONS, Modal, PageHead } from "./kit";
import { Drawer, Kpi, RowMenu, SearchField, Segmented, Th, useToast, type MenuItem } from "./views/ui";
import RevenueChart from "./finance/RevenueChart";
import { NewExpenseForm, NewPaymentForm } from "./finance/Forms";
import { cat, CATS, day, dayFull, daysTo, dueText, hue, initials, isoDay, isOpen, METHOD, monthName, norm, STATUS, zl, type Expense, type Msg, type P, type Summary } from "./finance/shared";

type Act = (fn: () => Promise<Msg>, after?: () => void) => void;

function Avatar({ name, size = "size-9" }: { name: string; size?: string }) {
  const h = hue(name);
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-full text-[12px] font-medium text-white/90 ring-1 ring-white/10`}
      style={{ background: `linear-gradient(140deg, hsl(${h} 55% 42% / 0.9), hsl(${(h + 40) % 360} 60% 22% / 0.9))` }}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}

function StatusBadge({ s }: { s: P["status"] }) {
  const st = STATUS[s];
  return (
    <Badge tone={st.tone}>
      <span className={`size-1.5 rounded-full ${s === "paid" ? "bg-emerald-400" : s === "overdue" ? "bg-red-400" : s === "pending" ? "bg-sky-400" : s === "refunded" ? "bg-amber-300" : "bg-white/40"}`} />
      {st.label}
    </Badge>
  );
}

function When({ p, compact }: { p: P; compact?: boolean }) {
  if (p.paid_at)
    return (
      <span className="text-muted">
        {compact ? "" : <span className="text-dim">Opłacono </span>}
        {day(p.paid_at)}
      </span>
    );
  if (p.due_date) {
    const late = isOpen(p) && daysTo(p.due_date) < 0;
    return (
      <span className="flex flex-col leading-tight">
        <span className="text-muted">{isoDay(p.due_date)}</span>
        {isOpen(p) && <span className={`text-[11.5px] ${late ? "text-red-300" : "text-dim"}`}>{dueText(p.due_date)}</span>}
      </span>
    );
  }
  return <span className="text-dim">—</span>;
}

const copy = (text: string, onMsg: (m: Msg) => void) => navigator.clipboard.writeText(text).then(() => onMsg({ ok: "Skopiowano link." }));

function paymentMenu(p: P, act: Act, onMsg: (m: Msg) => void, onOpen?: () => void): MenuItem[] {
  const open = isOpen(p);
  return [
    { label: "Szczegóły", icon: ICONS.eye, onSelect: () => onOpen?.(), hidden: !onOpen },
    { label: "Kopiuj link", icon: ICONS.link, onSelect: () => copy(p.stripe_url!, onMsg), hidden: !open || !p.stripe_url },
    { label: "Wyślij mailem", icon: ICONS.mail, onSelect: () => act(() => sendPaymentEmail(p.id)), hidden: !open || !p.stripe_url || !p.client_email },
    { label: "Sprawdź w Stripe", icon: ICONS.refresh, onSelect: () => act(() => checkStripe(p.id)), hidden: !open || !p.stripe_session },
    { label: "Oznacz jako opłacone", icon: ICONS.check, onSelect: () => act(() => setPaid(p.id)), hidden: !open, sep: true },
    { label: "Anuluj", icon: ICONS.close, onSelect: () => act(() => cancelPayment(p.id)), hidden: !open },
    { label: "Usuń", icon: ICONS.trash, tone: "danger", onSelect: () => act(() => deletePayment(p.id)), sep: true },
  ];
}

/* ---------- szczegóły płatności ---------- */
function PaymentDrawer({ p, onClose, act, onMsg, busy }: { p: P | null; onClose: () => void; act: Act; onMsg: (m: Msg) => void; busy: boolean }) {
  const open = p ? isOpen(p) : false;
  const steps = p
    ? [
        { label: "Utworzono", at: dayFull(p.created_at), done: true },
        p.due_date ? { label: "Termin płatności", at: `${isoDay(p.due_date, true)}${open ? ` · ${dueText(p.due_date)}` : ""}`, done: !open || daysTo(p.due_date) < 0, late: open && daysTo(p.due_date) < 0 } : null,
        p.paid_at ? { label: p.status === "refunded" ? "Opłacono, potem zwrot" : "Opłacono", at: dayFull(p.paid_at), done: true, ok: true } : p.status === "canceled" ? { label: "Anulowano", at: "", done: true } : { label: "Oczekuje na wpłatę", at: "", done: false },
      ].filter(Boolean)
    : [];
  return (
    <Drawer
      open={!!p}
      onClose={onClose}
      title={p?.title ?? ""}
      sub={p && <span className="flex flex-wrap items-center gap-2"><StatusBadge s={p.status} /> <span>{METHOD[p.method]}</span></span>}
      footer={
        p && (
          <div className="flex flex-wrap items-center gap-2">
            {open && (
              <Btn size="sm" variant="primary" icon={ICONS.check} disabled={busy} onClick={() => act(() => setPaid(p.id), onClose)}>
                Oznacz opłacone
              </Btn>
            )}
            {open && (
              <Btn size="sm" variant="ghost" icon={ICONS.close} disabled={busy} onClick={() => act(() => cancelPayment(p.id), onClose)}>
                Anuluj
              </Btn>
            )}
            <span className="ml-auto">
              <ConfirmBtn onConfirm={() => act(() => deletePayment(p.id), onClose)} />
            </span>
          </div>
        )
      }
    >
      {p && (
        <div className={`transition-opacity ${busy ? "opacity-60" : ""}`}>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <p className="text-[12.5px] text-dim">Kwota</p>
            <p className="h-display mt-1.5 text-[38px] leading-none tabular-nums">{zl(p.amount)}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <Avatar name={p.client_name} />
              <div className="min-w-0">
                <p className="truncate text-[14px]">{p.client_name}</p>
                {p.client_email ? (
                  <a href={`mailto:${p.client_email}`} className="block truncate text-[12.5px] text-dim transition-colors hover:text-accent-2">
                    {p.client_email}
                  </a>
                ) : (
                  <p className="text-[12.5px] text-dim">bez e-maila</p>
                )}
              </div>
            </div>
          </div>

          {open && p.stripe_url && (
            <div className="mt-4">
              <p className="mb-2 text-[12.5px] text-dim">Link do płatności</p>
              <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-black/20 p-1.5 pl-3">
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-accent-2">{p.stripe_url.replace(/^https?:\/\//, "")}</span>
                <button type="button" onClick={() => copy(p.stripe_url!, onMsg)} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.07] hover:text-ink" aria-label="Kopiuj link">
                  <Icon d={ICONS.copy} className="size-4" />
                </button>
                <a href={p.stripe_url} target="_blank" rel="noreferrer" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.07] hover:text-ink" aria-label="Otwórz link">
                  <Icon d={ICONS.site} className="size-4" />
                </a>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.client_email && (
                  <Btn size="sm" icon={ICONS.mail} disabled={busy} onClick={() => act(() => sendPaymentEmail(p.id))}>
                    Wyślij mailem
                  </Btn>
                )}
                {p.stripe_session && (
                  <Btn size="sm" variant="ghost" icon={ICONS.refresh} disabled={busy} onClick={() => act(() => checkStripe(p.id))}>
                    Sprawdź w Stripe
                  </Btn>
                )}
              </div>
            </div>
          )}

          <p className="mt-6 mb-3 text-[12.5px] text-dim">Historia</p>
          <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-white/[0.08]">
            {steps.map((s) => (
              <li key={s!.label} className="relative flex gap-3.5 pl-0">
                <span className={`relative mt-1 size-[11px] shrink-0 rounded-full ring-4 ring-[rgb(16_16_22)] ${"ok" in s! && s.ok ? "bg-emerald-400" : "late" in s! && s.late ? "bg-red-400" : s!.done ? "bg-accent" : "border border-dashed border-white/30 bg-transparent"}`} />
                <div className="min-w-0">
                  <p className={`text-[13.5px] ${s!.done ? "" : "text-muted"}`}>{s!.label}</p>
                  {s!.at && <p className={`text-[12px] ${"late" in s! && s.late ? "text-red-300" : "text-dim"}`}>{s!.at}</p>}
                </div>
              </li>
            ))}
          </ol>

          <dl className="mt-6 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] text-[13px]">
            {[
              ["Metoda", METHOD[p.method]],
              ["Usługa", p.service],
              ["Notatka", p.notes],
              ["Stripe", p.stripe_payment ?? p.stripe_session],
              ["ID", p.id],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="shrink-0 text-dim">{k}</dt>
                  <dd className={`min-w-0 text-right break-words ${k === "Stripe" || k === "ID" ? "font-mono text-[11.5px] text-muted" : ""}`}>{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}
    </Drawer>
  );
}

/* ---------- tabela płatności ---------- */
type PF = "all" | "open" | "overdue" | "paid" | "closed";
type Sort = { k: "default" | "amount" | "date"; dir: 1 | -1 };
const PAGE = 15;

function SortTh({ label, k, sort, setSort, right, className = "" }: { label: string; k: Sort["k"]; sort: Sort; setSort: (s: Sort) => void; right?: boolean; className?: string }) {
  const on = sort.k === k;
  return (
    <Th right={right} className={className}>
      <button type="button" onClick={() => setSort(on && sort.dir === -1 ? { k, dir: 1 } : on ? { k: "default", dir: -1 } : { k, dir: -1 })} className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${on ? "text-muted" : ""}`}>
        {label}
        <svg viewBox="0 0 10 10" className={`size-2.5 transition-transform ${on ? "opacity-100" : "opacity-40"} ${on && sort.dir === 1 ? "rotate-180" : ""}`} aria-hidden>
          <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </Th>
  );
}

function Payments({ payments, act, onMsg, onNew, busy }: { payments: P[]; act: Act; onMsg: (m: Msg) => void; onNew: () => void; busy: boolean }) {
  const [f, setF] = useState<PF>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>({ k: "default", dir: -1 });
  const [limit, setLimit] = useState(PAGE);
  const [sel, setSel] = useState<string | null>(null);
  const counts = useMemo(
    () => ({
      all: payments.length,
      open: payments.filter(isOpen).length,
      overdue: payments.filter((p) => p.status === "overdue").length,
      paid: payments.filter((p) => p.status === "paid").length,
      closed: payments.filter((p) => p.status === "canceled" || p.status === "refunded").length,
    }),
    [payments],
  );
  const list = useMemo(() => {
    const nq = norm(q.trim());
    const r = payments.filter(
      (p) =>
        (f === "all" || (f === "open" ? isOpen(p) : f === "closed" ? p.status === "canceled" || p.status === "refunded" : p.status === f)) &&
        (!nq || norm(`${p.title} ${p.client_name} ${p.client_email ?? ""} ${p.amount / 100}`).includes(nq)),
    );
    if (sort.k === "amount") r.sort((a, b) => (a.amount - b.amount) * sort.dir);
    if (sort.k === "date") {
      const t = (p: P) => p.paid_at ?? (p.due_date ? new Date(`${p.due_date}T12:00:00`).getTime() : p.created_at);
      r.sort((a, b) => (t(a) - t(b)) * sort.dir);
    }
    return r;
  }, [payments, f, q, sort]);
  const shown = list.slice(0, limit);
  const sum = list.reduce((a, p) => a + (p.status === "canceled" ? 0 : p.amount), 0);
  const current = payments.find((p) => p.id === sel) ?? null;

  return (
    <>
      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          id="pay-f"
          value={f}
          onChange={(v) => {
            setF(v);
            setLimit(PAGE);
          }}
          items={[
            { value: "all", label: "Wszystkie", count: counts.all },
            { value: "open", label: "Do zapłaty", count: counts.open },
            { value: "overdue", label: "Po terminie", count: counts.overdue, dot: counts.overdue ? "bg-red-400" : undefined },
            { value: "paid", label: "Opłacone", count: counts.paid },
            { value: "closed", label: "Anulowane", count: counts.closed },
          ]}
        />
        <SearchField value={q} onChange={(v) => (setQ(v), setLimit(PAGE))} placeholder="Szukaj płatności…" className="w-full lg:w-72" />
      </div>

      {list.length === 0 ? (
        <div className="border-t border-white/[0.06]">
          {payments.length ? (
            <Empty icon={ICONS.search} title="Nic nie pasuje" text="Zmień filtr albo frazę." />
          ) : (
            <Empty icon={ICONS.wallet} title="Brak płatności">
              <Btn variant="primary" size="sm" icon={ICONS.plus} onClick={onNew}>
                Nowa płatność
              </Btn>
            </Empty>
          )}
        </div>
      ) : (
        <>
          {/* tabela — tablet/desktop */}
          <table className="hidden w-full table-fixed border-t border-white/[0.06] text-[13.5px] md:table">
            <thead className="bg-white/[0.015]">
              <tr className="border-b border-white/[0.06]">
                <Th>Płatność</Th>
                <SortTh label="Kwota" k="amount" sort={sort} setSort={setSort} right className="w-[112px] lg:w-[130px]" />
                <Th className="w-[128px] lg:w-[136px]">Status</Th>
                <Th className="hidden w-[104px] xl:table-cell">Metoda</Th>
                <SortTh label="Termin / wpłata" k="date" sort={sort} setSort={setSort} className="w-[128px] lg:w-[150px]" />
                <Th className="w-[52px] lg:w-[60px]" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {shown.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.015, ease }}
                    onClick={() => setSel(p.id)}
                    className={`group h-[60px] cursor-pointer border-b border-white/[0.045] transition-colors last:border-0 hover:bg-white/[0.025] ${p.status === "canceled" ? "opacity-55" : ""}`}
                  >
                    <td className="py-2 pr-3 pl-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={p.client_name} />
                        <div className="min-w-0">
                          <p className="truncate text-ink">{p.title}</p>
                          <p className="truncate text-[12.5px] text-dim">{p.client_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 text-right text-[14px] tabular-nums ${p.status === "canceled" ? "text-dim line-through" : ""}`}>{zl(p.amount)}</td>
                    <td className="px-3">
                      <StatusBadge s={p.status} />
                    </td>
                    <td className="hidden px-3 text-muted xl:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon d={p.method === "stripe" ? ICONS.card : p.method === "cash" ? ICONS.money : ICONS.wallet} className="size-3.5 text-dim" />
                        {METHOD[p.method]}
                      </span>
                    </td>
                    <td className="px-3 text-[13px]">
                      <When p={p} />
                    </td>
                    <td className="pr-4 pl-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <span className="inline-block opacity-60 transition-opacity group-hover:opacity-100">
                        <RowMenu items={paymentMenu(p, act, onMsg)} />
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {/* karty — telefon */}
          <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06] md:hidden">
            {shown.map((p) => (
              <li key={p.id} className={`flex items-center gap-1 pr-2 ${p.status === "canceled" ? "opacity-55" : ""}`}>
                <button type="button" onClick={() => setSel(p.id)} className="flex min-w-0 flex-1 items-start gap-3 py-3.5 pl-4 text-left active:bg-white/[0.03]">
                  <Avatar name={p.client_name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[14px]">{p.title}</span>
                      <span className="shrink-0 text-[14.5px] tabular-nums">{zl(p.amount)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-dim">{p.client_name}</span>
                    <span className="mt-2 flex items-center gap-2 text-[12px]">
                      <StatusBadge s={p.status} />
                      <span className={p.status === "overdue" ? "text-red-300" : "text-dim"}>{p.paid_at ? `opłacono ${day(p.paid_at)}` : p.due_date ? (isOpen(p) ? dueText(p.due_date) : isoDay(p.due_date)) : METHOD[p.method]}</span>
                    </span>
                  </span>
                </button>
                <RowMenu items={paymentMenu(p, act, onMsg)} />
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5 text-[12.5px] text-dim">
            <span>
              {list.length} {list.length === 1 ? "pozycja" : list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 10 || list.length % 100 >= 20) ? "pozycje" : "pozycji"} · suma <span className="text-muted tabular-nums">{zl(sum)}</span>
            </span>
            {list.length > limit && (
              <button type="button" onClick={() => setLimit((l) => l + PAGE * 2)} className="rounded-full border border-white/[0.1] px-3.5 py-1.5 text-muted transition-colors hover:border-white/25 hover:text-ink">
                Pokaż więcej · {list.length - limit}
              </button>
            )}
          </div>
        </>
      )}
      <PaymentDrawer p={current} onClose={() => setSel(null)} act={act} onMsg={onMsg} busy={busy} />
    </>
  );
}

/* ---------- tabela kosztów ---------- */
function Expenses({ expenses, act, onNew }: { expenses: Expense[]; act: Act; onNew: () => void }) {
  const [f, setF] = useState<"all" | "rec" | "once">("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const nq = norm(q.trim());
    return expenses.filter((e) => (f === "all" || (f === "rec" ? !!e.recurring : !e.recurring)) && (!nq || norm(`${e.title} ${cat(e.category).label} ${e.amount / 100}`).includes(nq)));
  }, [expenses, f, q]);
  const monthly = expenses.filter((e) => e.recurring).reduce((a, e) => a + e.amount, 0);
  const menu = (e: Expense): MenuItem[] => [{ label: "Usuń koszt", icon: ICONS.trash, tone: "danger", onSelect: () => act(() => deleteExpense(e.id)) }];
  const Recurring = () => (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11.5px] text-accent-2">
      <Icon d={ICONS.refresh} className="size-3" /> co miesiąc
    </span>
  );

  return (
    <>
      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          id="exp-f"
          value={f}
          onChange={setF}
          items={[
            { value: "all", label: "Wszystkie", count: expenses.length },
            { value: "rec", label: "Stałe", count: expenses.filter((e) => e.recurring).length },
            { value: "once", label: "Jednorazowe", count: expenses.filter((e) => !e.recurring).length },
          ]}
        />
        <SearchField value={q} onChange={setQ} placeholder="Szukaj kosztu…" className="w-full lg:w-72" />
      </div>
      {list.length === 0 ? (
        <div className="border-t border-white/[0.06]">
          {expenses.length ? (
            <Empty icon={ICONS.search} title="Nic nie pasuje" text="Zmień filtr albo frazę." />
          ) : (
            <Empty icon={ICONS.receipt} title="Brak kosztów">
              <Btn size="sm" icon={ICONS.plus} onClick={onNew}>
                Dodaj koszt
              </Btn>
            </Empty>
          )}
        </div>
      ) : (
        <>
          <table className="hidden w-full table-fixed border-t border-white/[0.06] text-[13.5px] md:table">
            <thead className="bg-white/[0.015]">
              <tr className="border-b border-white/[0.06]">
                <Th>Nazwa</Th>
                <Th className="w-[200px]">Kategoria</Th>
                <Th className="hidden w-[130px] lg:table-cell">Rodzaj</Th>
                <Th className="w-[110px]">Data</Th>
                <Th right className="w-[120px]">
                  Kwota
                </Th>
                <Th className="w-[52px] lg:w-[60px]" />
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const c = cat(e.category);
                return (
                  <tr key={e.id} className="group h-[56px] border-b border-white/[0.045] transition-colors last:border-0 hover:bg-white/[0.025]">
                    <td className="py-2 pr-3 pl-5">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-white/[0.04] text-dim">
                          <Icon d={ICONS.receipt} className="size-4" />
                        </span>
                        <span className="truncate">{e.title}</span>
                        {!!e.recurring && (
                          <span className="lg:hidden">
                            <Recurring />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] whitespace-nowrap ${c.chip}`}>
                        <span className={`size-1.5 rounded-full ${c.dot}`} />
                        {c.label}
                      </span>
                    </td>
                    <td className="hidden px-3 lg:table-cell">{e.recurring ? <Recurring /> : <span className="text-[12.5px] text-dim">jednorazowo</span>}</td>
                    <td className="px-3 text-muted">{isoDay(e.date)}</td>
                    <td className="px-3 text-right tabular-nums">−{zl(e.amount)}</td>
                    <td className="pr-4 pl-1 text-right">
                      <span className="inline-block opacity-60 transition-opacity group-hover:opacity-100">
                        <RowMenu items={menu(e)} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06] md:hidden">
            {list.map((e) => {
              const c = cat(e.category);
              return (
                <li key={e.id} className="flex items-center gap-3 py-3.5 pr-2 pl-4">
                  <span className={`size-2 shrink-0 rounded-full ${c.dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[14px]">{e.title}</span>
                      <span className="shrink-0 tabular-nums">−{zl(e.amount)}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-dim">
                      {c.label} · {isoDay(e.date)}
                      {!!e.recurring && <Recurring />}
                    </span>
                  </span>
                  <RowMenu items={menu(e)} />
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5 text-[12.5px] text-dim">
            <span>
              Suma <span className="text-muted tabular-nums">{zl(list.reduce((a, e) => a + e.amount, 0))}</span>
            </span>
            <span>
              Stałe koszty <span className="text-muted tabular-nums">{zl(monthly)}</span> / mies.
            </span>
          </div>
        </>
      )}
    </>
  );
}

/* ---------- struktura kosztów (12 mies.) ---------- */
function CostMix({ expenses, months }: { expenses: Expense[]; months: string[] }) {
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const e of expenses) {
      const start = e.date.slice(0, 7);
      const n = e.recurring ? months.filter((m) => m >= start).length : months.includes(start) ? 1 : 0;
      if (n) t[e.category in CATS ? e.category : "other"] = (t[e.category in CATS ? e.category : "other"] ?? 0) + e.amount * n;
    }
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  }, [expenses, months]);
  const sum = totals.reduce((a, [, v]) => a + v, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-muted">Struktura kosztów</p>
        <p className="text-[12px] text-dim">12 mies.</p>
      </div>
      {sum ? (
        <>
          <div className="mt-3 flex h-2 gap-[3px] overflow-hidden rounded-full">
            {totals.map(([k, v], i) => (
              <motion.span key={k} className="h-full rounded-full" style={{ background: cat(k).bar }} initial={{ width: 0 }} animate={{ width: `${(v / sum) * 100}%` }} transition={{ delay: 0.3 + i * 0.06, duration: 0.8, ease }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-[13px]">
            {totals.slice(0, 5).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2.5">
                <span className={`size-2 shrink-0 rounded-full ${cat(k).dot}`} />
                <span className="min-w-0 flex-1 truncate text-muted">{cat(k).label}</span>
                <span className="text-dim tabular-nums">{Math.round((v / sum) * 100)}%</span>
                <span className="w-[86px] text-right tabular-nums">{zl(v)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="py-6 text-center text-[13px] text-dim">Brak kosztów</p>
      )}
    </div>
  );
}

export default function Finance({ payments, expenses, summary, stripe, clients, services }: { payments: P[]; expenses: Expense[]; summary: Summary; stripe: boolean; clients: { id: string; name: string; email: string }[]; services: { id: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"payments" | "expenses">("payments");
  const [modal, setModal] = useState<"payment" | "expense" | null>(params.get("nowa") ? "payment" : null);
  const [busy, start] = useTransition();
  const { show, node: toastNode } = useToast();
  const act: Act = useCallback(
    (fn, after) =>
      start(async () => {
        const r = await fn();
        show(r);
        if (!r.error) after?.();
        router.refresh();
      }),
    [router, show],
  );

  const chart = summary.chart;
  const cur = chart[chart.length - 1].m;
  const year = cur.slice(0, 4);
  const overdueAmount = payments.filter((p) => p.status === "overdue").reduce((a, p) => a + p.amount, 0);
  const profit = chart.map((d) => d.revenue - d.costs);
  const yearProfit = summary.year.revenue - summary.year.costs;
  const margin = summary.year.revenue ? Math.round((yearProfit / summary.year.revenue) * 100) : 0;
  const pl = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many);

  return (
    <>
      <PageHead kicker="Biznes" title="Finanse">
        <a href={`/panel/admin/finanse/eksport${tab === "expenses" ? "?co=koszty" : ""}`} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink">
          <Icon d={ICONS.download} className="size-4" /> CSV
        </a>
        <Btn size="sm" icon={ICONS.receipt} onClick={() => setModal("expense")}>
          Dodaj koszt
        </Btn>
        <Btn size="sm" variant="primary" icon={ICONS.plus} onClick={() => setModal("payment")}>
          Nowa płatność
        </Btn>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="Przychód w miesiącu" value={Math.round(summary.month.revenue / 100)} suffix=" zł" prev={Math.round(summary.month.prevRevenue / 100)} spark={chart.map((d) => d.revenue)} icon={ICONS.trendUp} accent hint={<span className="first-letter:uppercase">{`${monthName(chart[chart.length - 2].m, "long")}: ${zl(summary.month.prevRevenue)}`}</span>} />
        <Kpi label="Zysk w miesiącu" value={Math.round(summary.month.profit / 100)} suffix=" zł" prev={Math.round((summary.month.prevRevenue - summary.month.prevCosts) / 100)} spark={profit.map((v) => Math.max(0, v))} icon={ICONS.wallet} delay={0.04} tone={summary.month.profit < 0 ? "text-red-300" : ""} hint={`koszty ${zl(summary.month.costs)}`} />
        <Kpi
          label="Do zapłaty"
          value={Math.round(summary.pending.amount / 100)}
          suffix=" zł"
          icon={ICONS.clock}
          delay={0.08}
          hint={
            <div>
              <span>
                {summary.pending.count} {pl(summary.pending.count, "płatność", "płatności", "płatności")}
                {summary.pending.overdue > 0 && <span className="text-red-300"> · {summary.pending.overdue} po terminie</span>}
              </span>
              {summary.pending.amount > 0 && (
                <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-sky-400/25">
                  <motion.span className="h-full bg-red-400/80" initial={{ width: 0 }} animate={{ width: `${(overdueAmount / summary.pending.amount) * 100}%` }} transition={{ delay: 0.4, duration: 0.9, ease }} />
                </div>
              )}
            </div>
          }
        />
        <Kpi label={`Przychód ${year}`} value={Math.round(summary.year.revenue / 100)} suffix=" zł" icon={ICONS.chart} delay={0.12} hint={`zysk ${zl(yearProfit)} · marża ${margin}%`} spark={chart.filter((d) => d.m.startsWith(year)).reduce<number[]>((a, d) => [...a, (a.at(-1) ?? 0) + d.revenue], [])} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card delay={0.1}>
          <CardHead title="Przychody i koszty" sub="Ostatnie 12 miesięcy" />
          <RevenueChart data={chart} />
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[auto_1fr]">
          <Card delay={0.14} glow>
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] text-muted">Rok {year}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11.5px] tabular-nums ${margin >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>marża {margin}%</span>
            </div>
            <p className={`h-display mt-3 text-[30px] leading-none tabular-nums ${yearProfit < 0 ? "text-red-300" : ""}`}>{zl(yearProfit)}</p>
            <p className="mt-1 text-[12px] text-dim">zysk od początku roku</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, margin))}%` }} transition={{ delay: 0.4, duration: 1, ease }} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="text-dim">Przychód</dt>
                <dd className="mt-0.5 tabular-nums">{zl(summary.year.revenue)}</dd>
              </div>
              <div>
                <dt className="text-dim">Koszty</dt>
                <dd className="mt-0.5 tabular-nums">{zl(summary.year.costs)}</dd>
              </div>
            </dl>
          </Card>
          <Card delay={0.18}>
            <div className="flex h-full flex-col">
              <CostMix expenses={expenses} months={chart.map((d) => d.m)} />
              <Link href="/panel/admin/ustawienia" className="group mt-auto flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 pt-3 transition-colors hover:border-white/[0.14] max-xl:mt-5 xl:mt-5">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${stripe ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.05] text-dim"}`}>
                  <Icon d={ICONS.card} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[13.5px]">
                    Stripe
                    <span className={`size-1.5 rounded-full ${stripe ? "bg-emerald-400" : "bg-white/30"}`} />
                  </span>
                  <span className="block truncate text-[12px] text-dim">{stripe ? "Karta · BLIK · Przelewy24" : "Niepodłączony"}</span>
                </span>
                <Icon d={ICONS.arrowUp} className="size-4 rotate-45 text-dim transition-colors group-hover:text-ink" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Card delay={0.2} pad={false} className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-4 sm:px-5 sm:pt-5">
          <Segmented
            id="fin-tab"
            size="md"
            value={tab}
            onChange={setTab}
            items={[
              { value: "payments", label: "Płatności", count: payments.length },
              { value: "expenses", label: "Koszty", count: expenses.length },
            ]}
          />
          <span className={`flex items-center gap-2 text-[12px] text-dim transition-opacity ${busy ? "opacity-100" : "opacity-0"}`} aria-hidden={!busy}>
            <span className="size-3 animate-spin rounded-full border border-white/20 border-t-accent-2" /> Zapisywanie…
          </span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease }}>
            {tab === "payments" ? <Payments payments={payments} act={act} onMsg={show} onNew={() => setModal("payment")} busy={busy} /> : <Expenses expenses={expenses} act={act} onNew={() => setModal("expense")} />}
          </motion.div>
        </AnimatePresence>
      </Card>

      <Modal open={modal === "payment"} onClose={() => setModal(null)} title="Nowa płatność">
        <NewPaymentForm
          stripe={stripe}
          clients={clients}
          services={services}
          onDone={(m) => {
            setModal(null);
            show(m);
          }}
        />
      </Modal>
      <Modal open={modal === "expense"} onClose={() => setModal(null)} title="Nowy koszt">
        <NewExpenseForm
          onDone={(m) => {
            setModal(null);
            show(m);
          }}
        />
      </Modal>
      {toastNode}
    </>
  );
}
