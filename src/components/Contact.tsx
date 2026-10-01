"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import ServiceIcon from "./ui/ServiceIcon";
import { LineButton, Section } from "./ui/Line";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
const ease = [0.76, 0, 0.24, 1] as const;

function Field({ name, label, type = "text", required, autoComplete, textarea }: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string; textarea?: boolean }) {
  const cls = "w-full bg-transparent pt-2 pb-3 text-[19px] text-ink outline-none placeholder:text-dim";
  return (
    <label className="group relative block border-b border-line-strong transition-colors focus-within:border-accent">
      <span className="label text-muted transition-colors group-focus-within:text-accent">
        {label}
        {required && " *"}
      </span>
      {textarea ? (
        <textarea name={name} required={required} minLength={10} rows={4} className={`${cls} resize-none`} placeholder="Czym się zajmujesz i czego potrzebujesz?" />
      ) : (
        <input name={name} type={type} required={required} autoComplete={autoComplete} className={cls} />
      )}
    </label>
  );
}

function CopyLink({ value, href }: { value: string; href: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex items-baseline justify-between gap-4">
      <a href={href} className="link-u text-[17px]">
        {value}
      </a>
      <button
        type="button"
        className="label text-dim hover:text-ink"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
      >
        {copied ? "Skopiowano" : "Kopiuj"}
      </button>
    </span>
  );
}

