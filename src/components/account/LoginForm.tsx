"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { login } from "@/app/konto/actions";
import Input from "../ui/Input";
import { pulse, useHandoff } from "./AuthShell";
import { Alert, AuthTitle, Submit, Success } from "./ui";

/*
 * `signedIn` = adres panelu, gdy sesja już istnieje (strona przekazuje go zamiast redirectu
 * podczas odświeżenia po zalogowaniu). Formularz sam pokazuje sukces i płynnie przechodzi do panelu.
 */
export default function LoginForm({ next, signedIn }: { next: string; signedIn?: string }) {
  const handoff = useHandoff();
  const [error, setError] = useState("");
  const [scope, animate] = useAnimate();
  const [target, setTarget] = useState(signedIn ?? "");
  const [returning] = useState(!!signedIn);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!target) return;
    pulse();
    return handoff(target, returning ? 900 : 1400);
  }, [target, returning, handoff]);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {target ? (
        <Success key="ok" title={returning ? "Jesteś zalogowany." : "Witaj ponownie."} text="Otwieram Twój panel…" bar={returning ? 0.9 : 1.4} />
      ) : (
        <motion.div key="form" exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.25 }}>
          <AuthTitle kicker="Logowanie" title="Witaj ponownie" text="Zaloguj się, żeby zobaczyć swój projekt." />
          <form
            ref={scope}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              start(async () => {
                setError("");
                f.set("next", next);
                const r = await login(undefined, f);
                if (r?.done) setTarget(r.done);
                else {
                  setError(r?.error ?? "Nie udało się zalogować.");
                  animate(scope.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.5 });
                }
              });
            }}
          >
            <Input name="email" label="E-mail" type="email" autoComplete="email" required />
            <Input name="password" label="Hasło" type="password" autoComplete="current-password" required />
            <Alert>{error}</Alert>
            <div className="pt-3">
              <Submit pending={pending}>Zaloguj się</Submit>
            </div>
          </form>
          <p className="mt-8 text-center text-[14px] text-muted">
            Masz kod z zaproszenia?{" "}
            <Link href="/konto/rejestracja" className="text-ink underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-accent">
              Załóż konto
            </Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
