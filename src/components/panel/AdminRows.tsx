"use client";

import { useActionState, useState, useTransition } from "react";
import { AnimatePresence } from "motion/react";
import { deleteClient, resendInvite, revokeInvite, updateClient } from "@/app/panel/admin/actions";
import { ConfirmBtn } from "./kit";
import { STAGES } from "@/lib/format";
import { CodeResult } from "./InviteForm";

export function InviteActions({ id, canRevoke }: { id: string; canRevoke: boolean }) {
  const [state, resend, sending] = useActionState(() => resendInvite(id), undefined);
  const [revoking, start] = useTransition();
  return (
    <div className="inline-flex flex-col items-end">
      <div className="flex justify-end gap-2">
        <form action={resend}>
          <button type="submit" disabled={sending} className="rounded-full border border-line-2 px-3.5 py-1.5 text-[12.5px] transition-colors hover:border-white/40 disabled:opacity-50">
            {sending ? "Wysyłanie…" : "Nowy kod"}
          </button>
        </form>
        {canRevoke && (
          <button
            type="button"
            disabled={revoking}
            onClick={() => start(() => revokeInvite(id))}
            className="rounded-full px-3.5 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
          >
            Anuluj
          </button>
        )}
      </div>
      <AnimatePresence>{state?.code && <div className="w-[320px] text-left"><CodeResult code={state.code} email={state.email!} mailed={state.mailed} dev={state.dev} /></div>}</AnimatePresence>
      {state?.error && <p className="mt-2 text-[12px] text-red-200">{state.error}</p>}
    </div>
  );
}

type C = { id: string; name: string; email: string; phone: string | null; verified: boolean; stage: number; project: string; since: string; last: string; site?: { id: string; name: string } | null };

export function ClientRow({ c }: { c: C }) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <li className="grid min-w-0 grid-cols-1 gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/40 to-accent-2/20 text-[14px]">{c.name.charAt(0).toUpperCase()}</span>
        <span className="min-w-0">
          <span className="block truncate text-[15px]">
            {c.name}
            {!c.verified && <span className="ml-2 text-[12px] text-amber-200">niezweryfikowany</span>}
          </span>
          <span className="block truncate text-[12.5px] text-dim">
            {c.email}
            {c.phone ? ` · ${c.phone}` : ""} · od {c.since} · ostatnio {c.last}
          </span>
          {c.site && (
            <a href={`/panel/admin/strony/${c.site.id}`} className="mt-1 inline-block text-[12px] text-accent-2 hover:underline">
              CMS: {c.site.name} →
            </a>
          )}
        </span>
      </div>
      <form
        key={`${c.stage}-${c.project}`}
        className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end"
        action={(f) =>
          start(async () => {
            await updateClient(c.id, f);
            setSaved(true);
            setTimeout(() => setSaved(false), 1600);
          })
        }
      >
        <input
          name="project"
          defaultValue={c.project}
          placeholder="Nazwa projektu"
          className="h-10 min-w-0 basis-full rounded-xl border border-line-2 bg-white/[0.02] px-3 text-[14px] outline-none transition-colors placeholder:text-dim focus:border-accent sm:flex-1 sm:basis-auto md:max-w-[220px]"
        />
        <select name="stage" defaultValue={c.stage} className="h-10 min-w-0 flex-1 rounded-xl border border-line-2 bg-surface px-3 text-[14px] outline-none focus:border-accent sm:flex-none">
          {STAGES.map((s, i) => (
            <option key={s} value={i}>
              {i < 4 ? `${i + 1}. ${s}` : s}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="h-10 rounded-xl bg-ink px-4 text-[13px] font-medium text-bg transition-colors hover:bg-white disabled:opacity-60">
          {saved ? "Zapisano ✓" : pending ? "…" : "Zapisz"}
        </button>
        <ConfirmBtn onConfirm={() => start(() => deleteClient(c.id))} label="Usunąć konto?">
          <span className="sr-only">Usuń</span>
        </ConfirmBtn>
      </form>
    </li>
  );
}
