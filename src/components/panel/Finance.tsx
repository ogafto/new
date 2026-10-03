"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cancelPayment, checkStripe, createPayment, deleteExpense, deletePayment, saveExpense, sendPaymentEmail, setPaid, type NewPayment } from "@/app/panel/admin/finanse/actions";
import type { Expense, Payment, PaymentStatus } from "@/lib/finance";
import { Badge, Btn, Card, CardHead, ConfirmBtn, ease, Empty, field, Icon, ICONS, Label, Modal, Stat, Tabs, Toggle } from "./kit";

type P = Payment & { status: PaymentStatus };
type Summary = {
  month: { revenue: number; costs: number; profit: number; prevRevenue: number; prevCosts: number };
  year: { revenue: number; costs: number };
  pending: { count: number; amount: number; overdue: number };
  chart: { m: string; revenue: number; costs: number }[];
  paidCount: number;
};

const CATS: Record<string, string> = { hosting: "Hosting i domeny", tools: "Narzędzia i subskrypcje", ads: "Reklama", hardware: "Sprzęt", fees: "Opłaty i prowizje", other: "Inne" };
const STATUS: Record<PaymentStatus, { label: string; tone: "default" | "accent" | "green" | "amber" | "red" | "sky" }> = {
  pending: { label: "Oczekuje", tone: "sky" },
  overdue: { label: "Po terminie", tone: "red" },
  paid: { label: "Opłacone", tone: "green" },
  canceled: { label: "Anulowane", tone: "default" },
  refunded: { label: "Zwrot", tone: "amber" },
};
const METHOD: Record<string, string> = { stripe: "Stripe", transfer: "Przelew", cash: "Gotówka" };

