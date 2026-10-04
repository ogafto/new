import { daysBetween, type Order } from "@/lib/orders";
import Link from "next/link";
import { Badge, Icon } from "../kit";

/* Karta zlecenia w panelu klienta: status, termin, postęp w czasie, kwota */

const STATUS: Record<Order["status"], { label: string; tone: "accent" | "sky" | "green" | "default" }> = {
  planned: { label: "Zaplanowane", tone: "sky" },
  active: { label: "W realizacji", tone: "accent" },
  done: { label: "Oddane", tone: "green" },
  cancelled: { label: "Anulowane", tone: "default" },
};

const fmt = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(`${d}T12:00:00`));
const when = (d: number) => (d < 0 ? `${-d} dni po terminie` : d === 0 ? "termin dziś" : d === 1 ? "termin jutro" : `za ${d} dni`);

export function OrderCard({ o, today }: { o: Order; today: string; compact?: boolean }) {
  const total = Math.max(1, daysBetween(o.start_date, o.due_date));
  const progress = o.status === "done" ? 1 : Math.min(1, Math.max(0, daysBetween(o.start_date, today) / total));
  const left = daysBetween(today, o.due_date);
  const st = STATUS[o.status];
  return (
    <Link href={`/panel/zamowienia/${o.id}`} className="group block rounded-2xl bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15.5px] leading-snug">{o.title}</p>
          <p className="mt-0.5 text-[12.5px] text-dim">
            {o.service ?? "Zlecenie"}
            {o.amount ? ` · ${Number(o.amount).toLocaleString("pl-PL")} zł` : ""}
          </p>
        </div>
        <span className="flex items-center gap-2">
          <Badge tone={st.tone}>{st.label}</Badge>
          <Icon d="M9 6l6 6-6 6" className="size-4 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
        </span>
      </div>
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className={`h-full rounded-full ${o.status === "done" ? "bg-emerald-400" : left < 0 ? "bg-red-400" : "bg-gradient-to-r from-accent to-accent-2"}`} style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[12px] text-dim tabular-nums">
          <span>{fmt(o.start_date)}</span>
          <span className={o.status !== "done" && left < 0 ? "text-red-300" : o.status !== "done" && left <= 3 ? "text-amber-200" : ""}>{o.status === "done" ? "oddane" : when(left)}</span>
          <span>{fmt(o.due_date)}</span>
        </div>
      </div>
    </Link>
  );
}

/* Wycena czekająca na płatność — klient płaci całość albo zaliczkę, po wpłacie zlecenie startuje */
type OfferView = { id: string; title: string; message: string | null; amount: number; deposit: number | null; work_days: number; pay_by: string; payments: { id: string; amount: number; status: string; stripe_url: string | null; method: string; kind: string | null }[] };

const zlx = (gr: number) => `${(gr / 100).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;

export function OfferCard({ o, today }: { o: OfferView; today: string }) {
  const full = o.payments.find((p) => p.kind === "full" && p.status === "pending");
  const dep = o.payments.find((p) => p.kind === "deposit" && p.status === "pending");
  const left = daysBetween(today, o.pay_by);
  const longD = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${o.pay_by}T12:00:00`));
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-surface p-6 ring-1 ring-accent/25 ring-inset sm:p-7">
      <div className="pointer-events-none absolute -top-40 -right-32 size-[440px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.32),transparent)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1.2px)] [mask-image:radial-gradient(50%_80%_at_100%_0%,black,transparent)] bg-[size:7px_7px]" aria-hidden />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-[12.5px] text-accent-2">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent-2/80" />
              <span className="relative size-1.5 rounded-full bg-accent-2" />
            </span>
            Wycena czeka na płatność
          </span>
          <h2 className="mt-4 text-[clamp(1.7rem,3vw,2.4rem)] leading-tight font-medium tracking-[-0.03em]">{o.title}</h2>
          {o.message && <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-muted">{o.message}</p>}
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <dt className="text-[12px] text-dim">Kwota</dt>
              <dd className="mt-0.5 text-[26px] leading-none font-medium tracking-[-0.03em] tabular-nums">{zlx(o.amount)}</dd>
            </div>
            {o.deposit && (
              <div>
                <dt className="text-[12px] text-dim">Zaliczka na start</dt>
                <dd className="mt-0.5 text-[26px] leading-none font-medium tracking-[-0.03em] text-accent-2 tabular-nums">{zlx(o.deposit)}</dd>
              </div>
            )}
            <div>
              <dt className="text-[12px] text-dim">Realizacja</dt>
              <dd className="mt-0.5 text-[26px] leading-none font-medium tracking-[-0.03em]">
                {o.work_days} <span className="text-[15px] text-muted">dni od wpłaty</span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="w-full shrink-0 space-y-2 lg:w-[300px]">
          <p className={`text-[13px] ${left < 0 ? "text-red-300" : left <= 2 ? "text-amber-200" : "text-muted"}`}>{left < 0 ? `Termin płatności minął ${longD}` : left === 0 ? "Zapłać dziś" : `Zapłać do ${longD} · ${left} ${left === 1 ? "dzień" : "dni"}`}</p>
          {full?.stripe_url && (
            <a href={full.stripe_url} className="group flex h-12 items-center justify-between rounded-full bg-ink pr-1.5 pl-5 text-[14.5px] font-medium text-bg transition-colors hover:bg-white">
              Zapłać całość · {zlx(full.amount)}
              <span className="grid size-9 place-items-center rounded-full bg-accent text-white">
                <Icon d="M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5zM3 10h18" className="size-4" />
              </span>
            </a>
          )}
          {dep?.stripe_url && (
            <a href={dep.stripe_url} className="flex h-12 items-center justify-center rounded-full bg-white/[0.07] text-[14px] ring-1 ring-white/[0.1] transition-colors ring-inset hover:bg-white/[0.12]">
              Zapłać zaliczkę · {zlx(dep.amount)}
            </a>
          )}
          {!full?.stripe_url && <p className="rounded-2xl bg-white/[0.04] px-4 py-3 text-[13px] text-muted">Płatność przelewem — dane do przelewu dostaniesz mailem. Zlecenie wystartuje po zaksięgowaniu.</p>}
          <p className="pt-1 text-[12px] text-dim">Po wpłacie zlecenie startuje od razu, a termin liczy się od dnia płatności.</p>
        </div>
      </div>
    </section>
  );
}
