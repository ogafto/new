"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { logout, resend, verify } from "@/app/konto/actions";
import { pulse, useHandoff } from "./AuthShell";
import { Alert, AuthTitle, Slots, Success, type SlotState } from "./ui";

// Krok weryfikacji e-maila: 6 cyfr z maila → konto aktywne
export default function VerifyStep({ email, initialError }: { email: string; initialError?: string }) {
  const router = useRouter();
  const handoff = useHandoff();
  const [code, setCode] = useState("");
  const [state, setState] = useState<SlotState>("idle");
  const [error, setError] = useState(initialError ?? "");
  const [info, setInfo] = useState("");
  const [done, setDone] = useState(false);
  const [, start] = useTransition();
  const [sending, startSend] = useTransition();

  const check = (v: string) =>
    start(async () => {
      setState("checking");
      setError("");
      const f = new FormData();
      f.set("code", v);
      const r = await verify(undefined, f);
      if (r?.done && !r.error) {
        setState("ok");
        pulse();
        setTimeout(() => setDone(true), 700);
        handoff(r.done!, 2100);
      } else {
        setState("error");
        setError(r?.error ?? "Nieprawidłowy kod.");
        if (r?.done) setTimeout(() => router.push(r.done!), 1500);
        setTimeout(() => {
          setState("idle");
          setCode("");
        }, 700);
      }
    });

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {done ? (
        <Success key="ok" title="Witamy w afto." text="Konto gotowe — otwieram Twój panel." bar={1.2} />
      ) : (
        <motion.div key="verify" exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}>
          <AuthTitle
            kicker="Ostatni krok"
            title="Sprawdź skrzynkę"
            text={
              <>
                Wysłałem 6-cyfrowy kod na <span className="text-ink">{email}</span>.
              </>
            }
          />
          <Slots length={6} split={3} numeric value={code} onChange={setCode} onComplete={check} state={state} label="Kod weryfikacyjny" />
          <div className="mt-4 min-h-[8px]">
            <Alert>{error}</Alert>
            <Alert tone="ok">{info}</Alert>
          </div>
          <div className="mt-6 flex items-center justify-between text-[13.5px] text-muted">
            <button
              type="button"
              disabled={sending}
              onClick={() =>
                startSend(async () => {
                  setInfo("");
                  setError("");
                  const r = await resend();
                  if (r?.ok) setInfo(r.ok);
                  else setError(r?.error ?? "");
                })
              }
              className="link-u text-ink disabled:opacity-50"
            >
              {sending ? "Wysyłanie…" : "Wyślij kod ponownie"}
            </button>
            <form action={logout}>
              <button type="submit" className="link-u hover:text-ink">
                Wyloguj
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
