"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { planNames, site } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";
import Button from "./ui/Button";
import CopyEmail from "./ui/CopyEmail";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

const ease = [0.16, 1, 0.3, 1] as const;

const input =
  "peer w-full rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 pt-6 pb-2 text-[15px] text-ink outline-none transition-all duration-300 placeholder:text-transparent hover:border-white/[0.14] focus:border-sel/70 focus:bg-sel/[0.04] focus:shadow-[0_0_0_4px_rgb(13_153_255/0.12)]";
const floating =
  "pointer-events-none absolute left-4 text-[15px] text-muted transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-sel peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]";

function Field({ name, label, type = "text", required, autoComplete }: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <label className="relative block">
      <input name={name} type={type} required={required} autoComplete={autoComplete} placeholder={label} className={`${input} h-14`} />
      <span className={`${floating} top-1/2 -translate-y-1/2`}>{label}</span>
    </label>
  );
}

function SuccessCheck() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
      <motion.circle
        cx="36"
        cy="36"
        r="33"
        fill="rgb(10 207 131 / 0.1)"
        stroke="#0acf83"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease }}
      />
      <motion.path
        d="M23 37l9 9 17-19"
        fill="none"
        stroke="#0acf83"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease }}
      />
    </svg>
  );
}

export default function Contact() {
  const [plan, setPlan] = useState(planNames[1]);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");

  // Kliknięcie "Wybieram …" w cenniku zaznacza pakiet w formularzu.
  useEffect(() => {
    const onPlan = (e: Event) => setPlan((e as CustomEvent<string>).detail);
    window.addEventListener("afto:plan", onPlan);
    return () => window.removeEventListener("afto:plan", onPlan);
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, plan }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Nie udało się wysłać wiadomości.");
      setSender(d.name?.split(" ")[0] ?? "");
      setStatus({ state: "sent" });
      form.reset();
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Nie udało się wysłać wiadomości." });
    }
  };

  return (
    <section id="kontakt" className="relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 right-0 h-[700px] w-[700px] translate-x-1/3 -translate-y-1/2 rounded-full bg-comp/10 blur-[140px]" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 py-32 sm:px-5 sm:py-40 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="flex flex-col">
          <SectionHeader
            index="05"
            label="Kontakt"
            title="Zróbmy stronę, która"
            accent="sprzedaje."
            lead="Napisz kilka zdań o swoim biznesie. Odpowiem z konkretną wyceną i terminem — bez zobowiązań."
          />

          <div className="mt-12 space-y-3">
            <CopyEmail />
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="hairline surface group flex items-center justify-between rounded-2xl px-5 py-4 transition-colors hover:bg-white/[0.04]"
            >
              <span>
                <span className="block font-mono text-[11px] text-dim">Telefon</span>
                <span className="text-[17px]">{site.phone}</span>
              </span>
              <span className="text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:text-ink">→</span>
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-muted">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-fig-green opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-fig-green" />
            </span>
            {site.responseTime} · pierwsza konsultacja gratis
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, ease }}
        >
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-muted">
            <span>
              # Formularz <span className="text-dim">/ Nowe zapytanie</span>
            </span>
            <span className="text-dim">Auto layout</span>
          </div>
          <div className="beam hairline relative rounded-[28px] bg-surface/80 p-5 shadow-[0_50px_100px_-40px_rgb(0_0_0/0.9)] backdrop-blur-xl sm:p-8">
            <AnimatePresence mode="wait">
              {status.state === "sent" ? (
                <motion.div
                  key="ok"
                  className="flex min-h-[520px] flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease }}
                >
                  <SuccessCheck />
                  <h3 className="mt-6 font-display text-3xl font-medium tracking-[-0.04em]">Dziękuję{sender ? `, ${sender}` : ""}!</h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted">
                    Wiadomość dotarła. Odezwę się w ciągu 24h z wyceną i propozycją terminu.
                  </p>
                  <div className="mt-8">
                    <Button variant="ghost" onClick={() => setStatus({ state: "idle" })}>
                      Wyślij kolejne zapytanie
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} className="space-y-4" exit={{ opacity: 0, y: -10 }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field name="name" label="Imię" required autoComplete="name" />
                    <Field name="email" label="E-mail" type="email" required autoComplete="email" />
                  </div>
                  <Field name="phone" label="Telefon (opcjonalnie)" type="tel" autoComplete="tel" />

                  <div className="pt-1">
                    <p className="mb-2.5 text-[13px] text-muted">Pakiet</p>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pakiet">
                      {planNames.map((o) => (
                        <button
                          key={o}
                          type="button"
                          role="radio"
                          aria-checked={plan === o}
                          onClick={() => setPlan(o)}
                          className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${plan === o ? "text-white" : "text-muted hover:text-ink"}`}
                        >
                          {plan === o && (
                            <motion.span
                              layoutId="plan-chip"
                              className="absolute inset-0 rounded-full bg-sel/20 shadow-[inset_0_0_0_1px_rgb(13_153_255/0.7)]"
                              transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            />
                          )}
                          {plan !== o && <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09)]" />}
                          <span className="relative">{o}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="relative block">
                    <textarea name="message" required minLength={10} rows={5} placeholder="Wiadomość" className={`${input} resize-none pt-7`} />
                    <span className={`${floating} top-4`}>Czym się zajmujesz i czego potrzebujesz?</span>
                  </label>

                  {/* honeypot */}
                  <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                  <label className="flex cursor-pointer items-start gap-3 pt-1 text-[13px] leading-relaxed text-muted">
                    <input type="checkbox" required className="peer sr-only" />
                    <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-md shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] transition-colors peer-checked:bg-sel peer-checked:shadow-none peer-focus-visible:ring-2 peer-focus-visible:ring-sel/60 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                        <path d="M2.2 5.2l1.8 1.8 3.8-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>
                      Akceptuję{" "}
                      <Link href="/polityka-prywatnosci" className="text-ink underline decoration-white/30 underline-offset-4 hover:decoration-sel">
                        politykę prywatności
                      </Link>{" "}
                      i zgadzam się na kontakt w sprawie zapytania.
                    </span>
                  </label>

                  <AnimatePresence>
                    {status.state === "error" && (
                      <motion.p
                        className="rounded-xl bg-fig-red/10 px-4 py-3 text-[13px] text-fig-coral"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        role="alert"
                      >
                        {status.message} Napisz bezpośrednio:{" "}
                        <a href={`mailto:${site.email}`} className="underline underline-offset-2">
                          {site.email}
                        </a>
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Button type="submit" size="lg" arrow disabled={status.state === "sending"} className="mt-2 w-full justify-between pl-6">
                    {status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
