"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import { Arrow } from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
const ease = [0.16, 1, 0.3, 1] as const;

function Field({ name, label, type = "text", required, autoComplete, area }: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string; area?: boolean }) {
  const cls = "peer w-full border-b border-line-2 bg-transparent pt-7 pb-3 text-[18px] text-ink outline-none transition-colors placeholder:text-transparent focus:border-accent";
  return (
    <label className="relative block">
      {area ? (
        <textarea name={name} required={required} minLength={10} rows={3} placeholder={label} className={`${cls} resize-none`} />
      ) : (
        <input name={name} type={type} required={required} autoComplete={autoComplete} placeholder={label} className={cls} />
      )}
      <span className="pointer-events-none absolute top-7 left-0 text-[17px] text-dim transition-all duration-300 ease-out-expo peer-focus:top-1 peer-focus:text-[12px] peer-focus:text-accent-2 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[12px]">
        {label}
      </span>
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-full border py-2.5 pr-5 pl-3 text-left text-[15px] transition-all duration-300 ${
        on ? "border-accent bg-accent/15 text-ink" : "border-line-2 text-muted hover:border-white/30 hover:text-ink"
      }`}
    >
      <span className={`grid size-5 place-items-center rounded-full border transition-all duration-300 ${on ? "border-accent bg-accent" : "border-line-2"}`}>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform duration-300 ${on ? "scale-100" : "scale-0"}`} aria-hidden>
          <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </button>
  );
}

export default function Contact() {
  const [picked, setPicked] = useState<ServiceId[]>([]);
  const [other, setOther] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");

  // wybór z podstrony realizacji ("Zamów podobny projekt")
  useEffect(() => {
    const add = (id: ServiceId) => setPicked((p) => (p.includes(id) ? p : [...p, id]));
    const on = (e: Event) => add((e as CustomEvent<ServiceId>).detail);
    window.addEventListener("afto:service", on);
    const t = setTimeout(() => {
      try {
        const s = sessionStorage.getItem("afto:service") as ServiceId | null;
        if (s) {
          add(s);
          sessionStorage.removeItem("afto:service");
        }
      } catch {}
    }, 0);
    return () => {
      window.removeEventListener("afto:service", on);
      clearTimeout(t);
    };
  }, []);

  const toggle = (id: ServiceId) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const topic = [
      ...services.filter((s) => picked.includes(s.id)).map((s) => `${s.name} (od ${s.price} zł)`),
      ...(other ? [`Inne: ${d.other || "—"}`] : []),
    ].join(", ");
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, topic: topic || "Nie wybrano" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Nie udało się wysłać wiadomości.");
      setSender(d.name?.split(" ")[0] ?? "");
      setStatus({ state: "sent" });
      form.reset();
      setPicked([]);
      setOther(false);
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Nie udało się wysłać wiadomości." });
    }
  };

  return (
    <section id="kontakt" className="relative mx-auto max-w-[1400px] px-5 py-32 sm:px-10 lg:py-40">
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="flex flex-col">
          <FadeUp>
            <p className="kicker">Kontakt</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.8rem,6vw,5.8rem)]" lines={["Porozmawiajmy", <span key="2" className="text-muted">o Twoim</span>, <span key="3" className="text-muted">projekcie</span>]} />
          <FadeUp delay={0.15} className="mt-10 lg:mt-auto">
            <p className="text-[14px] text-dim">Wolisz e-mail?</p>
            <a href={`mailto:${site.email}`} className="link-u mt-2 inline-block text-[clamp(1.3rem,2.2vw,1.9rem)] tracking-[-0.02em]">
              {site.email}
            </a>
            <div className="mt-6 flex gap-6 text-[15px] text-muted">
              {site.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link-u hover:text-ink">
                  {s.label}
                </a>
              ))}
            </div>
          </FadeUp>
        </div>

        <motion.div
          className="edge relative overflow-hidden rounded-[28px] bg-surface p-6 sm:p-10"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease }}
        >
          <div className="pointer-events-none absolute -top-40 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" aria-hidden />

          <AnimatePresence mode="wait">
            {status.state === "sent" ? (
              <motion.div key="ok" className="relative flex min-h-[520px] flex-col items-center justify-center text-center" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden>
                  <motion.circle cx="32" cy="32" r="30" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
                  <motion.path d="M20 33l8 8 16-17" stroke="var(--color-accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }} />
                </svg>
                <h3 className="h-display mt-8 text-[44px]">Dziękuję{sender ? `, ${sender}` : ""}.</h3>
                <p className="mt-3 max-w-sm text-[17px] text-muted">Wiadomość dotarła — wkrótce się odezwę.</p>
                <button type="button" onClick={() => setStatus({ state: "idle" })} className="link-u mt-8 text-[15px]">
                  Napisz ponownie
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} className="relative" exit={{ opacity: 0 }}>
                <p className="text-[15px] text-ink">Czego potrzebujesz?</p>
                <p className="mt-1 text-[13px] text-dim">Możesz wybrać kilka. Ceny są minimalne.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {services.map((s) => (
                    <Chip key={s.id} on={picked.includes(s.id)} onClick={() => toggle(s.id)}>
                      {s.name}
                      <span className="text-[13px] opacity-60">od {s.price} zł</span>
                    </Chip>
                  ))}
                  <Chip on={other} onClick={() => setOther((o) => !o)}>
                    Coś innego
                  </Chip>
                </div>

                <AnimatePresence initial={false}>
                  {other && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                      <div className="pt-2">
                        <Field name="other" label="Czego potrzebujesz? (np. katalog PDF, landing do kampanii)" required />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
                  <Field name="name" label="Imię" required autoComplete="name" />
                  <Field name="email" label="E-mail" type="email" required autoComplete="email" />
                </div>
                <Field name="message" label="Opowiedz krótko o projekcie" required area />
                <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                <label className="mt-6 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-muted">
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
                      {status.message} Napisz bezpośrednio: <a href={`mailto:${site.email}`} className="underline">{site.email}</a>
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* CTA: fiolet wypełnia przycisk od lewej */}
                <button
                  type="submit"
                  disabled={status.state === "sending"}
                  className="group relative mt-8 flex h-[68px] w-full items-center justify-between overflow-hidden rounded-full bg-ink pr-2 pl-8 text-[17px] font-medium text-bg disabled:opacity-60"
                >
                  <span className="absolute inset-0 origin-left scale-x-0 rounded-full bg-accent transition-transform duration-700 ease-out-expo group-hover:scale-x-100" />
                  <span className="relative transition-colors duration-500 group-hover:text-white">{status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}</span>
                  <span className="relative grid size-[52px] place-items-center overflow-hidden rounded-full bg-bg text-ink transition-transform duration-700 ease-out-expo group-hover:rotate-45">
                    <Arrow className="size-4" />
                  </span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
