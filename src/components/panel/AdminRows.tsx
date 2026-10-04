"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { deleteClient, resendInvite, revokeInvite, updateClient, type InviteState } from "@/app/panel/admin/actions";
import { Badge, Btn, Card, ease, Empty, field, Icon, ICONS, Modal } from "./kit";
import { STAGES } from "@/lib/format";
import { CodeResult } from "./InviteForm";

import { ago, Avatar, CopyBtn, fold, Menu, Portal, Search, Segmented, StageBar, useNow } from "./crm/ui";

const tz = "Europe/Warsaw";
const date = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(ms);
const dateTime = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(ms);
const th = "px-3 pb-3 text-left text-[12.5px] font-normal text-dim first:pl-5 last:pr-5";
const td = "px-3 py-3 align-middle first:pl-5 last:pr-5";

/* ======================= Klienci ======================= */

export type ClientRowData = { id: string; name: string; email: string; phone: string | null; verified: boolean; stage: number; project: string; created: number; last: number | null; site: { id: string; name: string } | null };

function EditClient({ c, onClose }: { c: ClientRowData; onClose: () => void }) {
  const [stage, setStage] = useState(c.stage);
  const [project, setProject] = useState(c.project);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData();
        f.set("project", project);
        f.set("stage", String(stage));
        start(async () => {
          await updateClient(c.id, f);
          onClose();
        });
      }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-3">
        <Avatar name={c.name} size={40} />
        <div className="min-w-0">
          <p className="truncate text-[14.5px]">{c.name}</p>
          <p className="truncate text-[12.5px] text-dim">{c.email}</p>
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-muted">Projekt</span>
        <input value={project} onChange={(e) => setProject(e.target.value)} maxLength={80} placeholder="np. Strona firmowa" autoFocus className={`${field} h-11`} />
      </label>
      <div>
        <p className="mb-2.5 text-[13px] text-muted">Etap</p>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup">
          {STAGES.map((s, i) => {
            const on = i <= stage;
            const cur = i === stage;
            return (
              <button key={s} type="button" role="radio" aria-checked={cur} onClick={() => setStage(i)} className="group text-left">
                <span className={`block h-1.5 rounded-full transition-colors duration-300 ${on ? (stage === STAGES.length - 1 ? "bg-emerald-400" : cur ? "bg-accent-2" : "bg-accent") : "bg-white/[0.08] group-hover:bg-white/[0.16]"}`} />
                <span className="mt-2 block text-[11px] text-dim tabular-nums">{i + 1}</span>
                <span className={`block text-[11.5px] leading-tight break-words sm:text-[12.5px] ${cur ? "text-ink" : "text-dim group-hover:text-muted"}`}>{s}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Btn type="button" variant="ghost" onClick={onClose}>
          Anuluj
        </Btn>
        <Btn type="submit" variant="primary" icon={ICONS.check} disabled={pending}>
          {pending ? "Zapisywanie…" : "Zapisz"}
        </Btn>
      </div>
    </form>
  );
}

function DeleteClient({ c, onClose }: { c: ClientRowData; onClose: () => void }) {
  const [pending, start] = useTransition();
  return (
    <div>
      <p className="text-[14.5px] leading-relaxed text-muted">
        Konto <span className="text-ink">{c.name}</span> ({c.email}) zostanie usunięte, a klient straci dostęp do panelu.
      </p>
      <div className="mt-7 flex justify-end gap-2">
        <Btn type="button" variant="ghost" onClick={onClose}>
          Anuluj
        </Btn>
        <Btn type="button" variant="danger" className="!bg-red-400/10 hover:!bg-red-400/20" icon={ICONS.trash} disabled={pending} onClick={() => start(async () => (await deleteClient(c.id), onClose()))}>
          {pending ? "Usuwanie…" : "Usuń konto"}
        </Btn>
      </div>
    </div>
  );
}

function Unverified() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-300/10 px-1.5 py-px text-[11px] text-amber-200" title="Adres e-mail niepotwierdzony">
      <span className="size-1 rounded-full bg-amber-300" />
      niepotwierdzony
    </span>
  );
}

