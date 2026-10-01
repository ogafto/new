"use client";

import { useActionState } from "react";
import { logout, resend, verify } from "@/app/konto/actions";
import Intro, { Stagger } from "./Intro";
import { Alert, OtpInput, Submit } from "./ui";

export default function VerifyForm({ email, sendFailed }: { email: string; sendFailed: boolean }) {
  const [state, action, pending] = useActionState(verify, undefined);
  const [sent, resendAction, resending] = useActionState(resend, undefined);
  return (
    <>
      <Intro
        kicker="Weryfikacja"
        title="Sprawdź skrzynkę"
        text={
          <>
            Wysłałem 6-cyfrowy kod na <span className="text-ink">{email}</span>. Wpisz go poniżej.
          </>
        }
      />
      <Stagger>
        <form action={action} className="space-y-4">
          <OtpInput invalid={!!state?.error && !pending} key={state?.error} />
          <Alert>{state?.error ?? (sendFailed && !sent ? "Nie udało się wysłać maila — wyślij kod ponownie." : undefined)}</Alert>
          <div className="pt-2">
            <Submit pending={pending}>Potwierdź e-mail</Submit>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[14px] text-muted">
          <form action={resendAction}>
            <button type="submit" disabled={resending} className="link-u text-ink disabled:opacity-60">
              {resending ? "Wysyłanie…" : "Wyślij kod ponownie"}
            </button>
          </form>
          <form action={logout}>
            <button type="submit" className="link-u hover:text-ink">
              Wyloguj
            </button>
          </form>
        </div>
        <Alert tone={sent?.ok ? "ok" : "error"}>{sent?.ok ?? sent?.error}</Alert>
      </Stagger>
    </>
  );
}