export default function Contact() {
  const [service, setService] = useState<ServiceId | "other" | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");

  // "Zamów podobny projekt" z panelu pracy zaznacza usługę
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
        body: JSON.stringify({ ...d, topic: chosen ? `${chosen.name} (od ${chosen.price} zł)` : "Inne / nie wiem jeszcze" }),
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
    <Section id="kontakt" index="04" label="Kontakt">
      <div className="grid lg:grid-cols-4">
        <div className="border-line p-4 sm:p-6 lg:col-span-3 lg:border-r">
          <motion.h2
            className="display text-[clamp(3rem,8vw,7.5rem)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, ease }}
          >
            Wybierz usługę.
            <br />
            <span className="text-outline">Resztę biorę</span> na siebie.
          </motion.h2>
        </div>
        <div className="flex items-end border-t border-line p-4 sm:p-6 lg:border-t-0">
          <p className="text-[17px] leading-relaxed text-muted">
            Ceny są minimalne — <span className="text-ink">dokładną wycenę dostajesz po krótkiej rozmowie, zanim cokolwiek zapłacisz.</span>
          </p>
        </div>
      </div>

      <div className="grid border-t border-line lg:grid-cols-12">
        {/* usługi */}
        <div className="lg:col-span-7">
          <div className="grid gap-px bg-line sm:grid-cols-2" role="radiogroup" aria-label="Usługa">
            {services.map((s) => {
              const on = service === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setService(on ? null : s.id)}
                  className={`group relative flex min-h-[290px] flex-col bg-bg p-4 text-left transition-colors sm:p-6 ${on ? "bg-[#140c08]" : "hover:bg-bg-2"}`}
                >
                  {on && <motion.span layoutId="svc" className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_0_1px_var(--color-accent)]" transition={{ duration: 0.45, ease }} />}
                  <span className="flex items-start justify-between">
                    <span className={`transition-colors ${on ? "text-accent" : "text-ink"}`}>
                      <ServiceIcon id={s.id} active={on} />
                    </span>
                    <span className={`grid size-5 place-items-center border transition-colors ${on ? "border-accent bg-accent text-bg" : "border-line-strong"}`} aria-hidden>
                      {on && (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <path d="M1.5 5.2l2.3 2.3L8.5 2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="mt-auto block pt-10">
                    <span className="block font-display text-[26px] leading-tight font-semibold tracking-[-0.01em] uppercase [font-stretch:85%]">{s.name}</span>
                    <span className="mt-2 block max-w-[34ch] text-[15px] leading-relaxed text-muted">{s.description}</span>
                  </span>
                  <span className="mt-6 flex items-end justify-between border-t border-line pt-4">
                    <span>
                      <span className="label text-dim">od </span>
                      <span className={`display text-[2.6rem] transition-colors ${on ? "text-accent" : ""}`}>{s.price} zł</span>
                    </span>
                    <span className="label pb-1.5 text-muted">{s.time}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setService(service === "other" ? null : "other")}
            className={`label flex h-14 w-full items-center justify-between border-t border-line px-4 transition-colors sm:px-6 ${service === "other" ? "text-accent" : "text-muted hover:text-ink"}`}
            aria-pressed={service === "other"}
          >
            Coś innego / nie wiem jeszcze — doradzę
            <span>{service === "other" ? "✓" : "+"}</span>
          </button>
        </div>

        {/* formularz */}
        <div className="border-t border-line p-4 sm:p-6 lg:col-span-5 lg:border-t-0 lg:border-l lg:p-8">
          <AnimatePresence mode="wait">
            {status.state === "sent" ? (
              <motion.div key="ok" className="flex min-h-[460px] flex-col justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <svg viewBox="0 0 80 80" className="size-20 text-accent" fill="none" aria-hidden>
                  <motion.rect x="1" y="1" width="78" height="78" stroke="currentColor" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease }} />
                  <motion.path d="M22 41l12 12 25-27" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.5, ease }} />
                </svg>
                <h3 className="display mt-8 text-[3.5rem]">Dzięki{sender ? `, ${sender}` : ""}!</h3>
                <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">Wiadomość dotarła. Odezwę się w ciągu 24 godzin z pytaniami albo wyceną.</p>
                <button type="button" onClick={() => setStatus({ state: "idle" })} className="label link-u mt-8 self-start text-ink">
                  Wyślij kolejną wiadomość
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-baseline justify-between border-b border-line pb-4">
                  <span className="label text-dim">Usługa</span>
                  <span className={`text-right text-[15px] ${service ? "text-accent" : "text-muted"}`}>
                    {chosen ? `${chosen.name} · od ${chosen.price} zł` : service === "other" ? "Coś innego — doradzę" : "← wybierz z listy"}
                  </span>
                </div>
                <div className="grid gap-7 sm:grid-cols-2">
                  <Field name="name" label="Imię" required autoComplete="name" />
                  <Field name="email" label="E-mail" type="email" required autoComplete="email" />
                </div>
                <Field name="phone" label="Telefon (opcjonalnie)" type="tel" autoComplete="tel" />
                <Field name="message" label="Wiadomość" required textarea />
                <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-muted">
                  <input type="checkbox" required className="peer sr-only" />
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center border border-line-strong transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-accent [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                    <svg width="9" height="9" viewBox="0 0 10 10" className="text-bg" aria-hidden>
                      <path d="M1.5 5.2l2.3 2.3L8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
                    </svg>
                  </span>
                  <span>
                    Akceptuję{" "}
                    <Link href="/polityka-prywatnosci" className="text-ink underline underline-offset-4">
                      politykę prywatności
                    </Link>{" "}
                    i zgadzam się na kontakt w sprawie zapytania.
                  </span>
                </label>

                {status.state === "error" && (
                  <p role="alert" className="border border-accent/50 px-4 py-3 text-[14px] text-accent">
                    {status.message} Napisz bezpośrednio:{" "}
                    <a href={`mailto:${site.email}`} className="underline">
                      {site.email}
                    </a>
                  </p>
                )}

                <LineButton type="submit" disabled={status.state === "sending"} className="h-16 w-full text-[17px]">
                  {status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}
                </LineButton>

                <div className="space-y-3 border-t border-line pt-6">
                  <CopyLink value={site.email} href={`mailto:${site.email}`} />
                  <CopyLink value={site.phone} href={`tel:${site.phone.replace(/\s/g, "")}`} />
                  <p className="label text-dim">{site.responseTime}</p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
