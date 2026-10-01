"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { login } from "@/app/konto/actions";
import Input from "../ui/Input";
import { pulse } from "./AuthShell";
import { Alert, AuthTitle, Submit, Success } from "./ui";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [scope, animate] = useAnimate();
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <Success key="ok" title="Witaj ponownie." text="Otwieram Twój panel…" />
      ) : (
        <motion.div key="form" exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.4 }}>
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
                if (r?.done) {
                  pulse();
                  setDone(true);
                  setTimeout(() => router.push(r.done!), 1300);
                } else {
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
