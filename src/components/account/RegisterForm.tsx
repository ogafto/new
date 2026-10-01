"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { checkInvite, register } from "@/app/konto/actions";
import Input from "../ui/Input";
import { pulse } from "./AuthShell";
import VerifyStep from "./VerifyStep";
import { Alert, AuthTitle, Slots, Steps, Strength, Submit, type SlotState } from "./ui";

const ease = [0.16, 1, 0.3, 1] as const;
const slide = { initial: { opacity: 0, x: 40, filter: "blur(8px)" }, animate: { opacity: 1, x: 0, filter: "blur(0px)" }, exit: { opacity: 0, x: -40, filter: "blur(8px)" }, transition: { duration: 0.55, ease } };

/*
 * Rejestracja w trzech krokach:
 * 1) kod zaproszenia (8 znaków) — po sprawdzeniu monogram w tle robi obrót,
 * 2) imię, nazwisko, e-mail (z zaproszenia), telefon, hasło,
 * 3) weryfikacja adresu 6-cyfrowym kodem.
 */
export default function RegisterForm({ code: initial = "" }: { code?: string; email?: string }) {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState(initial.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
  const [state, setState] = useState<SlotState>("idle");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<{ email: string; name?: string | null } | null>(null);
  const [password, setPassword] = useState("");
  const [scope, animate] = useAnimate();
  const [pending, start] = useTransition();

  const check = (v: string) =>
    start(async () => {
      setState("checking");
      setError("");
      const f = new FormData();
      f.set("code", v);
      const [r] = await Promise.all([checkInvite(undefined, f), new Promise((res) => setTimeout(res, 700))]);
      if (r?.ok) {
        setState("ok");
        setInvite({ email: r.email!, name: r.name });
        pulse();
        setTimeout(() => setStep(1), 1100);
      } else {
        setState("error");
        setError(r?.error ?? "Nieprawidłowy kod.");
        setTimeout(() => setState("idle"), 650);
      }
    });

  // kod z linku w mailu → sprawdź od razu
  useEffect(() => {
    if (code.length !== 8) return;
    const t = setTimeout(() => check(code), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const first = invite?.name?.split(" ")[0];

  return (
    <>
      <Steps step={step} labels={["Kod", "Twoje dane", "Weryfikacja"]} />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="code" {...slide}>
            <AuthTitle kicker="Rejestracja" title="Masz zaproszenie?" text="Wpisz 8-znakowy kod z maila. Konto założysz tylko z kodem." />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.length === 8 && state === "idle") check(code);
              }}
            >
            <Slots length={8} split={4} value={code} onChange={setCode} onComplete={check} state={state} label="Kod zaproszenia" />
            <div className="mt-4">
              <Alert>{error}</Alert>
              <AnimatePresence>
                {state === "ok" && (
                  <motion.p className="flex items-center justify-center gap-2 text-[14px] text-accent-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                      <motion.path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
                    </svg>
                    Kod przyjęty
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-6">
              <Submit pending={pending || state === "checking"} className={code.length < 8 || state === "ok" ? "pointer-events-none opacity-40" : ""}>
                Sprawdź kod
              </Submit>
            </div>
            </form>
            <p className="mt-8 text-center text-[14px] text-muted">
              Masz już konto?{" "}
              <Link href="/konto/logowanie" className="text-ink underline decoration-white/30 underline-offset-4 hover:decoration-accent">
                Zaloguj się
              </Link>
            </p>
          </motion.div>
        )}

        {step === 1 && invite && (
          <motion.div key="details" {...slide}>
            <AuthTitle kicker="Kod przyjęty" title={first ? `Witaj, ${first}.` : "Witaj."} text="Jeszcze kilka danych i gotowe." />
            <form
              ref={scope}
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                start(async () => {
                  setError("");
                  f.set("code", code);
                  f.set("email", invite.email);
                  const r = await register(undefined, f);
                  if (r?.ok) {
                    pulse();
                    setStep(2);
                  } else {
                    setError(r?.error ?? "Nie udało się założyć konta.");
                    animate(scope.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.5 });
                  }
                });
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <Input name="first" label="Imię" required autoComplete="given-name" defaultValue={first ?? ""} />
                <Input name="last" label="Nazwisko" required autoComplete="family-name" />
              </div>
              <div className="relative">
                <div className="flex h-[60px] items-center justify-between rounded-2xl border border-line-2 bg-white/[0.02] px-4">
                  <span>
                    <span className="block text-[11.5px] text-dim">E-mail z zaproszenia</span>
                    <span className="block text-[15.5px]">{invite.email}</span>
                  </span>
                  <svg viewBox="0 0 24 24" className="size-4 text-dim" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <Input name="phone" label="Numer telefonu" type="tel" inputMode="tel" required autoComplete="tel" />
              <div>
                <Input name="password" label="Hasło" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={setPassword} />
                <Strength value={password} />
              </div>
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
              <Alert>{error}</Alert>
              <div className="pt-3">
                <Submit pending={pending}>Załóż konto</Submit>
              </div>
            </form>
          </motion.div>
        )}

        {step === 2 && invite && (
          <motion.div key="verify" {...slide}>
            <VerifyStep email={invite.email} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
