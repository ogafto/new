"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import ServiceIcon from "./ui/ServiceIcon";
import Button from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
const ease = [0.16, 1, 0.3, 1] as const;

const fieldCls =
  "peer w-full rounded-2xl border border-line-2 bg-bg/60 px-4 pt-6 pb-2.5 text-[16px] text-ink outline-none transition-all duration-300 placeholder:text-transparent hover:border-white/25 focus:border-accent focus:bg-bg focus:shadow-[0_0_0_4px_rgb(74_99_255/0.18)]";
const labelCls =
  "pointer-events-none absolute left-4 text-[15px] text-dim transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[12px] peer-focus:text-accent-2 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[12px]";

function Field({ name, label, type = "text", required, autoComplete }: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <label className="relative block">
      <input name={name} type={type} required={required} autoComplete={autoComplete} placeholder={label} className={`${fieldCls} h-[60px]`} />
      <span className={`${labelCls} top-1/2 -translate-y-1/2`}>{label}</span>
    </label>
  );
}

function Copy({ value, href, label }: { value: string; href: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-[14px] text-dim">{label}</span>
      <span className="flex items-center gap-4">
        <a href={href} className="link-u text-[16px]">
          {value}
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
          className="text-[13px] text-dim transition-colors hover:text-ink"
        >
          {copied ? "Skopiowano ✓" : "Kopiuj"}
        </button>
      </span>
    </div>
  );
}

