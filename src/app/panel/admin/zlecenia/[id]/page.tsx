import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getSite, listSites } from "@/lib/cms";
import { origin } from "@/lib/cms-load";
import { fileKind, getOrder, orderFiles, orderPayments } from "@/lib/deliver";
import { daysBetween, today } from "@/lib/orders";
import { setting } from "@/lib/settings";
import { blobAccess } from "@/lib/storage";
import { one } from "@/lib/db";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import { Metric } from "@/components/panel/dash";
import { Files, OrderPayments, SiteLink, StatusNote } from "@/components/panel/OrderAdmin";

export const metadata: Metadata = { title: "Zlecenie" };

const long = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00`));

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();
  const [files, payments, site, sites, token, base, inquiry] = await Promise.all([
    orderFiles(id),
    orderPayments(o),
    o.site_id ? getSite(o.site_id) : null,
    listSites(),
    setting("blob_token"),
    origin(),
    one<{ id: string }>("SELECT id FROM inquiries WHERE order_id = ?", [id]),
  ]);
  const blob = token ? await blobAccess(token).catch(() => null) : null;
  const t = today();
  const total = Math.max(1, daysBetween(o.start_date, o.due_date));
  const left = daysBetween(t, o.due_date);
  const paid = payments.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0);

  return (
    <>
      <PageHead title={o.title} text={`${o.client_name}${o.client_email ? ` · ${o.client_email}` : ""}${o.service ? ` · ${o.service}` : ""}`}>
        <Link href="/panel/admin/zlecenia" className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.05] px-4 text-[13.5px] text-muted transition-colors hover:text-ink">
          <Icon d="M15 5l-7 7 7 7" className="size-4" /> Wszystkie zlecenia
        </Link>
        {inquiry && (
          <Link href={`/panel/admin/zapytania?id=${inquiry.id}`} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.05] px-4 text-[13.5px] text-muted transition-colors hover:text-ink">
            <Icon d={ICONS.inbox} className="size-4" /> Zapytanie
          </Link>
        )}
      </PageHead>

      <h2 className="mb-5 text-[clamp(1.8rem,3vw,2.6rem)] leading-tight font-medium tracking-[-0.03em]">{o.title}</h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric i={0} label={o.status === "done" ? "Oddane" : left < 0 ? "Po terminie" : "Do terminu"} value={o.status === "done" ? 0 : Math.abs(left)} suffix=" dni" viz={{ kind: "gauge", value: o.status === "done" ? 1 : Math.max(0, Math.min(1, daysBetween(o.start_date, t) / total)), label: long(o.due_date) }} foot={`start ${long(o.start_date)}`} tone={left < 0 && o.status !== "done" ? "text-red-300" : undefined} />
        <Metric i={1} label="Wycena" value={o.amount ?? 0} suffix=" zł" icon={ICONS.money} foot={o.service ?? "—"} />
        <Metric i={2} label="Opłacono" value={Math.round(paid / 100)} suffix=" zł" icon={ICONS.wallet} foot={`${payments.length} ${payments.length === 1 ? "płatność" : "płatności"}`} />
        <Metric i={3} label="Pliki dla klienta" value={files.length} icon={ICONS.download} foot={site ? `strona: ${site.name}` : "bez strony w CMS"} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusNote id={o.id} status={o.status} note={o.client_note ?? ""} hasFiles={files.length > 0} hasEmail={!!o.client_email} />
        <Files orderId={o.id} files={files.map((f) => ({ id: f.id, name: f.name, size: f.size, kind: fileKind(f.name, f.mime), created_at: f.created_at }))} blob={blob} />
        <SiteLink
          orderId={o.id}
          site={site ? { id: site.id, name: site.name, domain: site.domain, public_key: site.public_key } : null}
          sites={sites.map((s) => ({ id: s.id, name: s.name, domain: s.domain }))}
          clientHasAccount={!!o.user_id}
          origin={base}
        />
        <OrderPayments order={{ id: o.id, title: o.title, client_name: o.client_name, client_email: o.client_email, user_id: o.user_id, service: o.service }} payments={payments.map((p) => ({ id: p.id, title: p.title, amount: Number(p.amount), status: p.status, stripe_url: p.stripe_url }))} />
      </div>
    </>
  );
}
