"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import { track } from "./Analytics";
import { Arrow, Magnetic } from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";
import Input from "./ui/Input";

/*
 * Kontakt krok po kroku — jedno pytanie na ekran:
 * 1) usługa  2) budżet  3) kilka słów o projekcie  4) dane kontaktowe.
 * Wybór kafelka od razu przechodzi dalej; podsumowanie wyborów można kliknąć, żeby wrócić.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const discord = site.socials.find((s) => s.label === "Discord")?.href ?? "https://discord.com/";

const budgets = [
  { v: "50–200 zł", hint: "Drobne zmiany, prosta wizytówka" },
  { v: "200–500 zł", hint: "Strona-wizytówka, landing" },
  { v: "500–1 000 zł", hint: "Strona firmowa, logo" },
  { v: "1 000–3 000 zł", hint: "Sklep, rozbudowana strona" },
  { v: "powyżej 3 000 zł", hint: "Duży projekt, marka od zera" },
  { v: "Jeszcze nie wiem", hint: "Doradzę, co ma sens" },
];
const timelines = ["Jak najszybciej", "W ciągu miesiąca", "Bez pośpiechu"];
const stepNames = ["Usługa", "Budżet", "Projekt", "Kontakt"];
const questions = ["Czego potrzebujesz?", "Jaki masz budżet?", "Opowiedz o projekcie", "Gdzie mam odpisać?"];

const icons: Record<ServiceId | "other", string> = {
  www: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5zM3 9h18M6 7h.01M8.5 7h.01",
  shop: "M5 8h14l-1.2 11.1a1 1 0 01-1 .9H7.2a1 1 0 01-1-.9zM9 8V6.5a3 3 0 016 0V8",
  brand: "M12 3l2.6 5.6L20.5 9l-4.4 4 1.1 6L12 16.2 6.8 19l1.1-6-4.4-4 5.9-.4z",
  ui: "M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z",
  other: "M12 5v14M5 12h14",
};

const empty = { service: "" as ServiceId | "other" | "", other: "", budget: "", message: "", timeline: "", name: "", email: "", phone: "" };
type Data = typeof empty;
type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

function Check({ on }: { on: boolean }) {
  return (
    <span className={`grid size-6 shrink-0 place-items-center rounded-full border transition-all duration-300 ${on ? "border-accent bg-accent shadow-[0_0_16px_rgb(139_108_255/0.6)]" : "border-line-2"}`}>
      <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden>
        <motion.path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.35 }} />
      </svg>
    </span>
  );
}

// Konfetti przy wysłaniu
function Burst() {
  return (
    <span className="pointer-events-none absolute top-1/2 left-1/2" aria-hidden>
      {Array.from({ length: 22 }).map((_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const r = 110 + (i % 4) * 30;
        return (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full"
            style={{ background: ["#8b6cff", "#b4a2ff", "#efe9ff", "#6ee7b7"][i % 4] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, scale: [0, 1.4, 0.6], opacity: [1, 1, 0] }}
            transition={{ delay: 0.35, duration: 1.4, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

export default function Contact() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<Data>(empty);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof Data>(k: K) => (v: Data[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setError("");
    if (!started.current) {
      started.current = true;
      track("form", "start");
    }
  };
  const go = (n: number) => {
    if (timer.current) clearTimeout(timer.current);
    setError("");
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  // wybór kafelka → krótka pauza (widać zaznaczenie) → następny krok
  const pickAndNext = (fn: () => void, next: number) => {
    fn();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), 420);
  };

  // wybór z podstrony projektu („Zamów podobny projekt”)
  useEffect(() => {
    const on = (e: Event) => setD((x) => ({ ...x, service: (e as CustomEvent<ServiceId>).detail }));
    window.addEventListener("afto:service", on);
    const t = setTimeout(() => {
      try {
        const s = sessionStorage.getItem("afto:service") as ServiceId | null;
        if (s) {
          setD((x) => ({ ...x, service: s }));
          setStep(1);
          sessionStorage.removeItem("afto:service");
        }
      } catch {}
    }, 0);
    return () => {
      window.removeEventListener("afto:service", on);
      clearTimeout(t);
    };
  }, []);

  const svc = services.find((s) => s.id === d.service);
  const serviceLabel = svc ? svc.name : d.service === "other" ? d.other || "Coś innego" : "";

  const validate = (s: number): string => {
    if (s === 0 && !d.service) return "Wybierz usługę.";
    if (s === 0 && d.service === "other" && d.other.trim().length < 2) return "Napisz, czego potrzebujesz.";
    if (s === 1 && !d.budget) return "Wybierz budżet.";
    if (s === 2 && d.message.trim().length < 10) return "Napisz kilka słów (min. 10 znaków).";
    if (s === 3) {
      if (d.name.trim().length < 2) return "Podaj imię i nazwisko.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return "Podaj poprawny adres e-mail.";
      if (d.phone.replace(/\D/g, "").length < 9) return "Podaj numer telefonu.";
      if (!consent) return "Zaakceptuj politykę prywatności.";
    }
    return "";
  };

  const send = async (company: string) => {
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name,
          email: d.email,
          phone: d.phone,
          topic: svc ? `${svc.name} (od ${svc.price} zł)` : `Inne: ${d.other}`,
          budget: d.budget,
          timeline: d.timeline,
          message: d.message,
          company,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Nie udało się wysłać wiadomości.");
      track("form", "submit", svc?.name ?? "inne");
      setSender(d.name.trim().split(" ")[0]);
      setStatus({ state: "sent" });
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Nie udało się wysłać wiadomości." });
    }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validate(step);
    if (err) return setError(err);
    if (step < 3) return go(step + 1);
    send(String(new FormData(e.currentTarget).get("company") ?? ""));
  };

  const reset = () => {
    setD(empty);
    setConsent(false);
    setStep(0);
    setStatus({ state: "idle" });
  };

  const summary = [serviceLabel, d.budget, d.message && step > 2 ? "Opis projektu" : ""].map((t, i) => ({ t, i })).filter((x) => x.t && x.i < step);

  return (
    <section id="kontakt" className="relative overflow-clip pt-20 pb-32 lg:pb-44">
      {/* orbity w tle */}
      <div className="pointer-events-none absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,#000_55%,transparent)] size-[1300px]" aria-hidden>
        {[640, 900, 1180].map((s, i) => (
          <motion.span
            key={s}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${i === 1 ? "border-dashed border-white/[0.07]" : "border-white/[0.05]"}`}
            style={{ width: s, height: s }}
            animate={{ rotate: i % 2 ? -360 : 360 }}
            transition={{ duration: 90 + i * 40, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute top-1/2 -left-1 size-2 rounded-full bg-accent-2/70 shadow-[0_0_14px_#b4a2ff]" />
          </motion.span>
        ))}
        <span className="absolute top-1/2 left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.14),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-[880px] px-5 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <FadeUp>
            <p className="kicker">Kontakt</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.8rem,6.6vw,5.8rem)]" lines={["Opowiedz mi", <span key="2" className="text-muted">o swoim projekcie</span>]} />
          <FadeUp delay={0.1}>
            <p className="mt-6 text-[17px] text-muted">Cztery krótkie pytania — zajmie to mniej niż minutę.</p>
          </FadeUp>
        </div>

        <motion.div
          layout
          className="edge relative mt-14 overflow-hidden rounded-[36px] bg-surface/85 shadow-[0_50px_120px_-40px_rgb(139_108_255/0.35)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease, layout: { duration: 0.5, ease } }}
        >
          <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.2),transparent)]" aria-hidden />

          <AnimatePresence mode="wait" initial={false}>
            {status.state === "sent" ? (
              <motion.div key="ok" className="relative flex flex-col items-center px-6 py-20 text-center sm:py-24" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="relative">
                  <Burst />
                  <svg viewBox="0 0 64 64" className="relative size-20" fill="none" aria-hidden>
                    <motion.circle cx="32" cy="32" r="30" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
                    <motion.path d="M20 33l8 8 16-17" stroke="var(--color-accent-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }} />
                  </svg>
                </div>
                <h3 className="h-display mt-8 text-[clamp(2.4rem,5vw,3.6rem)]">Dziękuję{sender ? `, ${sender}` : ""}.</h3>
                <p className="mt-3 max-w-sm text-[17px] text-muted">Wiadomość dotarła — odezwę się najszybciej, jak to możliwe.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[serviceLabel, d.budget, d.timeline].filter(Boolean).map((t) => (
                    <span key={t} className="rounded-full border border-line-2 px-3 py-1 text-[13px] text-muted">
                      {t}
                    </span>
                  ))}
                </div>
                <button type="button" onClick={reset} className="link-u mt-8 text-[15px]">
                  Napisz ponownie
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} noValidate className="relative p-6 sm:p-12" exit={{ opacity: 0 }}>
                {/* postęp */}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[13px] text-dim tabular-nums">
                    Krok <span className="text-ink">{step + 1}</span> z 4
                  </p>
                  <div className="grid w-[min(320px,60%)] grid-cols-4 gap-1.5">
                    {stepNames.map((n, i) => (
                      <button key={n} type="button" disabled={i > step} onClick={() => i < step && go(i)} className="group text-left disabled:cursor-default" aria-label={`Krok ${i + 1}: ${n}`}>
                        <span className="block h-1 overflow-hidden rounded-full bg-white/10">
                          <motion.span className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-2" initial={false} animate={{ width: i < step ? "100%" : i === step ? "45%" : "0%" }} transition={{ duration: 0.7, ease }} />
                        </span>
                        <span className={`mt-1.5 hidden text-[11.5px] transition-colors sm:block ${i === step ? "text-ink" : i < step ? "text-muted group-hover:text-ink" : "text-dim"}`}>{n}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* wybrane wcześniej */}
                <div className="mt-6 flex min-h-[30px] flex-wrap gap-2">
                  <AnimatePresence>
                    {summary.map((x) => (
                      <motion.button
                        key={x.i}
                        type="button"
                        onClick={() => go(x.i)}
                        className="group flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 py-1 pr-2.5 pl-3 text-[12.5px] text-accent-2 transition-colors hover:border-accent/60"
                        initial={{ opacity: 0, scale: 0.8, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                      >
                        {x.t}
                        <span className="text-[11px] opacity-50 transition-opacity group-hover:opacity-100">zmień</span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait" custom={dir} initial={false}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={{
                      in: (k: number) => ({ opacity: 0, x: 50 * k, filter: "blur(8px)" }),
                      show: { opacity: 1, x: 0, filter: "blur(0px)" },
                      out: (k: number) => ({ opacity: 0, x: -50 * k, filter: "blur(8px)" }),
                    }}
                    initial="in"
                    animate="show"
                    exit="out"
                    transition={{ duration: 0.45, ease }}
                    className="mt-4"
                  >
                    <h3 className="h-display text-[clamp(2rem,4.4vw,3.2rem)]">
                      {questions[step].split(" ").map((w, i) => (
                        <motion.span key={i} className="mr-[0.25em] inline-block" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05, duration: 0.6, ease }}>
                          {w}
                        </motion.span>
                      ))}
                    </h3>

                    {step === 0 && (
                      <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {[...services.map((s) => ({ id: s.id as ServiceId | "other", name: s.name, meta: `od ${s.price} zł · ${s.time}` })), { id: "other" as const, name: "Coś innego", meta: "Opiszesz w kilku słowach" }].map((o, i) => {
                          const on = d.service === o.id;
                          return (
                            <motion.button
                              key={o.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => (o.id === "other" ? set("service")("other") : pickAndNext(() => set("service")(o.id), 1))}
                              className={`group relative flex items-center gap-4 overflow-hidden rounded-[22px] border p-4 text-left transition-colors duration-300 sm:p-5 ${o.id === "other" ? "sm:col-span-2" : ""} ${
                                on ? "border-accent bg-accent/[0.12]" : "border-line-2 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                              }`}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease }}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className={`grid size-14 shrink-0 place-items-center rounded-2xl border transition-colors duration-500 ${on ? "border-accent/60 bg-accent/20 text-accent-2" : "border-line-2 bg-white/[0.03] text-muted group-hover:text-ink"}`}>
                                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <motion.path d={icons[o.id]} initial={false} animate={{ pathLength: on ? [0, 1] : 1 }} transition={{ duration: 0.8, ease }} />
                                </svg>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[17px] text-ink">{o.name}</span>
                                <span className={`mt-0.5 block text-[13px] ${on ? "text-accent-2" : "text-dim"}`}>{o.meta}</span>
                              </span>
                              <Check on={on} />
                            </motion.button>
                          );
                        })}
                        <AnimatePresence>
                          {d.service === "other" && (
                            <motion.div className="sm:col-span-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease }}>
                              <Input name="other" label="Czego potrzebujesz? (np. katalog PDF, kampania)" value={d.other} onChange={set("other")} autoFocus />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
                        {budgets.map((b, i) => {
                          const on = d.budget === b.v;
                          return (
                            <motion.button
                              key={b.v}
                              type="button"
                              aria-pressed={on}
                              onClick={() => pickAndNext(() => set("budget")(b.v), 2)}
                              className={`group flex items-center justify-between gap-4 rounded-[20px] border px-5 py-4 text-left transition-colors duration-300 ${on ? "border-accent bg-accent/[0.12]" : "border-line-2 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"}`}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease }}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span>
                                <span className="block text-[20px] tracking-[-0.02em] text-ink">{b.v}</span>
                                <span className={`mt-0.5 block text-[13px] ${on ? "text-accent-2" : "text-dim"}`}>{b.hint}</span>
                              </span>
                              <Check on={on} />
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="mt-8 space-y-6">
                        <div>
                          <Input name="message" label="Czym zajmuje się firma? Co chcesz osiągnąć?" area value={d.message} onChange={set("message")} autoFocus />
                          <div className="mt-2 flex justify-between px-1 text-[12px] text-dim">
                            <span>np. „Piekarnia we Wrocławiu, chcemy przyjmować zamówienia online”</span>
                            <span className={`tabular-nums ${d.message.trim().length >= 10 ? "text-emerald-300" : ""}`}>{d.message.trim().length >= 10 ? "✓" : `${d.message.trim().length}/10`}</span>
                          </div>
                        </div>
                        <div>
                          <p className="mb-3 text-[14px] text-muted">Kiedy chcesz zacząć? (opcjonalnie)</p>
                          <div className="flex flex-wrap gap-2">
                            {timelines.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => set("timeline")(d.timeline === t ? "" : t)}
                                className={`relative h-11 rounded-full px-4 text-[14px] transition-colors ${d.timeline === t ? "text-white" : "text-muted hover:text-ink"}`}
                              >
                                {d.timeline === t ? <motion.span layoutId="ct-time" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : <span className="absolute inset-0 rounded-full border border-line-2" />}
                                <span className="relative">{t}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <Input name="name" label="Imię i nazwisko" required autoComplete="name" value={d.name} onChange={set("name")} className="sm:col-span-2" autoFocus />
                        <Input name="email" label="Adres e-mail" type="email" required autoComplete="email" inputMode="email" value={d.email} onChange={set("email")} />
                        <Input name="phone" label="Numer telefonu" type="tel" required autoComplete="tel" inputMode="tel" value={d.phone} onChange={set("phone")} />
                        <label className="mt-2 flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed text-muted sm:col-span-2">
                          <input type="checkbox" checked={consent} onChange={(e) => (setConsent(e.target.checked), setError(""))} className="peer sr-only" />
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-line-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 [&>svg]:scale-0 peer-checked:[&>svg]:scale-100">
                            <svg width="11" height="11" viewBox="0 0 10 10" className="transition-transform duration-300" aria-hidden>
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
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                <AnimatePresence mode="wait">
                  {(error || status.state === "error") && (
                    <motion.p key={error + status.message} role="alert" className="mt-5 text-[14px] text-red-300" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      {error || `${status.message} Zadzwoń: ${site.phone}`}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* nawigacja */}
                <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
                  {step > 0 ? (
                    <button type="button" onClick={() => go(step - 1)} className="group flex h-12 items-center gap-2 rounded-full px-3 text-[15px] text-muted transition-colors hover:text-ink">
                      <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">←</span>
                      Wstecz
                    </button>
                  ) : (
                    <span className="text-[13px] text-dim">Kliknij kafelek, żeby przejść dalej</span>
                  )}
                  {(step >= 2 || (step === 0 && d.service === "other")) && (
                    <Magnetic strength={0.12}>
                      <button
                        type="submit"
                        disabled={status.state === "sending"}
                        className="group relative ml-auto flex h-[60px] items-center gap-6 overflow-hidden rounded-full bg-ink pr-2 pl-7 text-[16px] font-medium text-bg disabled:opacity-60"
                      >
                        <span className="absolute inset-0 bg-accent [clip-path:circle(0%_at_90%_50%)] transition-[clip-path] duration-700 ease-out-expo group-hover:[clip-path:circle(150%_at_90%_50%)]" />
                        <span className="relative transition-colors duration-500 group-hover:text-white">{step < 3 ? "Dalej" : status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}</span>
                        <span className="relative grid size-11 place-items-center overflow-hidden rounded-full bg-bg text-ink">
                          <Arrow className={`size-4 transition-transform duration-500 ease-out-expo ${step < 3 ? "rotate-45 group-hover:translate-x-0.5" : "group-hover:translate-x-5 group-hover:-translate-y-5"}`} />
                          {step === 3 && <Arrow className="absolute size-4 -translate-x-5 translate-y-5 transition-transform duration-500 ease-out-expo group-hover:translate-x-0 group-hover:translate-y-0" />}
                        </span>
                      </button>
                    </Magnetic>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* bezpośrednio */}
        <FadeUp delay={0.1} className="mt-10">
          <div className="flex flex-col items-center gap-3 text-[15px] sm:flex-row sm:justify-center sm:gap-8">
            <span className="text-dim">Wolisz bezpośrednio?</span>
            <a href={`mailto:${site.email}`} className="link-u text-muted hover:text-ink">
              {site.email}
            </a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link-u text-muted hover:text-ink">
              {site.phone}
            </a>
            <a href={discord} target="_blank" rel="noopener noreferrer" className="link-u text-muted hover:text-ink">
              Discord
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