const zl = (gr: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: gr % 100 ? 2 : 0 }).format(gr / 100);
const monthName = (m: string, style: "short" | "long" = "short") => new Intl.DateTimeFormat("pl-PL", { month: style }).format(new Date(`${m}-15T12:00:00`));
const day = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(ms);
const isoDay = (iso: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00`));
const today = () => new Date().toLocaleDateString("sv-SE");

/* ---------- wykres 12 miesięcy ---------- */
function Chart({ data }: { data: Summary["chart"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => Math.max(d.revenue, d.costs)));
  const h = hover ?? data.length - 1;
  const cur = data[h];
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-dim capitalize">{monthName(cur.m, "long")}</p>
          <p className="mt-1 text-[26px] tracking-[-0.02em] tabular-nums">{zl(cur.revenue)}</p>
        </div>
        <div className="flex gap-4 text-[12.5px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent" /> Przychód
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-white/25" /> Koszty {zl(cur.costs)}
          </span>
        </div>
      </div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2.5" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <button key={d.m} type="button" className="group flex h-full flex-1 flex-col items-center justify-end gap-2" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)} aria-label={`${monthName(d.m, "long")}: ${zl(d.revenue)}`}>
            <span className="flex h-full w-full items-end justify-center gap-[3px]">
              <motion.span
                className={`w-full max-w-[18px] rounded-t-[5px] ${i === h ? "bg-accent" : "bg-accent/45 group-hover:bg-accent/70"}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(d.revenue ? 3 : 0, (d.revenue / max) * 100)}%` }}
                transition={{ delay: 0.15 + i * 0.03, duration: 0.9, ease }}
              />
              <motion.span
                className="w-full max-w-[18px] rounded-t-[5px] bg-white/15"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(d.costs ? 3 : 0, (d.costs / max) * 100)}%` }}
                transition={{ delay: 0.2 + i * 0.03, duration: 0.9, ease }}
              />
            </span>
            <span className={`text-[10.5px] capitalize sm:text-[11.5px] ${i === h ? "text-ink" : "text-dim"}`}>{monthName(d.m).replace(".", "")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- jedna płatność ---------- */
function Row({ p, onMsg }: { p: P; onMsg: (m: { ok?: string; error?: string }) => void }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const act = (fn: () => Promise<{ ok?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      onMsg(r);
      router.refresh();
    });
  const open = p.status === "pending" || p.status === "overdue";
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }} className={`rounded-2xl border border-line p-4 transition-colors hover:border-line-2 ${busy ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3.5">
        <span className={`hidden size-10 shrink-0 place-items-center rounded-xl sm:grid ${p.status === "paid" ? "bg-emerald-400/10 text-emerald-300" : p.status === "overdue" ? "bg-red-400/10 text-red-300" : "bg-white/[0.05] text-muted"}`}>
          <Icon d={p.status === "paid" ? ICONS.check : p.method === "stripe" ? ICONS.card : ICONS.wallet} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <p className="min-w-0 text-[15px] leading-snug">{p.title}</p>
            <p className="text-[16px] tabular-nums">{zl(p.amount)}</p>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-dim">
            {p.client_name}
            {p.client_email ? ` · ${p.client_email}` : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-dim">
            <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
            <span>{METHOD[p.method]}</span>
            <span>·</span>
            <span>{p.paid_at ? `opłacono ${day(p.paid_at)}` : p.due_date ? `termin ${isoDay(p.due_date)}` : `utworzono ${day(p.created_at)}`}</span>
          </div>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-line pt-3 sm:pl-[54px]">
        {open && p.stripe_url && (
          <>
            <Btn
              size="sm"
              icon={copied ? ICONS.check : ICONS.link}
              onClick={() =>
                navigator.clipboard.writeText(p.stripe_url!).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                })
              }
            >
              {copied ? "Skopiowano" : "Kopiuj link"}
            </Btn>
            {p.client_email && (
              <Btn size="sm" icon={ICONS.mail} disabled={busy} onClick={() => act(() => sendPaymentEmail(p.id))}>
                Wyślij mailem
              </Btn>
            )}
            <Btn size="sm" variant="ghost" icon={ICONS.refresh} disabled={busy} onClick={() => act(() => checkStripe(p.id))}>
              Sprawdź
            </Btn>
          </>
        )}
        {open && (
          <Btn size="sm" variant="ghost" icon={ICONS.check} disabled={busy} onClick={() => act(() => setPaid(p.id))}>
            Opłacone
          </Btn>
        )}
        {open && (
          <Btn size="sm" variant="ghost" icon={ICONS.close} disabled={busy} onClick={() => act(() => cancelPayment(p.id))}>
            Anuluj
          </Btn>
        )}
        <span className="ml-auto">
          <ConfirmBtn onConfirm={() => act(() => deletePayment(p.id))} />
        </span>
      </div>
    </motion.li>
  );
}

/* ---------- okno: nowa płatność ---------- */
function NewPaymentForm({ stripe, clients, services, onDone }: { stripe: boolean; clients: { id: string; name: string; email: string }[]; services: { id: string; name: string }[]; onDone: (m: { ok?: string; error?: string }) => void }) {
  const router = useRouter();
  const [d, setD] = useState<NewPayment>({ title: "", client_name: "", client_email: "", user_id: "", service: "", amount: "", due_date: "", method: stripe ? "stripe" : "transfer", notes: "", paid: false, send: false });
  const [err, setErr] = useState("");
  const [link, setLink] = useState("");
  const [pending, start] = useTransition();
  const up = (p: Partial<NewPayment>) => setD((x) => ({ ...x, ...p }));

  if (link)
    return (
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
          <Icon d={ICONS.check} className="size-6" />
        </div>
        <p className="mt-4 text-[17px]">Link do płatności gotowy</p>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-line-2 p-1.5 pl-3.5 text-left">
          <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-accent-2">{link}</span>
          <Btn size="sm" variant="primary" icon={ICONS.copy} onClick={() => navigator.clipboard.writeText(link)}>
            Kopiuj
          </Btn>
        </div>
        <Btn className="mt-5" onClick={() => onDone({})}>
          Gotowe
        </Btn>
      </div>
    );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr("");
          const r = await createPayment(d);
          if (r.error && !r.url) return setErr(r.error);
          router.refresh();
          if (r.url && !d.send) setLink(r.url);
          else onDone(r);
        });
      }}
    >
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-line p-1.5">
        {(["stripe", "transfer", "cash"] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={m === "stripe" && !stripe}
            onClick={() => up({ method: m, paid: m === "stripe" ? false : d.paid })}
            className={`relative rounded-xl px-2 py-2.5 text-[13px] transition-colors disabled:opacity-40 ${d.method === m ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {d.method === m && <motion.span layoutId="pay-method" className="absolute inset-0 rounded-xl bg-white/[0.08]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span className="relative">{m === "stripe" ? "Link Stripe" : METHOD[m]}</span>
          </button>
        ))}
      </div>
      {!stripe && (
        <p className="text-[12.5px] text-dim">
          Podłącz Stripe w{" "}
          <Link href="/panel/admin/ustawienia" className="text-accent-2 underline-offset-4 hover:underline">
            Ustawieniach
          </Link>
          , żeby generować linki do płatności kartą/BLIK.
        </p>
      )}

      <Label label="Za co">
        <input required className={`${field} h-11`} value={d.title} onChange={(e) => up({ title: e.target.value })} placeholder="np. Strona internetowa — zaliczka 50%" />
      </Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Kwota (zł)">
          <input required inputMode="decimal" className={`${field} h-11 text-[16px] tabular-nums`} value={d.amount} onChange={(e) => up({ amount: e.target.value.replace(/[^\d,.]/g, "") })} placeholder="0,00" />
        </Label>
        <Label label="Usługa">
          <select className={`${field} h-11 bg-surface`} value={d.service} onChange={(e) => up({ service: e.target.value })}>
            <option value="">—</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Label>
      </div>

      {clients.length > 0 && (
        <Label label="Klient z kontem (opcjonalnie)">
          <select
            className={`${field} h-11 bg-surface`}
            value={d.user_id}
            onChange={(e) => {
              const c = clients.find((x) => x.id === e.target.value);
              up({ user_id: e.target.value, client_name: c?.name ?? d.client_name, client_email: c?.email ?? d.client_email });
            }}
          >
            <option value="">— wpisz ręcznie —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.email}
              </option>
            ))}
          </select>
        </Label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Klient">
          <input required className={`${field} h-11`} value={d.client_name} onChange={(e) => up({ client_name: e.target.value })} placeholder="Imię i nazwisko / firma" />
        </Label>
        <Label label="E-mail klienta">
          <input type="email" className={`${field} h-11`} value={d.client_email} onChange={(e) => up({ client_email: e.target.value })} placeholder="opcjonalnie" />
        </Label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Termin płatności">
          <input type="date" min={today()} className={`${field} h-11`} value={d.due_date} onChange={(e) => up({ due_date: e.target.value })} />
        </Label>
        <Label label="Notatka">
          <input className={`${field} h-11`} value={d.notes} onChange={(e) => up({ notes: e.target.value })} placeholder="opcjonalnie" />
        </Label>
      </div>
      <div className="space-y-3 rounded-2xl border border-line p-4">
        {d.method === "stripe" ? (
          <Toggle label="Wyślij link klientowi mailem" checked={d.send} onChange={(v) => up({ send: v })} />
        ) : (
          <Toggle label="Już opłacone (zapisz jako wpłatę)" checked={d.paid} onChange={(v) => up({ paid: v })} />
        )}
      </div>
      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-[13.5px] text-red-300">
            {err}
          </motion.p>
        )}
      </AnimatePresence>
      <Btn type="submit" variant="primary" icon={d.method === "stripe" ? ICONS.link : ICONS.check} disabled={pending} className="w-full">
        {pending ? "Chwileczkę…" : d.method === "stripe" ? "Utwórz link do płatności" : d.paid ? "Zapisz wpłatę" : "Zapisz płatność"}
      </Btn>
    </form>
  );
}

