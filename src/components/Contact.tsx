"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import { Arrow } from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";
import Input from "./ui/Input";

/*
 * Kontakt jako krótka rozmowa w trzech krokach: usługa → szczegóły → dane kontaktowe.
 * Pod kartą — bezpośrednie kanały (e-mail, telefon, Discord).
 */

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
const ease = [0.16, 1, 0.3, 1] as const;
const discord = site.socials.find((s) => s.label === "Discord")?.href ?? "https://discord.com/";

const budgets = ["do 1 000 zł", "1–3 tys. zł", "3–6 tys. zł", "6 tys. zł +", "Jeszcze nie wiem"];
const timelines = ["Jak najszybciej", "W ciągu miesiąca", "Bez pośpiechu"];
const stepNames = ["Usługa", "Szczegóły", "Kontakt"];

const serviceIcons: Record<ServiceId, string> = {
  www: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5zM3 9h18M6 7h.01M8.5 7h.01",
  shop: "M5 8h14l-1.2 11.1a1 1 0 01-1 .9H7.2a1 1 0 01-1-.9zM9 8V6.5a3 3 0 016 0V8",
  brand: "M12 3l2.6 5.6L20.5 9l-4.4 4 1.1 6L12 16.2 6.8 19l1.1-6-4.4-4 5.9-.4z",
  ui: "M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z",
};

