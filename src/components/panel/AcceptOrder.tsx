"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { acceptInquiry, type AcceptResult } from "@/app/panel/admin/zapytania/actions";
import { ease, field, Icon, ICONS, Label, Toggle } from "./kit";
import { CopyBtn, Segmented } from "./crm/ui";

/* Przyjęcie zamówienia: nazwa, wycena, start i termin (podpowiedziany z oczekiwań klienta), zaliczka, mail do klienta */

const iso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(d);
};
const SPAN: Record<string, number> = { "Jak najszybciej": 10, "W ciągu miesiąca": 30, "1–3 miesiące": 60, "Bez pośpiechu": 45 };
const long = (d: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00`));
const lower = (budget: string | null) => {
  const m = budget?.replace(/\s/g, "").match(/(\d+)/);
  return m ? m[1] : "";
};

export type AcceptFor = { id: string; name: string; topic: string | null; budget: string | null; timeline: string | null; email: string };

export default function AcceptOrder({ q, onDone, onClose }: { q: AcceptFor; onDone: (r: { orderId: string; due: string; title: string }) => void; onClose: () => void }) {
  const first = q.topic?.split(",")[0]?.trim();
  const [title, setTitle] = useState(first || "Zlecenie");
  const [amount, setAmount] = useState(lower(q.budget));
  const [start, setStart] = useState(() => iso(0));
  const [due, setDue] = useState(() => iso(SPAN[q.timeline ?? ""] ?? 21));
  const [status, setStatus] = useState<"planned" | "active">("active");
  const [deposit, setDeposit] = useState("");
  const [mail, setMail] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState<AcceptResult | null>(null);
  const [pending, run] = useTransition();
  const days = Math.round((Date.parse(due) - Date.parse(start)) / 86_400_000);
  const amt = Number(amount.replace(",", ".")) || 0;

  if (done?.ok)
    return (
      <motion.div className="flex flex-col items-center py-4 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <div className="relative grid size-20 place-items-center">
          <motion.span className="absolute inset-0 rounded-full bg-emerald-400/25 blur-2xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ duration: 0.9 }} />
          <svg viewBox="0 0 64 64" className="relative size-16" fill="none" aria-hidden>
            <motion.circle cx="32" cy="32" r="30" stroke="#34d399" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
            <motion.path d="M20 33l8 8 16-17" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.45 }} />
          </svg>
        </div>
        <p className="h-display mt-4 text-[28px]">Przyjęte.</p>
        <p className="mt-1.5 text-[14.5px] text-muted">
          Termin: <span className="text-ink">{long(due)}</span> · zlecenie jest w kalendarzu{done.mailed ? ", klient dostał maila" : ""}.
        </p>
        {done.warn && <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-3 py-2 text-[13px] text-amber-100">{done.warn}</p>}
        {done.payUrl && (
          <div className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-line bg-white/[0.02] py-1.5 pr-1.5 pl-4 text-left">
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] text-dim">Link do zaliczki</span>
              <span className="block truncate text-[13px]">{done.payUrl}</span>
            </span>
            <CopyBtn text={done.payUrl} />
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={`/panel/admin/zlecenia/${done.orderId}`} className="flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] transition-colors hover:border-white/35">
            <Icon d={ICONS.receipt} className="size-4" /> Otwórz zlecenie
          </Link>
          <button type="button" onClick={onClose} className="h-10 rounded-full bg-ink px-5 text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
            Gotowe
          </button>
        </div>
      </motion.div>
    );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        run(async () => {
          const r = await acceptInquiry({ iid: q.id, title, service: q.topic ?? "", amount, start, due, status, deposit, mail });
          if (r.error) return setError(r.error);
          setDone(r);
          onDone({ orderId: r.orderId!, due, title });
        });
      }}
    >
      {(q.budget || q.timeline) && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 rounded-2xl border border-line bg-white/[0.02] px-4 py-3 text-[13px] text-muted">
          <span className="text-dim">Klient oczekuje:</span>
          {q.budget && <span>budżet {q.budget}</span>}
          {q.timeline && <span>{q.timeline.toLowerCase()}</span>}
        </p>
      )}
      <Label label="Nazwa zlecenia">
        <input className={`${field} h-11`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      </Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Start">
          <input type="date" className={`${field} h-11 [color-scheme:dark]`} value={start} onChange={(e) => setStart(e.target.value)} required />
        </Label>
        <Label label="Termin oddania" hint={days >= 0 ? `${days} ${days === 1 ? "dzień" : "dni"} na realizację · ${long(due)}` : "Termin przed startem"}>
          <input type="date" className={`${field} h-11 [color-scheme:dark]`} value={due} min={start} onChange={(e) => setDue(e.target.value)} required />
        </Label>
      </div>
      <div className="-mt-1 flex flex-wrap gap-1.5">
        {[7, 14, 30, 60].map((d) => (
          <button key={d} type="button" onClick={() => setDue(iso(d + Math.round((Date.parse(start) - Date.parse(iso(0))) / 86_400_000)))} className="rounded-full border border-line-2 px-3 py-1 text-[12.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
            +{d} dni
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Wycena (zł)">
          <input inputMode="decimal" className={`${field} h-11`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="np. 1800" />
        </Label>
        <Label label="Zaliczka (zł, opcjonalnie)" hint="Utworzy płatność z linkiem Stripe albo przelewem">
          <input inputMode="decimal" className={`${field} h-11`} value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="np. 500" />
        </Label>
      </div>
      {amt > 0 && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          {[30, 50].map((p) => (
            <button key={p} type="button" onClick={() => setDeposit(String(Math.round((amt * p) / 100)))} className="rounded-full border border-line-2 px-3 py-1 text-[12.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
              Zaliczka {p}% · {Math.round((amt * p) / 100).toLocaleString("pl-PL")} zł
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/[0.015] p-4 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          id="acc-st"
          size="sm"
          value={status}
          onChange={setStatus}
          items={[
            { value: "active", label: "Zaczynam teraz", dot: "bg-accent" },
            { value: "planned", label: "Zaplanowane", dot: "bg-sky-400" },
          ]}
        />
        <Toggle checked={mail} onChange={setMail} label="Mail do klienta" />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-[13.5px] text-red-300">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <button type="submit" disabled={pending} className="group flex h-12 w-full items-center justify-between rounded-full bg-ink pr-1.5 pl-5 text-[15px] font-medium text-bg transition-colors hover:bg-white disabled:opacity-60">
        {pending ? "Przyjmowanie…" : "Przyjmij zlecenie"}
        <span className="grid size-9 place-items-center rounded-full bg-accent text-white transition-transform duration-500 group-hover:rotate-45">
          <Icon d={ICONS.check} className="size-4" />
        </span>
      </button>
    </form>
  );
}
