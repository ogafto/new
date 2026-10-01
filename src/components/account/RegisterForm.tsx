"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register } from "@/app/konto/actions";
import Input from "../ui/Input";
import Intro, { Stagger } from "./Intro";
import { Alert, Submit } from "./ui";

export default function RegisterForm({ code, email }: { code: string; email: string }) {
  const [state, action] = useActionState(register, undefined);
  const f = state?.fields;
  return (
    <>
      <Intro kicker="Rejestracja" title="Załóż konto" text="Wpisz kod z zaproszenia, które przyszło na Twój e-mail." />
      <Stagger>
        <form action={action} className="space-y-3" key={JSON.stringify(f ?? {})}>
          <Input name="code" label="Kod zaproszenia" autoComplete="off" defaultValue={f?.code ?? code} hint="Format: XXXX-XXXX" />
          <Input name="name" label="Imię" autoComplete="given-name" required defaultValue={f?.name} />
          <Input name="email" label="E-mail (ten z zaproszenia)" type="email" autoComplete="email" required defaultValue={f?.email ?? email} />
          <Input name="password" label="Hasło" type="password" autoComplete="new-password" required minLength={8} hint="Co najmniej 8 znaków." />

          <label className="flex cursor-pointer items-start gap-3 pt-2 text-[13px] leading-relaxed text-muted">
            <input type="checkbox" name="consent" required className="peer sr-only" />
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border border-line-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
              <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>
              Akceptuję{" "}
              <Link href="/regulamin" className="text-ink underline decoration-white/30 underline-offset-4">
                regulamin
              </Link>{" "}
              i{" "}
              <Link href="/polityka-prywatnosci" className="text-ink underline decoration-white/30 underline-offset-4">
                politykę prywatności
              </Link>
              .
            </span>
          </label>

          <Alert>{state?.error}</Alert>
          <div className="pt-3">
            <Submit>Załóż konto</Submit>
          </div>
        </form>
        <p className="mt-8 text-[14px] text-muted">
          Masz już konto?{" "}
          <Link href="/konto/logowanie" className="text-ink underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-accent">
            Zaloguj się
          </Link>
        </p>
      </Stagger>
    </>
  );
}
