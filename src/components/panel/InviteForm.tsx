"use client";

import { useActionState, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createInvite } from "@/app/panel/admin/actions";
import { Alert } from "../account/ui";
import { Btn, ease, field, Icon, ICONS, Label, Modal } from "./kit";
import { Portal } from "./crm/ui";

export function CodeResult({ code, email, mailed, dev }: { code: string; email: string; mailed?: boolean; dev?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} className="relative overflow-hidden rounded-2xl border border-accent/25 bg-accent/[0.06] p-5">
      <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.22),transparent)]" aria-hidden />
      <div className="relative flex items-center gap-2 text-[13px]">
        <span className={`grid size-5 place-items-center rounded-full ${mailed ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-300/15 text-amber-200"}`}>
          <Icon d={mailed ? ICONS.check : ICONS.mail} className="size-3" />
        </span>
        <span className={mailed ? "text-muted" : "text-amber-200"}>{mailed ? (dev ? `Tryb dev — mail w konsoli serwera` : `Wysłano na ${email}`) : `Mail nie wyszedł — przekaż kod ręcznie`}</span>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[28px] tracking-[0.22em] text-ink sm:text-[32px]">{code}</p>
        <Btn
          type="button"
          size="sm"
          icon={copied ? ICONS.check : ICONS.copy}
          onClick={() =>
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            })
          }
        >
          {copied ? "Skopiowano" : "Kopiuj kod"}
        </Btn>
      </div>
    </motion.div>
  );
}

function Form({ email, name, onDone, onAgain }: { email: string; name: string; onDone: () => void; onAgain: () => void }) {
  const [state, action, pending] = useActionState(createInvite, undefined);
  if (state?.code)
    return (
      <div>
        <CodeResult code={state.code} email={state.email!} mailed={state.mailed} dev={state.dev} />
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Btn type="button" variant="ghost" icon={ICONS.plus} onClick={onAgain}>
            Kolejne zaproszenie
          </Btn>
          <Btn type="button" variant="primary" onClick={onDone}>
            Gotowe
          </Btn>
        </div>
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      <Label label="E-mail klienta">
        <input name="email" type="email" required autoComplete="off" autoFocus defaultValue={email} placeholder="klient@firma.pl" className={`${field} h-11`} />
      </Label>
      <Label label="Imię (opcjonalnie)">
        <input name="name" autoComplete="off" defaultValue={name} placeholder="np. Anna" className={`${field} h-11`} />
      </Label>
      <Alert>{state?.error}</Alert>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="flex items-center gap-1.5 text-[12.5px] text-dim">
          <Icon d={ICONS.clock} className="size-3.5" />
          Kod ważny 7 dni
        </span>
        <Btn type="submit" variant="primary" icon={pending ? undefined : ICONS.mail} disabled={pending}>
          {pending ? "Wysyłanie…" : "Wyślij zaproszenie"}
        </Btn>
      </div>
    </form>
  );
}

// Przycisk w nagłówku + okno; ?zapros=1 (&email, &imie) otwiera je od razu
export default function InviteButton() {
  const sp = useSearchParams();
  const path = usePathname();
  const flag = sp.get("zapros");
  const [seen, setSeen] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  if (flag !== seen) {
    setSeen(flag);
    if (flag) setOpen(true);
  }
  const close = () => {
    setOpen(false);
    if (flag) window.history.replaceState(null, "", path);
    setTimeout(() => setRound((r) => r + 1), 300);
  };
  return (
    <>
      <Btn variant="primary" icon={ICONS.plus} onClick={() => setOpen(true)}>
        Zaproś klienta
      </Btn>
      <Portal>
        <Modal open={open} onClose={close} title="Zaproś klienta">
          <Form key={round} email={flag ? (sp.get("email") ?? "") : ""} name={flag ? (sp.get("imie") ?? "") : ""} onDone={close} onAgain={() => setRound((r) => r + 1)} />
        </Modal>
      </Portal>
    </>
  );
}
