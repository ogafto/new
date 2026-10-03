"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createInvite } from "@/app/panel/admin/actions";
import Input from "../ui/Input";
import { Alert, Submit } from "../account/ui";

export function CodeResult({ code, email, mailed, dev }: { code: string; email: string; mailed?: boolean; dev?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mt-5 flex flex-col gap-4 rounded-2xl border border-accent/25 bg-accent/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-[13px] text-accent-2">
          {mailed ? (dev ? `Tryb dev — mail wypisany w konsoli serwera (${email})` : `Wysłano na ${email}`) : `Nie udało się wysłać maila na ${email} — przekaż kod ręcznie`}
        </p>
        <p className="mt-1.5 font-mono text-[26px] tracking-[0.2em]">{code}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
        className="self-start rounded-full border border-line-2 px-4 py-2 text-[13px] transition-colors hover:border-white/40 sm:self-auto"
      >
        {copied ? "Skopiowano ✓" : "Kopiuj kod"}
      </button>
    </motion.div>
  );
}

export default function InviteForm({ email = "", name = "" }: { email?: string; name?: string }) {
  const [state, action] = useActionState(createInvite, undefined);
  return (
    <>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-[18px] font-medium tracking-[-0.01em]">Zaproś klienta</h2>
          <p className="mt-1 text-[14px] text-muted">Kod dostępu trafi na e-mail klienta · ważny 7 dni</p>
        </div>
      </div>
      <form action={action} className="mt-6 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]" key={state?.code ?? "new"}>
        <Input name="email" label="E-mail klienta" type="email" required autoComplete="off" defaultValue={email} />
        <Input name="name" label="Imię (opcjonalnie)" autoComplete="off" defaultValue={name} />
        <Submit className="md:w-[220px]">Wyślij kod</Submit>
      </form>
      <Alert>{state?.error}</Alert>
      <AnimatePresence>{state?.code && <CodeResult key={state.code} code={state.code} email={state.email!} mailed={state.mailed} dev={state.dev} />}</AnimatePresence>
    </>
  );
}
