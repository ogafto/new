"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { deleteInquiry, setInquiryNote, setInquiryStatus } from "@/app/panel/admin/zapytania/actions";
import { Badge, Card, ConfirmBtn, ease, Empty, field, ICONS, Icon, Tabs } from "./kit";

export type Inquiry = { id: string; name: string; email: string; phone: string | null; company: string | null; topic: string | null; budget: string | null; timeline: string | null; message: string; status: "new" | "contacted" | "won" | "lost"; note: string | null; created_at: number };

const ST = {
  new: { label: "Nowe", tone: "accent" as const },
  contacted: { label: "W kontakcie", tone: "sky" as const },
  won: { label: "Zlecenie", tone: "green" as const },
  lost: { label: "Bez zlecenia", tone: "default" as const },
};
const when = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(ms);

function Row({ q, open, toggle }: { q: Inquiry; open: boolean; toggle: () => void }) {
  const [note, setNote] = useState(q.note ?? "");
  const [pending, start] = useTransition();
  const first = q.name.split(" ")[0];
  return (
    <motion.li layout className="overflow-hidden rounded-2xl border border-line transition-colors hover:border-line-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease }}>
      <button type="button" onClick={toggle} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-white/10 to-white/[0.02] text-[15px]">
          {q.name.charAt(0).toUpperCase()}
          {q.status === "new" && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-accent" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px]">
            {q.name}
            {q.company && <span className="text-dim"> · {q.company}</span>}
          </span>
          <span className="block truncate text-[13px] text-dim">{q.topic || q.message}</span>
        </span>
        <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <Badge tone={ST[q.status].tone}>{ST[q.status].label}</Badge>
          <span className="text-[11.5px] text-dim">{when(q.created_at)}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-dim">
          <Icon d={ICONS.arrowDown} className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease }} className="overflow-hidden">
            <div className="grid gap-6 border-t border-line p-5 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <dl className="grid grid-cols-2 gap-4 text-[14px] sm:grid-cols-3">
                  {[
                    ["E-mail", q.email],
                    ["Telefon", q.phone || "—"],
                    ["Usługa", q.topic || "—"],
                    ["Budżet", q.budget || "—"],
                    ["Termin", q.timeline || "—"],
                    ["Wysłano", when(q.created_at)],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[12px] text-dim">{k}</dt>
                      <dd className="mt-0.5 truncate">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 rounded-2xl bg-white/[0.03] p-4 text-[14.5px] leading-relaxed whitespace-pre-wrap text-ink/90">{q.message}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: Twój projekt — afto.works`)}&body=${encodeURIComponent(`Cześć ${first},\n\n`)}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-medium text-bg transition-colors hover:bg-white">
                    <Icon d={ICONS.mail} className="size-4" />
                    Odpisz
                  </a>
                  {q.phone && (
                    <a href={`tel:${q.phone.replace(/\s/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 px-3.5 text-[13px] transition-colors hover:border-white/35">
                      <Icon d={ICONS.phone} className="size-4" />
                      Zadzwoń
                    </a>
                  )}
                  <Link href={`/panel/admin/kalendarz?nowe=1&klient=${encodeURIComponent(q.company || q.name)}&email=${encodeURIComponent(q.email)}&tytul=${encodeURIComponent(q.topic?.split(" (")[0] ?? "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 px-3.5 text-[13px] transition-colors hover:border-white/35">
                    <Icon d={ICONS.calendar} className="size-4" />
                    Do kalendarza
                  </Link>
                  <Link href={`/panel/admin/klienci?zapros=1&email=${encodeURIComponent(q.email)}&imie=${encodeURIComponent(first)}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 px-3.5 text-[13px] transition-colors hover:border-white/35">
                    <Icon d={ICONS.users} className="size-4" />
                    Zaproś do panelu
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[13px] text-muted">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(ST) as Inquiry["status"][]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={pending}
                        onClick={() => start(() => setInquiryStatus(q.id, s))}
                        className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${q.status === s ? "border-accent bg-accent/15 text-ink" : "border-line-2 text-muted hover:text-ink"}`}
                      >
                        {ST[s].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[13px] text-muted">Notatka (widoczna tylko dla Ciebie)</p>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (q.note ?? "") && start(() => setInquiryNote(q.id, note))} rows={4} className={`${field} resize-none py-3`} placeholder="np. oddzwonić w piątek" />
                </div>
                <ConfirmBtn onConfirm={() => start(() => deleteInquiry(q.id))}>Usuń zapytanie</ConfirmBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default function Inquiries({ rows }: { rows: Inquiry[] }) {
  const [tab, setTab] = useState<"all" | Inquiry["status"]>("all");
  const [open, setOpen] = useState<string | null>(rows.find((r) => r.status === "new")?.id ?? null);
  const list = tab === "all" ? rows : rows.filter((r) => r.status === tab);
  const count = (s: Inquiry["status"]) => rows.filter((r) => r.status === s).length;
  return (
    <Card>
      <div className="mb-5">
        <Tabs
          id="inq"
          value={tab}
          onChange={setTab}
          items={[
            { value: "all", label: "Wszystkie", count: rows.length },
            { value: "new", label: "Nowe", count: count("new") },
            { value: "contacted", label: "W kontakcie", count: count("contacted") },
            { value: "won", label: "Zlecenia", count: count("won") },
            { value: "lost", label: "Bez zlecenia", count: count("lost") },
          ]}
        />
      </div>
      {list.length === 0 ? (
        <Empty icon={ICONS.inbox} title="Brak zapytań" text="Wiadomości z formularza na stronie pojawią się tutaj — nawet jeśli mail nie jest skonfigurowany." />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {list.map((q) => (
              <Row key={q.id} q={q} open={open === q.id} toggle={() => setOpen(open === q.id ? null : q.id)} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
}
