import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { all } from "@/lib/db";
import { fileCounts } from "@/lib/deliver";
import { daysBetween, today, type Order } from "@/lib/orders";
import { Badge, Empty, Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";

export const metadata: Metadata = { title: "Zlecenia" };

const TONE = { planned: "sky", active: "accent", done: "green", cancelled: "default" } as const;
const LABEL = { planned: "Zaplanowane", active: "W realizacji", done: "Oddane", cancelled: "Anulowane" };
const short = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(`${d}T12:00:00`));

export default async function OrdersPage() {
  await requireAdmin();
  const [orders, files] = await Promise.all([
    all<Order & { site_name: string | null }>("SELECT o.*, s.name AS site_name FROM orders o LEFT JOIN cms_sites s ON s.id = o.site_id ORDER BY CASE o.status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'done' THEN 2 ELSE 3 END, o.due_date"),
    fileCounts(),
  ]);
  const t = today();
  const groups = [
    { key: "now", title: "W toku", rows: orders.filter((o) => o.status === "active" || o.status === "planned") },
    { key: "done", title: "Oddane", rows: orders.filter((o) => o.status === "done") },
    { key: "x", title: "Anulowane", rows: orders.filter((o) => o.status === "cancelled") },
  ].filter((g) => g.rows.length);

  return (
    <>
      <PageHead title="Zlecenia" text="Wszystko o każdym zleceniu w jednym miejscu: status, wiadomość dla klienta, pliki do oddania, strona w CMS i płatności.">
        <Link href="/panel/admin/kalendarz?nowe=1" className="group btn btn-primary !h-11 !gap-3 !pl-5 !pr-1.5 text-[14px]">
          <span className="roll">
            <span>Nowe zlecenie</span>
            <span aria-hidden>Nowe zlecenie</span>
          </span>
          <span className="dot !size-8">
            <Icon d={ICONS.plus} className="size-4" />
          </span>
        </Link>
      </PageHead>

      {!orders.length && (
        <div className="rounded-[22px] bg-surface">
          <Empty icon={ICONS.layers} title="Brak zleceń" text="Zlecenia powstają po przyjęciu zapytania albo z kalendarza." />
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="mb-3 text-[14px] text-dim">
              {g.title} · {g.rows.length}
            </h2>
            <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {g.rows.map((o) => {
                const total = Math.max(1, daysBetween(o.start_date, o.due_date));
                const p = o.status === "done" ? 1 : Math.max(0, Math.min(1, daysBetween(o.start_date, t) / total));
                const left = daysBetween(t, o.due_date);
                const late = o.status !== "done" && o.status !== "cancelled" && left < 0;
                return (
                  <li key={o.id}>
                    <Link href={`/panel/admin/zlecenia/${o.id}`} className="group block rounded-[22px] bg-surface p-5 ring-1 ring-white/[0.04] transition-colors ring-inset hover:bg-surface-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[16px]">{o.title}</p>
                          <p className="mt-0.5 truncate text-[13px] text-dim">
                            {o.client_name}
                            {o.amount ? ` · ${Number(o.amount).toLocaleString("pl-PL")} zł` : ""}
                          </p>
                        </div>
                        <Badge tone={TONE[o.status]}>{LABEL[o.status]}</Badge>
                      </div>
                      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className={`h-full rounded-full ${o.status === "done" ? "bg-emerald-400" : late ? "bg-red-400" : "bg-gradient-to-r from-accent to-accent-2"}`} style={{ width: `${Math.round(p * 100)}%` }} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[12.5px] text-dim">
                        <span className={late ? "text-red-300" : left <= 3 && o.status !== "done" ? "text-amber-200" : ""}>{o.status === "done" ? `oddane · ${short(o.due_date)}` : late ? `${-left} dni po terminie` : `termin ${short(o.due_date)} · za ${left} dni`}</span>
                        <span className="flex items-center gap-3">
                          {(files[o.id] ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Icon d={ICONS.download} className="size-3.5" /> {files[o.id]}
                            </span>
                          )}
                          {o.site_name && (
                            <span className="flex items-center gap-1">
                              <Icon d={ICONS.globe} className="size-3.5" /> CMS
                            </span>
                          )}
                          <Icon d="M9 6l6 6-6 6" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