const channels = [
  { label: "E-mail", value: site.email, href: `mailto:${site.email}`, icon: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5zM3.5 6l8.5 7 8.5-7" },
  { label: "Telefon", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, icon: "M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 005.6 5.6l1.4-2.3L19.5 15v3.5a1.5 1.5 0 01-1.6 1.5C10.6 19.5 4.5 13.4 4 6.1A1.5 1.5 0 015 4z" },
  {
    label: "Discord",
    value: "Napisz na Discordzie",
    href: discord,
    ext: true,
    icon: "M8.5 7.5c2.3-.7 4.7-.7 7 0M7 17c3.3 1.3 6.7 1.3 10 0M8.5 7.5L7.5 6C5.8 6.4 4.6 7 3.5 8 2.4 10.6 2 13.3 2.4 16c1.2 1 2.6 1.6 4 2l1-1.8M15.5 7.5l1-1.5c1.7.4 2.9 1 4 2 1.1 2.6 1.5 5.3 1.1 8-1.2 1-2.6 1.6-4 2l-1-1.8M9.3 13.2a.9.9 0 100-1.8.9.9 0 000 1.8zM14.7 13.2a.9.9 0 100-1.8.9.9 0 000 1.8z",
  },
];

function Check({ on }: { on: boolean }) {
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full border transition-all duration-300 ${on ? "border-accent bg-accent" : "border-line-2"}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform duration-300 ease-out-expo ${on ? "scale-100" : "scale-0"}`} aria-hidden>
        <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Group({ label, options, value, onChange, id }: { label: string; options: string[]; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div>
      <p className="mb-3 text-[14px] text-muted">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(value === o ? "" : o)}
            className={`relative h-11 rounded-full px-4 text-[14px] transition-colors duration-300 ${value === o ? "text-white" : "text-muted hover:text-ink"}`}
          >
            {value === o ? (
              <motion.span layoutId={`pick-${id}`} className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            ) : (
              <span className="absolute inset-0 rounded-full border border-line-2" />
            )}
            <span className="relative">{o}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const empty = { other: "", budget: "", timeline: "", message: "", name: "", phone: "", email: "" };

export default function Contact() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [picked, setPicked] = useState<ServiceId[]>([]);
  const [other, setOther] = useState(false);
  const [d, setD] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [hint, setHint] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");
  const set = (k: keyof typeof empty) => (v: string) => setD((x) => ({ ...x, [k]: v }));

  // wybór z podstrony projektu („Zamów podobny projekt”)
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

  const toggle = (id: ServiceId) => {
    setHint("");
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };
  const total = services.filter((s) => picked.includes(s.id)).reduce((a, s) => a + s.price, 0);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setHint("");
    setStep(n);
  };

  const send = async (company: string) => {
    const topic = [...services.filter((s) => picked.includes(s.id)).map((s) => `${s.name} (od ${s.price} zł)`), ...(other ? [`Inne: ${d.other || "—"}`] : [])].join(", ");
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, company, topic: topic || "Nie wybrano" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Nie udało się wysłać wiadomości.");
      setSender(d.name.split(" ")[0] ?? "");
      setStatus({ state: "sent" });
      setD(empty);
      setPicked([]);
      setOther(false);
      setConsent(false);
      setStep(0);
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Nie udało się wysłać wiadomości." });
    }
  };

  // Enter i przycisk „Dalej” przechodzą przez ten sam submit — przeglądarka sprawdza wymagane pola bieżącego kroku
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 0) {
      if (!picked.length && !(other && d.other.trim())) return setHint(other ? "Napisz, czego potrzebujesz." : "Wybierz przynajmniej jedną usługę.");
      return go(1);
    }
    if (step === 1) return go(2);
    send(String(new FormData(e.currentTarget).get("company") ?? ""));
  };

  const title = "text-[clamp(1.6rem,3vw,2.2rem)] font-medium tracking-[-0.03em]";

  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="relative overflow-clip px-5 py-32 sm:px-10 lg:py-40">
      <div className="pointer-events-none absolute top-[30%] left-1/2 size-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.1),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1000px]">
        <div className="flex flex-col items-center text-center">
          <FadeUp>
            <p className="kicker">Kontakt</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(3rem,8vw,7.2rem)]" lines={["Masz projekt?", <span key="2" className="text-muted">Porozmawiajmy.</span>]} />
          <p id="kontakt-title" className="sr-only">
            Kontakt — wycena strony internetowej, sklepu, identyfikacji wizualnej lub projektu UI/UX
          </p>
        </div>

        <motion.div
          className="edge relative mt-14 overflow-hidden rounded-[32px] bg-surface"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease }}
        >
          <div className="pointer-events-none absolute -top-48 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.18),transparent)]" aria-hidden />

          <AnimatePresence mode="wait" initial={false}>
            {status.state === "sent" ? (
              <motion.div key="ok" className="relative flex min-h-[560px] flex-col items-center justify-center p-8 text-center" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden>
                  <motion.circle cx="32" cy="32" r="30" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
                  <motion.path d="M20 33l8 8 16-17" stroke="var(--color-accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }} />
                </svg>
                <h3 className="h-display mt-8 text-[44px]">Dziękuję{sender ? `, ${sender}` : ""}.</h3>
                <p className="mt-3 max-w-sm text-[17px] text-muted">Wiadomość dotarła — oddzwonię albo odpiszę najszybciej, jak to możliwe.</p>
                <button type="button" onClick={() => setStatus({ state: "idle" })} className="link-u mt-8 text-[15px]">
                  Napisz ponownie
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} className="relative" exit={{ opacity: 0 }}>
                {/* kroki */}
                <div className="px-6 pt-6 sm:px-10 sm:pt-8">
                  <ol className="grid grid-cols-3">
                    {stepNames.map((n, i) => (
                      <li key={n}>
                        <button
                          type="button"
                          disabled={i > step}
                          onClick={() => i < step && go(i)}
                          className={`flex items-center gap-2.5 pb-5 text-[13px] transition-colors sm:text-[14px] ${i === step ? "text-ink" : i < step ? "text-muted hover:text-ink" : "text-dim"}`}
                        >
                          <span className={`grid size-6 place-items-center rounded-full border text-[11px] tabular-nums transition-colors duration-500 ${i <= step ? "border-accent text-accent-2" : "border-line-2"}`}>{i + 1}</span>
                          {n}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="relative h-px bg-line">
                  <motion.span className="absolute inset-y-0 left-0 bg-accent" initial={false} animate={{ width: `${((step + 1) / 3) * 100}%` }} transition={{ duration: 0.8, ease }} />
                </div>

                <div className="relative min-h-[440px] px-6 py-8 sm:px-10 sm:py-10">
                  <AnimatePresence mode="wait" custom={dir} initial={false}>
                    <motion.div
                      key={step}
                      custom={dir}
                      variants={{
                        in: (k: number) => ({ opacity: 0, x: 40 * k, filter: "blur(6px)" }),
                        show: { opacity: 1, x: 0, filter: "blur(0px)" },
                        out: (k: number) => ({ opacity: 0, x: -40 * k, filter: "blur(6px)" }),
                      }}
                      initial="in"
                      animate="show"
                      exit="out"
                      transition={{ duration: 0.5, ease }}
                    >
                      {step === 0 && (
                        <>
                          <h3 className={title}>Czego potrzebujesz?</h3>
                          <p className="mt-1.5 text-[15px] text-muted">Możesz wybrać kilka. Ceny to minimalny koszt startu.</p>
                          <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                            {services.map((s) => {
                              const on = picked.includes(s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => toggle(s.id)}
                                  className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-[border-color,background-color] duration-300 sm:p-5 ${
                                    on ? "border-accent bg-accent/[0.1]" : "border-line-2 bg-white/[0.02] hover:border-white/25"
                                  }`}
                                >
                                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl border transition-colors duration-500 ${on ? "border-accent/50 bg-accent/15 text-accent-2" : "border-line-2 text-muted group-hover:text-ink"}`}>
                                    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                      <motion.path d={serviceIcons[s.id]} initial={false} animate={{ pathLength: on ? [0, 1] : 1 }} transition={{ duration: 0.8, ease }} />
                                    </svg>
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[16px] text-ink">{s.name}</span>
                                    <span className="mt-0.5 block text-[13px] text-dim">
                                      <span className={on ? "text-accent-2" : "text-muted"}>od {s.price} zł</span> · {s.time}
                                    </span>
                                  </span>
                                  <Check on={on} />
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              aria-pressed={other}
                              onClick={() => {
                                setHint("");
                                setOther((o) => !o);
                              }}
                              className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-[15px] transition-[border-color,background-color] duration-300 sm:col-span-2 ${
                                other ? "border-accent bg-accent/[0.1] text-ink" : "border-line-2 bg-white/[0.02] text-muted hover:border-white/25 hover:text-ink"
                              }`}
                            >
                              Coś innego
                              <Check on={other} />
                            </button>
                          </div>
                          <AnimatePresence initial={false}>
                            {other && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                                <div className="pt-2.5">
                                  <Input name="other" label="Czego potrzebujesz? (np. katalog PDF, landing do kampanii)" value={d.other} onChange={set("other")} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      {step === 1 && (
                        <>
                          <h3 className={title}>Opowiedz o projekcie</h3>
                          <p className="mt-1.5 text-[15px] text-muted">Kilka zdań wystarczy — resztę dopytam w rozmowie.</p>
                          <div className="mt-7 space-y-6">
                            <Group id="budget" label="Budżet (opcjonalnie)" options={budgets} value={d.budget} onChange={set("budget")} />
                            <Group id="time" label="Termin (opcjonalnie)" options={timelines} value={d.timeline} onChange={set("timeline")} />
                            <Input name="message" label="Co chcesz osiągnąć? Czym zajmuje się firma?" required area minLength={10} value={d.message} onChange={set("message")} />
                          </div>
                        </>
                      )}

                      {step === 2 && (
                        <>
                          <h3 className={title}>Gdzie mam odpisać?</h3>
                          <p className="mt-1.5 text-[15px] text-muted">Oddzwonię albo odpiszę mailem — jak wolisz.</p>
                          <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                            <Input name="name" label="Imię" required autoComplete="name" value={d.name} onChange={set("name")} />
                            <Input name="phone" label="Telefon" type="tel" inputMode="tel" required autoComplete="tel" value={d.phone} onChange={set("phone")} />
                            <Input name="email" label="E-mail" type="email" required autoComplete="email" value={d.email} onChange={set("email")} className="sm:col-span-2" />
                          </div>
                          <label className="mt-6 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-muted">
                            <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="peer sr-only" />
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
                                {status.message} Zadzwoń: <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="underline">{site.phone}</a>
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />
                </div>

                {/* dół karty: podsumowanie + nawigacja */}
                <div className="flex flex-col gap-4 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                  <div className="flex items-center gap-5 text-[13px] text-dim">
                    <span>
                      Start od
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={total} className="block text-[22px] tracking-[-0.02em] text-ink" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.45, ease }}>
                          {total ? `${total} zł` : "—"}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <AnimatePresence>
                      {hint && (
                        <motion.span role="alert" className="text-[13px] text-red-300" initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -5, 5, -3, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                          {hint}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button type="button" onClick={() => go(step - 1)} className="h-[56px] rounded-full px-5 text-[15px] text-muted transition-colors hover:text-ink">
                        Wstecz
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={status.state === "sending"}
                      className="group relative flex h-[56px] flex-1 items-center justify-between gap-6 overflow-hidden rounded-full bg-ink pr-1.5 pl-7 text-[16px] font-medium text-bg disabled:opacity-60 sm:flex-none"
                    >
                      <span className="absolute inset-0 bg-accent [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-700 ease-out-expo group-hover:[clip-path:inset(0_0_0_0)]" />
                      <span className="relative transition-colors duration-500 group-hover:text-white">{step < 2 ? "Dalej" : status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}</span>
                      <span className="relative grid size-11 place-items-center rounded-full bg-bg text-ink">
                        <Arrow className={`size-4 transition-transform duration-500 ease-out-expo ${step < 2 ? "rotate-45" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`} />
                      </span>
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* bezpośrednio */}
        <FadeUp delay={0.1} className="mt-10">
          <p className="text-center text-[14px] text-dim">Wolisz bezpośrednio?</p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-3">
            {channels.map((c) => (
              <li key={c.label} className="min-w-0">
                <a
                  href={c.href}
                  {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-3.5 rounded-2xl border border-line px-4 py-3.5 transition-colors duration-500 hover:border-accent/40 hover:bg-accent/[0.05]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-muted transition-colors duration-500 group-hover:text-accent-2">
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={c.icon} />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] text-dim">{c.label}</span>
                    <span className="block truncate text-[15px]">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
}
