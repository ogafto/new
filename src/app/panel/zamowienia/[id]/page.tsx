import type { Metadata } from "next";
import { plural } from "@/lib/format";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { getSite, siteHref } from "@/lib/cms";
import { canSee, fileKind, fmtSize, getOrder, orderFiles, orderPayments } from "@/lib/deliver";
import { syncStripe, zl } from "@/lib/finance";
import { daysBetween, today } from "@/lib/orders";
import { site as studio } from "@/lib/site";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import { Panel, Row } from "@/components/panel/dash";
import { OrderHero, Stepper } from "@/components/panel/client/OrderView";
import { Mark } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Zlecenie" };

const long = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00`));
const day = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(ms);

const KIND_ICON: Record<string, string> = {
  archiwum: "M4 7h16v13H4zM4 7l2-3h12l2 3M10 11h4",
  grafika: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01",
  wideo: "M4 6h12v12H4zM16 10l4-2v8l-4-2",
  pdf: "M7 3h7l5 5v13H7zM14 3v5h5M9 14h6M9 17h4",
  projekt: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  font: "M5 19L11 5h2l6 14M8 13h8",
  plik: "M7 3h7l5 5v13H7zM14 3v5h5",
};

export default async function ClientOrder({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isAdmin(user)) redirect(`/panel/admin/zlecenia/${(await params).id}`);
  const { id } = await params;
  const o = await getOrder(id);
  if (!o || !canSee(user, o) || o.status === "cancelled") notFound();
  const [files, first, site] = await Promise.all([orderFiles(id), orderPayments(o), o.site_id ? getSite(o.site_id) : null]);
  // wpłata ze Stripe mogła dojść przed webhookiem — dociągnij stan
  const payments = (await syncStripe(first)) ? await orderPayments(o) : first;
  const t = today();
  const done = o.status === "done";
  const total = Math.max(1, daysBetween(o.start_date, o.due_date));
  const progress = done ? 1 : Math.max(0, Math.min(1, daysBetween(o.start_date, t) / total));
  const left = daysBetween(t, o.due_date);
  const started = o.start_date <= t;
  const due = payments.filter((p) => p.status === "pending");
  const statusLabel = done ? "Oddane" : o.status === "planned" ? "Zaplanowane" : "W realizacji";
  const editable = site && site.owner_id === user.id;

  const steps = [
    { label: "Przyjęte", sub: day(Number(o.created_at)), state: "done" as const },
    { label: "W realizacji", sub: started ? `od ${long(o.start_date)}` : `start ${long(o.start_date)}`, state: done ? ("done" as const) : started ? ("now" as const) : ("next" as const) },
    { label: "Pliki i strona", sub: files.length ? `${files.length} ${plural(files.length, "plik", "pliki", "plików")}` : site ? "strona podpięta" : "w przygotowaniu", state: done ? ("done" as const) : files.length || site ? ("now" as const) : ("next" as const) },
    { label: "Oddane", sub: done && o.done_at ? day(Number(o.done_at)) : `termin ${long(o.due_date)}`, state: done ? ("done" as const) : ("next" as const) },
  ];

  return (
    <>
      <PageHead title={o.title}>
        <Link href="/panel/zamowienia" className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.05] px-4 text-[13.5px] text-muted transition-colors hover:text-ink">
          <Icon d="M15 5l-7 7 7 7" className="size-4" /> Moje zamówienia
        </Link>
      </PageHead>

      <OrderHero title={o.title} service={o.service} status={o.status} statusLabel={statusLabel} left={left} progress={progress} start={long(o.start_date)} due={long(o.due_date)} since={day(Number(o.created_at))} done={done} />
      <Stepper steps={steps} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8 [&>section]:h-auto">
          {o.client_note && (
            <Panel title="Wiadomość od afto">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/15">
                  <Mark className="size-6" />
                </span>
                <p className="text-[15px] leading-[1.7] whitespace-pre-wrap text-ink/90">{o.client_note}</p>
              </div>
            </Panel>
          )}

          <Panel title={`Pliki do pobrania${files.length ? ` · ${files.length}` : ""}`} i={1}>
            {files.length ? (
              <ul className="space-y-2">
                {files.map((f) => {
                  const k = fileKind(f.name, f.mime);
                  return (
                    <li key={f.id}>
                      <a href={`/api/pliki/${f.id}`} className="group flex items-center gap-3.5 rounded-2xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06] sm:p-3.5">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent-2">
                          <Icon d={KIND_ICON[k] ?? KIND_ICON.plik} className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px]">{f.name}</span>
                          <span className="block text-[12.5px] text-dim">
                            {fmtSize(f.size)} · {k} · {day(f.created_at)}
                          </span>
                        </span>
                        <span className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink pr-1 pl-4 text-[13px] font-medium text-bg transition-colors group-hover:bg-white">
                          <span className="hidden sm:inline">Pobierz</span>
                          <span className="grid size-8 place-items-center rounded-full bg-accent text-white">
                            <Icon d={ICONS.download} className="size-4" />
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex items-center gap-4 rounded-2xl bg-white/[0.02] p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-dim">
                  <Icon d={ICONS.download} className="size-5" />
                </span>
                <p className="text-[14px] leading-relaxed text-muted">Gotowe pliki (np. logo, projekt, eksport strony) pojawią się tutaj — dostaniesz też maila, gdy będą do pobrania.</p>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4 [&>section]:h-auto">
          {site && (
            <section className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(150deg,rgb(139_108_255/0.32),rgb(139_108_255/0.06)_60%,rgb(255_255_255/0.02))] p-5 ring-1 ring-white/[0.06] ring-inset">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1.2px)] [mask-image:linear-gradient(to_top,black,transparent_70%)] bg-[size:6px_6px]" aria-hidden />
              <span className="relative grid size-11 place-items-center rounded-full bg-accent text-white shadow-[0_0_24px_-4px_rgb(139_108_255/0.9)]">
                <Icon d={ICONS.globe} className="size-5" />
              </span>
              <p className="relative mt-4 text-[13px] text-muted">Twoja strona</p>
              <p className="relative mt-0.5 text-[20px] font-medium tracking-[-0.02em]">{site.name}</p>
              {site.domain && <p className="relative text-[13.5px] text-muted">{site.domain}</p>}
              <div className="relative mt-5 space-y-2">
                {editable && (
                  <Link href={`/panel/strona/${site.id}`} className="group flex h-11 items-center justify-between rounded-full bg-ink pr-1.5 pl-5 text-[14px] font-medium text-bg transition-colors hover:bg-white">
                    Edytuj treści strony
                    <span className="grid size-8 place-items-center rounded-full bg-accent text-white">
                      <Icon d={ICONS.edit} className="size-4" />
                    </span>
                  </Link>
                )}
                {site.domain && (
                  <a href={siteHref(site.domain)!} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-full bg-white/[0.08] text-[13.5px] ring-1 ring-white/[0.1] transition-colors ring-inset hover:bg-white/[0.14]">
                    Otwórz stronę <Icon d={ICONS.site} className="size-4" />
                  </a>
                )}
              </div>
              <p className="relative mt-4 text-[12px] leading-relaxed text-muted">Teksty, zdjęcia i ofertę zmieniasz sam — zmiany pojawią się na stronie po zapisaniu.</p>
            </section>
          )}

          <Panel title="Płatności" i={2}>
            {payments.length ? (
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li key={p.id} className="rounded-2xl bg-white/[0.03] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[14px] leading-snug">{p.title}</p>
                      <p className="shrink-0 text-[15px] tabular-nums">{zl(Number(p.amount))}</p>
                    </div>
                    {p.status === "paid" ? (
                      <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-emerald-300">
                        <Icon d={ICONS.check} className="size-3.5" /> Opłacone{p.paid_at ? ` · ${day(Number(p.paid_at))}` : ""}
                      </p>
                    ) : p.stripe_url ? (
                      <a href={p.stripe_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
                        <Icon d={ICONS.card} className="size-4" /> Zapłać online
                      </a>
                    ) : (
                      <p className="mt-2 text-[12.5px] text-amber-200">Czeka na wpłatę{p.due_date ? ` · do ${long(p.due_date)}` : ""}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-dim">Brak płatności przypiętych do tego zlecenia.</p>
            )}
            {due.length > 0 && <p className="mt-3 text-[12.5px] text-muted">Do zapłaty: {zl(due.reduce((a, p) => a + Number(p.amount), 0))}</p>}
          </Panel>

          <Panel title="Pytania?" i={3}>
            <div className="space-y-2">
              <Row href={`mailto:${studio.email}?subject=${encodeURIComponent(`Zlecenie: ${o.title}`)}`} icon={ICONS.mail} title="Napisz maila" sub={studio.email} />
              <Row href={`tel:${studio.phone.replace(/\s/g, "")}`} icon={ICONS.phone} title="Zadzwoń" sub={studio.phone} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
