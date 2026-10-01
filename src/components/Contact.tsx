"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import Button from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
const ease = [0.16, 1, 0.3, 1] as const;

function Field({ name, label, type = "text", required, autoComplete, area }: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string; area?: boolean }) {
  const cls =
    "peer w-full border-b border-line-2 bg-transparent pt-7 pb-3 text-[18px] text-ink outline-none transition-colors placeholder:text-transparent focus:border-accent";
  return (
    <label className="relative block">
      {area ? (
        <textarea name={name} required={required} minLength={10} rows={4} placeholder={label} className={`${cls} resize-none`} />
      ) : (
        <input name={name} type={type} required={required} autoComplete={autoComplete} placeholder={label} className={cls} />
      )}
      <span className="pointer-events-none absolute top-7 left-0 text-[17px] text-dim transition-all duration-300 ease-out-expo peer-focus:top-1 peer-focus:text-[12px] peer-focus:text-accent-2 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[12px]">
        {label}
      </span>
    </label>
  );
}

export default function Contact() {
  const [service, setService] = useState<ServiceId | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");

  useEffect(() => {
    const on = (e: Event) => setService((e as CustomEvent<ServiceId>).detail);
    window.addEventListener("afto:service", on);
    return () => window.removeEventListener("afto:service", on);
  }, []);

  const chosen = services.find((s) => s.id === service);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, topic: chosen ? `${chosen.name} (od ${chosen.price} zł)` : "Nie wybrano usługi" }),
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
    <section id="kontakt" className="relative mx-auto max-w-[1400px] px-5 py-32 sm:px-10 lg:py-44">
      <div className="mb-16 lg:mb-24">
        <FadeUp>
          <p className="kicker">Kontakt</p>
        </FadeUp>
        <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.6rem)]" lines={["Porozmawiajmy", <span key="2" className="text-muted">o Twoim projekcie</span>]} />
      </div>

      <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        {/* usługi */}
        <div>
          <p className="mb-6 text-[14px] text-dim">01 — Wybierz usługę</p>
          <ul role="radiogroup" aria-label="Usługa" className="border-t border-line">
            {services.map((s, i) => {
              const on = service === s.id;
              return (
                <motion.li key={s.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.9, ease }}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setService(on ? null : s.id)}
                    className="group relative grid w-full grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 border-b border-line py-7 text-left"
                  >
                    {/* podświetlenie wybranej usługi */}
                    <span className={`absolute bottom-[-1px] left-0 h-px w-full origin-left bg-accent transition-transform duration-700 ease-out-expo ${on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-[0.25]"}`} />
                    <span className={`pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_100%,rgb(139_108_255/0.12),transparent)] transition-opacity duration-700 ${on ? "opacity-100" : "opacity-0"}`} />
                    <span className="relative flex items-center gap-5">
                      <span className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${on ? "border-accent" : "border-line-2 group-hover:border-white/40"}`}>
                        <span className={`size-2.5 rounded-full bg-accent transition-transform duration-300 ${on ? "scale-100" : "scale-0"}`} />
                      </span>
                      <span className="text-[24px] font-light tracking-[-0.03em] transition-transform duration-500 ease-out-expo group-hover:translate-x-1 sm:text-[28px]">{s.name}</span>
                    </span>
                    <span className="relative text-right">
                      <span className="text-[13px] text-dim">od </span>
                      <span className={`text-[22px] font-light tracking-[-0.02em] transition-colors ${on ? "text-accent-2" : ""}`}>{s.price} zł</span>
                    </span>
                    <span className="relative col-span-2 pl-10 text-[15px] text-muted">{s.description}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
          <p className="mt-6 text-[14px] text-dim">Podane ceny są minimalne — końcowa wycena zależy od zakresu.</p>
        </div>

        {/* formularz */}
        <div>
          <p className="mb-6 text-[14px] text-dim">02 — Opowiedz o projekcie</p>
          <AnimatePresence mode="wait">
            {status.state === "sent" ? (
              <motion.div key="ok" className="flex min-h-[460px] flex-col justify-center border-t border-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden>
                  <motion.circle cx="32" cy="32" r="30" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
                  <motion.path d="M20 33l8 8 16-17" stroke="var(--color-accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }} />
                </svg>
                <h3 className="h-display mt-8 text-[44px]">Dziękuję{sender ? `, ${sender}` : ""}.</h3>
                <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">Wiadomość dotarła. Wkrótce się odezwę.</p>
                <button type="button" onClick={() => setStatus({ state: "idle" })} className="link-u mt-8 self-start text-[15px]">
                  Napisz ponownie
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} className="space-y-2 border-t border-line" exit={{ opacity: 0 }}>
                <div className="flex items-baseline justify-between gap-4 border-b border-line py-5">
                  <span className="text-[14px] text-dim">Usługa</span>
                  <AnimatePresence mode="wait">
                    <motion.span key={service ?? "none"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className={`text-[16px] ${chosen ? "text-ink" : "text-muted"}`}>
                      {chosen ? chosen.name : "—"}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <Field name="name" label="Imię" required autoComplete="name" />
                  <Field name="email" label="E-mail" type="email" required autoComplete="email" />
                </div>
                <Field name="phone" label="Telefon" type="tel" autoComplete="tel" />
                <Field name="message" label="Wiadomość" required area />
                <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                <label className="flex cursor-pointer items-start gap-3 pt-6 text-[13px] leading-relaxed text-muted">
                  <input type="checkbox" required className="peer sr-only" />
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border border-line-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                      <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    Akceptuję{" "}
                    <Link href="/polityka-prywatnosci" className="text-ink underline decoration-white/30 underline-offset-4 hover:decoration-white">
                      politykę prywatności
                    </Link>
                    .
                  </span>
                </label>

                <AnimatePresence>
                  {status.state === "error" && (
                    <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-4 text-[14px] text-red-300">
                      {status.message} Napisz bezpośrednio:{" "}
                      <a href={`mailto:${site.email}`} className="underline">
                        {site.email}
                      </a>
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center justify-between gap-6 pt-8">
                  <Button type="submit" disabled={status.state === "sending"}>
                    {status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}
                  </Button>
                  <a href={`mailto:${site.email}`} className="link-u text-[15px] text-muted hover:text-ink">
                    {site.email}
                  </a>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