function NewExpenseForm({ onDone }: { onDone: (m: { ok?: string; error?: string }) => void }) {
  const router = useRouter();
  const [d, setD] = useState({ title: "", category: "tools", amount: "", date: today(), recurring: false, notes: "" });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveExpense(d);
          if (r.error) return setErr(r.error);
          router.refresh();
          onDone(r);
        });
      }}
    >
      <Label label="Nazwa">
        <input required className={`${field} h-11`} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="np. Figma, domena, hosting" />
      </Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Kwota (zł)">
          <input required inputMode="decimal" className={`${field} h-11 tabular-nums`} value={d.amount} onChange={(e) => setD({ ...d, amount: e.target.value.replace(/[^\d,.]/g, "") })} placeholder="0,00" />
        </Label>
        <Label label="Data">
          <input type="date" required className={`${field} h-11`} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
        </Label>
      </div>
      <Label label="Kategoria">
        <select className={`${field} h-11 bg-surface`} value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
          {Object.entries(CATS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Label>
      <Toggle label="Powtarza się co miesiąc (subskrypcja)" checked={d.recurring} onChange={(v) => setD({ ...d, recurring: v })} />
      {err && <p className="text-[13.5px] text-red-300">{err}</p>}
      <Btn type="submit" variant="primary" icon={ICONS.check} disabled={pending} className="w-full">
        {pending ? "Zapisywanie…" : "Dodaj koszt"}
      </Btn>
    </form>
  );
}

