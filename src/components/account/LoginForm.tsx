"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/konto/actions";
import Input from "../ui/Input";
import Intro, { Stagger } from "./Intro";
import { Alert, Submit } from "./ui";

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <>
      <Intro kicker="Logowanie" title="Witaj ponownie" text="Zaloguj się, żeby zobaczyć postęp swojego projektu." />
      <Stagger>
        <form action={action} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <Input name="email" label="E-mail" type="email" autoComplete="email" required defaultValue={state?.fields?.email} key={`e-${state?.fields?.email}`} />
          <Input name="password" label="Hasło" type="password" autoComplete="current-password" required />
          <Alert>{state?.error}</Alert>
          <div className="pt-3">
            <Submit>Zaloguj się</Submit>
          </div>
        </form>
        <p className="mt-8 text-[14px] text-muted">
          Masz kod z zaproszenia?{" "}
          <Link href="/konto/rejestracja" className="text-ink underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-accent">
            Załóż konto
          </Link>
        </p>
      </Stagger>
    </>
  );
}
