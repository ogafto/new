"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { createPayment, saveExpense, type NewPayment } from "@/app/panel/admin/finanse/actions";
import { Btn, field, Icon, ICONS, Label, Toggle } from "../kit";
import { CATS, METHOD, today } from "./shared";

/* Okna: nowa płatność i nowy koszt */

export function NewPaymentForm({ stripe, clients, services, onDone }: { stripe: boolean; clients: { id: string; name: string; email: string }[]; services: { id: string; name: string }[]; onDone: (m: { ok?: string; error?: string }) => void }) {
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
          Linki kartą/BLIK wymagają Stripe ·{" "}
          <Link href="/panel/admin/ustawienia" className="text-accent-2 underline-offset-4 hover:underline">
            Podłącz
          </Link>
        </p>
      )}

      <Label label="Za co">
        <input required className={`${field} h-11`} value={d.title} onChange={(e) => up({ title: e.target.value })} placeholder="np. Strona internetowa (zaliczka 50%)" />
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

export function NewExpenseForm({ onDone }: { onDone: (m: { ok?: string; error?: string }) => void }) {
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
              {v.label}
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
