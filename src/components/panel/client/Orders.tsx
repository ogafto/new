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