export default function Finance({ payments, expenses, summary, stripe, clients, services }: { payments: P[]; expenses: Expense[]; summary: Summary; stripe: boolean; clients: { id: string; name: string; email: string }[]; services: { id: string; name: string }[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"payments" | "expenses">("payments");
  const [filter, setFilter] = useState<"all" | "open" | "paid">("all");
  const params = useSearchParams();
  const [modal, setModal] = useState<"payment" | "expense" | null>(params.get("nowa") ? "payment" : null);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>();
  const [, start] = useTransition();
  const show = (m: { ok?: string; error?: string }) => {
    setMsg(m);
    setTimeout(() => setMsg(undefined), 3500);
  };

  const list = useMemo(() => payments.filter((p) => (filter === "all" ? true : filter === "paid" ? p.status === "paid" : p.status === "pending" || p.status === "overdue")), [payments, filter]);
  const cur = summary.chart[summary.chart.length - 1].m;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" icon={ICONS.plus} onClick={() => setModal("payment")}>
          Nowa płatność
        </Btn>
        <Btn icon={ICONS.receipt} onClick={() => setModal("expense")}>
          Dodaj koszt
        </Btn>
        <a href={`/panel/admin/finanse/eksport${tab === "expenses" ? "?co=koszty" : ""}`} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[14px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink">
          <Icon d={ICONS.download} /> CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label={`Przychód · ${monthName(cur, "long")}`} value={Math.round(summary.month.revenue / 100)} suffix=" zł" prev={Math.round(summary.month.prevRevenue / 100)} icon={ICONS.trendUp} />
        <Stat label="Do zapłaty" value={Math.round(summary.pending.amount / 100)} suffix=" zł" icon={ICONS.clock} delay={0.05} hint={`${summary.pending.count} ${summary.pending.count === 1 ? "płatność" : "płatności"}${summary.pending.overdue ? ` · ${summary.pending.overdue} po terminie` : ""}`} />
        <Stat label="Koszty w miesiącu" value={Math.round(summary.month.costs / 100)} suffix=" zł" prev={Math.round(summary.month.prevCosts / 100)} invert icon={ICONS.receipt} delay={0.1} />
        <Stat label="Zysk w miesiącu" value={Math.round(summary.month.profit / 100)} suffix=" zł" icon={ICONS.wallet} delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card delay={0.1}>
          <CardHead title="Ostatnie 12 miesięcy" sub="Przychody (opłacone) i koszty" />
          <Chart data={summary.chart} />
        </Card>
        <div className="grid gap-4">
          <Card delay={0.15} glow>
            <CardHead title={`Rok ${new Date().getFullYear()}`} />
            <dl className="space-y-3 text-[14px]">
              {[
                ["Przychód", zl(summary.year.revenue)],
                ["Koszty", zl(summary.year.costs)],
                ["Zysk", zl(summary.year.revenue - summary.year.costs)],
              ].map(([k, v], i) => (
                <div key={k} className={`flex items-baseline justify-between gap-4 ${i === 2 ? "border-t border-line pt-3" : ""}`}>
                  <dt className="text-dim">{k}</dt>
                  <dd className={`tabular-nums ${i === 2 ? "text-[20px]" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card delay={0.2}>
            <div className="flex items-center gap-3.5">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${stripe ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.05] text-dim"}`}>
                <Icon d={ICONS.card} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">Stripe {stripe ? "podłączony" : "niepodłączony"}</p>
                <p className="text-[12.5px] text-dim">{stripe ? "Karta · BLIK · Przelewy24" : "Brak klucza"}</p>
              </div>
              <Link href="/panel/admin/ustawienia" className="text-[13px] text-accent-2 hover:underline">
                {stripe ? "Ustawienia" : "Podłącz"}
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Card delay={0.2}>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Tabs
            id="fin"
            value={tab}
            onChange={setTab}
            items={[
              { value: "payments", label: "Płatności", count: payments.length },
              { value: "expenses", label: "Koszty", count: expenses.length },
            ]}
          />
          {tab === "payments" && (
            <div className="flex gap-1 text-[13px]">
              {(
                [
                  ["all", "Wszystkie"],
                  ["open", "Do zapłaty"],
                  ["paid", "Opłacone"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full px-3 py-1.5 transition-colors ${filter === k ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {msg && (msg.ok || msg.error) && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`mb-4 overflow-hidden rounded-xl border px-3.5 py-2.5 text-[13px] ${msg.error ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>
              {msg.error ?? msg.ok}
            </motion.p>
          )}
        </AnimatePresence>

        {tab === "payments" ? (
          list.length ? (
            <ul className="space-y-2.5">
              <AnimatePresence initial={false}>
                {list.map((p) => (
                  <Row key={p.id} p={p} onMsg={show} />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <Empty icon={ICONS.wallet} title={filter === "all" ? "Brak płatności" : "Nic tu nie ma"} text="Utwórz link do płatności dla klienta albo zapisz wpłatę z przelewu.">
              <Btn variant="primary" icon={ICONS.plus} onClick={() => setModal("payment")}>
                Nowa płatność
              </Btn>
            </Empty>
          )
        ) : expenses.length ? (
          <ul className="divide-y divide-line">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-muted">
                  <Icon d={ICONS.receipt} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px]">{e.title}</p>
                  <p className="truncate text-[12.5px] text-dim">
                    {CATS[e.category] ?? e.category} · {isoDay(e.date)}
                    {e.recurring ? " · co miesiąc" : ""}
                  </p>
                </div>
                <p className="text-[14.5px] tabular-nums">−{zl(e.amount)}</p>
                <ConfirmBtn
                  onConfirm={() =>
                    start(async () => {
                      show(await deleteExpense(e.id));
                      router.refresh();
                    })
                  }
                >
                  {""}
                </ConfirmBtn>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={ICONS.receipt} title="Brak kosztów" text="Dodaj subskrypcje, hosting czy reklamę — panel policzy zysk.">
            <Btn icon={ICONS.plus} onClick={() => setModal("expense")}>
              Dodaj koszt
            </Btn>
          </Empty>
        )}
      </Card>

      <Modal open={modal === "payment"} onClose={() => setModal(null)} title="Nowa płatność">
        <NewPaymentForm
          stripe={stripe}
          clients={clients}
          services={services}
          onDone={(m) => {
            setModal(null);
            if (m.ok || m.error) show(m);
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
    </div>
  );
}