export function ClientsTable({ rows, now: serverNow }: { rows: ClientRowData[]; now: number }) {
  const now = useNow(serverNow);
  // wejście z wyszukiwarki ⌘K (?q=…) — lista od razu przefiltrowana
  const initialQ = useSearchParams().get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [stage, setStage] = useState<"all" | "work" | "done">("all");
  const [edit, setEdit] = useState<ClientRowData | null>(null);
  const [del, setDel] = useState<ClientRowData | null>(null);
  const last = STAGES.length - 1;
  const list = useMemo(() => {
    const f = fold(q.trim());
    return rows.filter((c) => (stage === "all" || (stage === "done" ? c.stage >= last : c.stage < last)) && (!f || fold(`${c.name} ${c.email} ${c.project} ${c.phone ?? ""}`).includes(f)));
  }, [rows, q, stage, last]);

  const menu = (c: ClientRowData) => [
    { label: "Edytuj projekt i etap", icon: ICONS.edit, onSelect: () => setEdit(c) },
    ...(c.site ? [{ label: `CMS: ${c.site.name}`, icon: ICONS.layers, href: `/panel/admin/strony/${c.site.id}` }] : []),
    { label: "Napisz e-mail", icon: ICONS.mail, href: `mailto:${c.email}` },
    ...(c.phone ? [{ label: "Zadzwoń", icon: ICONS.phone, href: `tel:${c.phone.replace(/\s/g, "")}` }] : []),
    "sep" as const,
    { label: "Usuń konto", icon: ICONS.trash, danger: true, onSelect: () => setDel(c) },
  ];

  return (
    <Card pad={false} delay={0.06}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[16px] font-medium tracking-[-0.01em]">Klienci</h2>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px] text-muted tabular-nums">{rows.length}</span>
        </div>
        {rows.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Segmented
              id="cl-stage"
              size="sm"
              value={stage}
              onChange={setStage}
              items={[
                { value: "all", label: "Wszyscy" },
                { value: "work", label: "W trakcie", dot: "bg-accent" },
                { value: "done", label: "Opublikowani", dot: "bg-emerald-400" },
              ]}
            />
            <Search value={q} onChange={setQ} placeholder="Szukaj klienta" className="w-full sm:w-[220px]" />
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border-t border-line">
          <Empty icon={ICONS.users} title="Brak klientów" text="Zaproszeni klienci pojawią się tu po założeniu konta." />
        </div>
      ) : list.length === 0 ? (
        <p className="border-t border-line py-12 text-center text-[13.5px] text-dim">Brak wyników</p>
      ) : (
        <>
          {/* tabela */}
          <div className="hidden md:block">
            <table className="w-full table-fixed text-[14px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${th} w-[36%] xl:w-[27%]`}>Klient</th>
                  <th className={`${th} w-[22%] xl:w-[18%]`}>Projekt</th>
                  <th className={`${th} w-[24%] xl:w-[17%]`}>Etap</th>
                  <th className={`${th} hidden xl:table-cell xl:w-[14%]`}>Telefon</th>
                  <th className={`${th} hidden xl:table-cell xl:w-[12%]`}>Dołączył</th>
                  <th className={th}>Logowanie</th>
                  <th className={`${th} w-[64px]`}>
                    <span className="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {list.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.02, ease }}
                      className="group border-b border-line/70 transition-colors last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className={td}>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={c.name} size={34} />
                          <div className="min-w-0">
                            <p className="flex min-w-0 items-center gap-2">
                              <span className="truncate">{c.name}</span>
                              {!c.verified && <Unverified />}
                            </p>
                            <p className="flex min-w-0 items-center text-[12.5px] text-dim">
                              <span className="truncate">{c.email}</span>
                              <CopyBtn text={c.email} label="Kopiuj e-mail" className="-my-1 ml-0.5 size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" />
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <button type="button" onClick={() => setEdit(c)} className="block max-w-full truncate text-left hover:text-accent-2">
                          {c.project || <span className="text-dim">Dodaj projekt</span>}
                        </button>
                        {c.site && (
                          <Link href={`/panel/admin/strony/${c.site.id}`} className="mt-0.5 flex max-w-full items-center gap-1 text-[12px] text-dim hover:text-accent-2">
                            <Icon d={ICONS.layers} className="size-3 shrink-0" />
                            <span className="truncate">{c.site.name}</span>
                          </Link>
                        )}
                      </td>
                      <td className={td}>
                        <button type="button" onClick={() => setEdit(c)} className="block w-full max-w-[180px] rounded-lg text-left" aria-label={`Etap: ${STAGES[c.stage]}`}>
                          <StageBar stage={c.stage} stages={STAGES} compact />
                        </button>
                      </td>
                      <td className={`${td} hidden text-muted tabular-nums xl:table-cell`}>{c.phone ? <span className="truncate">{c.phone}</span> : <span className="text-dim">—</span>}</td>
                      <td className={`${td} hidden text-muted tabular-nums xl:table-cell`}>
                        <span className="block truncate">{date(c.created)}</span>
                      </td>
                      <td className={`${td} whitespace-nowrap text-muted tabular-nums`} title={c.last ? dateTime(c.last) : undefined}>
                        {c.last ? ago(c.last, now) : <span className="text-dim">nigdy</span>}
                      </td>
                      <td className={`${td} text-right`}>
                        <Menu items={menu(c)} label={`Akcje: ${c.name}`} className="-mr-1" />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* karty (telefon) */}
          <ul className="space-y-2 border-t border-line p-3 md:hidden">
            {list.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line bg-white/[0.015] p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-[15px]">{c.name}</span>
                      {!c.verified && <Unverified />}
                    </p>
                    <p className="truncate text-[12.5px] text-dim">{c.email}</p>
                  </div>
                  <Menu items={menu(c)} label={`Akcje: ${c.name}`} className="-mt-1 -mr-1" />
                </div>
                <button type="button" onClick={() => setEdit(c)} className="mt-4 block w-full rounded-xl bg-white/[0.025] p-3 text-left">
                  <span className="flex items-center justify-between gap-3 text-[13.5px]">
                    <span className="truncate">{c.project || <span className="text-dim">Dodaj projekt</span>}</span>
                    <Icon d={ICONS.edit} className="size-3.5 shrink-0 text-dim" />
                  </span>
                  <span className="mt-2.5 block">
                    <StageBar stage={c.stage} stages={STAGES} compact />
                  </span>
                </button>
                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-dim">
                  {c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="text-muted tabular-nums">{c.phone}</a>}
                  <span>od {date(c.created)}</span>
                  <span>logowanie: {c.last ? ago(c.last, now) : "nigdy"}</span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <Portal>
        <Modal open={!!edit} onClose={() => setEdit(null)} title="Projekt klienta">
          {edit && <EditClient key={edit.id} c={edit} onClose={() => setEdit(null)} />}
        </Modal>
        <Modal open={!!del} onClose={() => setDel(null)} title="Usunąć konto?">
          {del && <DeleteClient c={del} onClose={() => setDel(null)} />}
        </Modal>
      </Portal>
    </Card>
  );
}

/* ======================= Zaproszenia ======================= */

export type InviteStatus = "active" | "used" | "expired" | "revoked";
export type InviteRowData = { id: string; email: string; name: string | null; created: number; expires: number; sent: number; status: InviteStatus };

const INV: Record<InviteStatus, { label: string; tone: "accent" | "green" | "amber" | "default" }> = {
  active: { label: "Aktywne", tone: "accent" },
  used: { label: "Wykorzystane", tone: "green" },
  expired: { label: "Wygasłe", tone: "amber" },
  revoked: { label: "Cofnięte", tone: "default" },
};

function InviteActions({ i, onResent, compact = false }: { i: InviteRowData; onResent: (s: InviteState) => void; compact?: boolean }) {
  const [pending, start] = useTransition();
  if (i.status === "used") return <span className="text-[12.5px] text-dim">—</span>;
  const resend = i.status === "active" ? "Wyślij ponownie" : "Odnów";
  const lbl = compact ? "hidden xl:inline" : "";
  return (
    <div className="flex items-center justify-end gap-1">
      <Btn type="button" size="sm" variant="ghost" icon={ICONS.refresh} disabled={pending} title={resend} aria-label={resend} className={`!h-8 ${compact ? "!px-2.5 xl:!px-3" : "!px-3"}`} onClick={() => start(async () => onResent(await resendInvite(i.id)))}>
        <span className={lbl}>{pending ? "Wysyłanie…" : resend}</span>
      </Btn>
      {i.status === "active" && (
        <Btn type="button" size="sm" variant="ghost" icon={ICONS.close} disabled={pending} title="Cofnij" aria-label="Cofnij" className={`!h-8 hover:!bg-red-400/10 hover:!text-red-200 ${compact ? "!px-2.5 xl:!px-3" : "!px-3"}`} onClick={() => start(() => revokeInvite(i.id))}>
          <span className={lbl}>Cofnij</span>
        </Btn>
      )}
    </div>
  );
}

export function InvitesTable({ rows }: { rows: InviteRowData[] }) {
  const [tab, setTab] = useState<"all" | InviteStatus>("all");
  const [res, setRes] = useState<InviteState>(undefined);
  const list = tab === "all" ? rows : rows.filter((r) => r.status === tab);
  const n = (s: InviteStatus) => rows.filter((r) => r.status === s).length;
  return (
    <Card pad={false} delay={0.1}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[16px] font-medium tracking-[-0.01em]">Zaproszenia</h2>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px] text-muted tabular-nums">{rows.length}</span>
        </div>
        {rows.length > 0 && (
          <Segmented
            id="inv-tab"
            size="sm"
            value={tab}
            onChange={setTab}
            items={[{ value: "all" as const, label: "Wszystkie" }, ...(["active", "used", "expired", "revoked"] as const).filter((s) => n(s)).map((s) => ({ value: s, label: INV[s].label, count: n(s) }))]}
          />
        )}
      </div>
      {rows.length === 0 ? (
        <p className="border-t border-line py-12 text-center text-[13.5px] text-dim">Brak wysłanych zaproszeń</p>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full table-fixed text-[14px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Adres</th>
                  <th className={`${th} w-[17%]`}>Status</th>
                  <th className={`${th} w-[17%]`}>Wysłano</th>
                  <th className={`${th} w-[15%]`}>Ważne do</th>
                  <th className={`${th} w-[100px] xl:w-[250px]`}>
                    <span className="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-white/[0.025]">
                    <td className={`${td} !py-2.5`}>
                      <p className="truncate">{i.email}</p>
                      {i.name && <p className="truncate text-[12.5px] text-dim">{i.name}</p>}
                    </td>
                    <td className={`${td} !py-2.5`}>
                      <Badge tone={INV[i.status].tone}>{INV[i.status].label}</Badge>
                    </td>
                    <td className={`${td} !py-2.5 whitespace-nowrap text-muted tabular-nums`}>
                      {date(i.created)}
                      {i.sent > 1 && <span className="ml-1.5 text-[12px] text-dim">×{i.sent}</span>}
                    </td>
                    <td className={`${td} !py-2.5 whitespace-nowrap tabular-nums ${i.status === "expired" ? "text-amber-200/80" : "text-muted"}`}>{i.status === "used" || i.status === "revoked" ? <span className="text-dim">—</span> : date(i.expires)}</td>
                    <td className={`${td} !py-2.5 text-right`}>
                      <InviteActions i={i} onResent={setRes} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {list.map((i) => (
              <li key={i.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px]">{i.email}</p>
                    <p className="mt-0.5 text-[12px] text-dim tabular-nums">
                      {i.name ? `${i.name} · ` : ""}
                      {date(i.created)}
                      {i.sent > 1 ? ` · ×${i.sent}` : ""}
                    </p>
                  </div>
                  <Badge tone={INV[i.status].tone}>{INV[i.status].label}</Badge>
                </div>
                {i.status !== "used" && (
                  <div className="mt-2 -ml-3 flex justify-start">
                    <InviteActions i={i} onResent={setRes} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <Portal>
        <Modal open={!!res} onClose={() => setRes(undefined)} title={res?.error ? "Nie udało się" : "Nowy kod"}>
          {res?.code ? <CodeResult code={res.code} email={res.email!} mailed={res.mailed} dev={res.dev} /> : <p className="text-[14px] text-red-200">{res?.error}</p>}
          <div className="mt-6 flex justify-end">
            <Btn type="button" variant="primary" onClick={() => setRes(undefined)}>
              Gotowe
            </Btn>
          </div>
        </Modal>
      </Portal>
    </Card>
  );
}