export default function Contact() {
  const [service, setService] = useState<ServiceId | "other" | null>(null);
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
        body: JSON.stringify({ ...d, topic: chosen ? `${chosen.name} (od ${chosen.price} zł)` : service === "other" ? "Inne / do doradzenia" : "Nie wybrano" }),
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
    <section id="kontakt" className="mx-auto max-w-[1320px] px-5 py-28 sm:px-8 lg:py-36">
      <div className="mb-14 flex flex-col justify-between gap-8 lg:mb-20 lg:flex-row lg:items-end">
        <div>
          <FadeUp>
            <p className="eyebrow">Oferta i kontakt</p>
          </FadeUp>
          <Heading className="mt-6 text-[clamp(2.6rem,5.6vw,5.2rem)]" lines={["Zacznijmy", <span key="2" className="text-muted">Twój projekt.</span>]} />
        </div>
        <FadeUp delay={0.15} className="lg:max-w-[420px]">
          <p className="text-[17px] leading-relaxed text-muted">
            Wybierz usługę i opisz w kilku zdaniach, czego potrzebujesz. <span className="text-ink">Wycenę dostaniesz w 24 godziny — zanim cokolwiek zapłacisz.</span>
          </p>
        </FadeUp>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.12fr_1fr]">
        {/* usługi */}
        <div id="oferta">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Usługa">
            {services.map((s, i) => {
              const on = service === s.id;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setService(on ? null : s.id)}
                  className={`group relative flex min-h-[270px] flex-col rounded-[24px] border p-6 text-left transition-[border-color,background-color,transform] duration-500 ease-out-expo hover:-translate-y-1 ${
                    on ? "border-accent bg-accent/[0.08]" : "border-line bg-surface hover:border-line-2"
                  }`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.8, ease }}
                >
                  <span className="flex items-start justify-between">
                    <span className={`grid size-14 place-items-center rounded-2xl transition-colors ${on ? "bg-accent text-white" : "bg-surface-2 text-ink"}`}>
                      <ServiceIcon id={s.id} active={on} className="size-8" />
                    </span>
                    <span className={`grid size-6 place-items-center rounded-full border transition-all duration-300 ${on ? "scale-100 border-accent bg-accent" : "scale-90 border-line-2"}`} aria-hidden>
                      <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-opacity ${on ? "opacity-100" : "opacity-0"}`}>
                        <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                  <span className="mt-auto block pt-8">
                    <span className="h-display block text-[24px] tracking-[-0.02em]">{s.name}</span>
                    <span className="mt-2 block text-[14px] leading-relaxed text-muted">{s.description}</span>
                  </span>
                  <span className="mt-5 flex items-end justify-between border-t border-line pt-4">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[14px] text-dim">od</span>
                      <span className={`h-display text-[30px] tracking-[-0.03em] transition-colors ${on ? "text-accent-2" : ""}`}>{s.price} zł</span>
                    </span>
                    <span className="pb-1 text-[13px] text-dim">{s.time}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setService(service === "other" ? null : "other")}
            aria-pressed={service === "other"}
            className={`mt-3 flex h-14 w-full items-center justify-between rounded-[18px] border px-6 text-[15px] transition-colors ${
              service === "other" ? "border-accent bg-accent/[0.08] text-ink" : "border-line text-muted hover:border-line-2 hover:text-ink"
            }`}
          >
            Nie wiesz, co wybrać? Doradzę.
            <span className={`transition-transform duration-500 ${service === "other" ? "rotate-45" : ""}`}>+</span>
          </button>
        </div>

        {/* formularz */}
        <motion.div
          className="rounded-[28px] border border-line bg-surface p-6 sm:p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1, ease }}
        >
          <AnimatePresence mode="wait">
            {status.state === "sent" ? (
              <motion.div key="ok" className="flex min-h-[520px] flex-col items-center justify-center text-center" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <svg viewBox="0 0 72 72" className="size-[72px]" fill="none" aria-hidden>
                  <motion.circle cx="36" cy="36" r="34" stroke="var(--color-accent)" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease }} />
                  <motion.path d="M23 37l9 9 17-19" stroke="var(--color-accent-2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.5, ease }} />
                </svg>
                <h3 className="h-display mt-7 text-[34px]">Dziękuję{sender ? `, ${sender}` : ""}!</h3>
                <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-muted">Wiadomość dotarła. Odezwę się w ciągu 24 godzin z pytaniami albo wyceną.</p>
                <button type="button" onClick={() => setStatus({ state: "idle" })} className="link-u mt-8 text-[15px]">
                  Wyślij kolejną wiadomość
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} className="space-y-3" exit={{ opacity: 0 }}>
                <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-bg/60 px-4 py-3.5">
                  <span className="text-[14px] text-dim">Usługa</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={service ?? "none"}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`text-right text-[15px] ${service ? "text-ink" : "text-muted"}`}
                    >
                      {chosen ? (
                        <>
                          {chosen.name} <span className="text-accent-2">· od {chosen.price} zł</span>
                        </>
                      ) : service === "other" ? (
                        "Do doradzenia"
                      ) : (
                        "Wybierz z listy"
                      )}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="name" label="Imię" required autoComplete="name" />
                  <Field name="email" label="E-mail" type="email" required autoComplete="email" />
                </div>
                <Field name="phone" label="Telefon (opcjonalnie)" type="tel" autoComplete="tel" />
                <label className="relative block">
                  <textarea name="message" required minLength={10} rows={5} placeholder="Wiadomość" className={`${fieldCls} resize-none pt-7`} />
                  <span className={`${labelCls} top-4`}>Czym się zajmujesz i czego potrzebujesz?</span>
                </label>
                <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                <label className="flex cursor-pointer items-start gap-3 pt-2 text-[13px] leading-relaxed text-muted">
                  <input type="checkbox" required className="peer sr-only" />
                  <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-md border border-line-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    Akceptuję{" "}
                    <Link href="/polityka-prywatnosci" className="text-ink underline decoration-white/30 underline-offset-4 hover:decoration-white">
                      politykę prywatności
                    </Link>{" "}
                    i zgadzam się na kontakt w sprawie zapytania.
                  </span>
                </label>

                <AnimatePresence>
                  {status.state === "error" && (
                    <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl bg-red-500/10 px-4 py-3 text-[14px] text-red-300">
                      {status.message} Napisz bezpośrednio:{" "}
                      <a href={`mailto:${site.email}`} className="underline">
                        {site.email}
                      </a>
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button type="submit" disabled={status.state === "sending"} className="mt-3 h-14 w-full">
                  {status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}
                </Button>

                <div className="mt-6 divide-y divide-line border-t border-line">
                  <Copy label="E-mail" value={site.email} href={`mailto:${site.email}`} />
                  <Copy label="Telefon" value={site.phone} href={`tel:${site.phone.replace(/\s/g, "")}`} />
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
