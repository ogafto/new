"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import { track } from "./Analytics";
import { Arrow, Magnetic } from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";
import Input from "./ui/Input";
import Select from "./ui/Select";

/* Kontakt: prosty formularz (imię, e-mail, telefon, usługa, budżet, opis) + bezpośrednie kanały. */

const ease = [0.16, 1, 0.3, 1] as const;
const discord = site.socials.find((s) => s.label === "Discord")?.href ?? "https://discord.com/";
const budgets = ["50–200 zł", "200–500 zł", "500–1 000 zł", "1 000–3 000 zł", "powyżej 3 000 zł", "Jeszcze nie wiem"];
const serviceOptions = [...services.map((s) => ({ value: s.id, label: s.name, meta: `od ${s.price} zł` })), { value: "other", label: "Coś innego" }];

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
const empty = { name: "", email: "", phone: "", service: "", budget: "", message: "" };

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

export default function Contact() {
  const [d, setD] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [bad, setBad] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");
  const started = useRef(false);
  const set = (k: keyof typeof empty) => (v: string) => {
    setD((x) => ({ ...x, [k]: v }));
    if (bad === k) {
      setBad("");
      setError("");
    }
    if (!started.current) {
      started.current = true;
      track("form", "start");
    }
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
          sessionStorage.removeItem("afto:service");
        }
      } catch {}
    }, 0);
    return () => {
      window.removeEventListener("afto:service", on);
      clearTimeout(t);
    };
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const checks: [string, boolean, string][] = [
      ["name", d.name.trim().length >= 2, "Podaj imię i nazwisko."],
      ["email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email), "Podaj poprawny adres e-mail."],
      ["phone", d.phone.replace(/\D/g, "").length >= 9, "Podaj numer telefonu."],
      ["service", !!d.service, "Wybierz usługę."],
      ["message", d.message.trim().length >= 10, "Napisz kilka słów o projekcie (min. 10 znaków)."],
      ["consent", consent, "Zaakceptuj politykę prywatności."],
    ];
    const miss = checks.find(([, ok]) => !ok);
    if (miss) {
      setBad(miss[0]);
      setError(miss[2]);
      return;
    }
    const svc = services.find((s) => s.id === d.service);
    setError("");
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name,
          email: d.email,
          phone: d.phone,
          topic: svc ? `${svc.name} (od ${svc.price} zł)` : "Coś innego",
          budget: d.budget,
          message: d.message,
          company: String(new FormData(e.currentTarget).get("company") ?? ""),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Nie udało się wysłać wiadomości.");
      track("form", "submit", svc?.name ?? "inne");
      setSender(d.name.trim().split(" ")[0]);
      setStatus({ state: "sent" });
      setD(empty);
      setConsent(false);
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Nie udało się wysłać wiadomości." });
    }
  };

  return (
    <section id="kontakt" className="relative overflow-x-clip pt-20 pb-32 lg:pt-20 lg:pb-40">
      <div className="pointer-events-none absolute top-1/3 right-0 h-[700px] w-[min(900px,100vw)] bg-[radial-gradient(closest-side,rgb(139_108_255/0.1),transparent)]" aria-hidden />

      <div className="relative mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="flex flex-col">
          <FadeUp>
            <p className="kicker">Kontakt</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.8rem,5.6vw,5.4rem)]" lines={["Porozmawiajmy", <span key="2" className="text-muted">o Twoim projekcie</span>]} />
          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-[400px] text-[17px] leading-relaxed text-muted">Napisz, czego potrzebujesz — odezwę się z pytaniami i wyceną.</p>
          </FadeUp>

          <ul className="mt-12 space-y-2 lg:mt-auto">
            {channels.map((c, i) => (
              <motion.li key={c.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.08, duration: 0.8, ease }}>
                <a href={c.href} {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group flex items-center gap-4 rounded-2xl py-3 pr-2">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line-2 text-muted transition-colors duration-500 group-hover:border-accent/50 group-hover:bg-accent/10 group-hover:text-accent-2">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={c.icon} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] text-dim">{c.label}</span>
                    <span className="block text-[17px] tracking-[-0.01em] break-all transition-colors group-hover:text-ink">{c.value}</span>
                  </span>
                  <Arrow className="size-4 shrink-0 -translate-x-2 text-muted opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100" />
                </a>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          className="edge relative min-w-0 rounded-[32px] bg-surface p-6 sm:p-10"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]" aria-hidden>
            <div className="absolute -top-40 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" />
          </div>

          <AnimatePresence mode="wait">
            {status.state === "sent" ? (
              <motion.div key="ok" className="relative flex min-h-[520px] flex-col items-center justify-center text-center" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden>
                  <motion.circle cx="32" cy="32" r="30" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
                  <motion.path d="M20 33l8 8 16-17" stroke="var(--color-accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }} />
                </svg>
                <h3 className="h-display mt-8 text-[44px]">Dziękuję{sender ? `, ${sender}` : ""}.</h3>
                <p className="mt-3 max-w-sm text-[17px] text-muted">Wiadomość dotarła — odezwę się najszybciej, jak to możliwe.</p>
                <button type="button" onClick={() => setStatus({ state: "idle" })} className="link-u mt-8 text-[15px]">
                  Napisz ponownie
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} noValidate className="relative grid gap-3 sm:grid-cols-2" exit={{ opacity: 0 }}>
                <Input name="name" label="Imię i nazwisko" required autoComplete="name" value={d.name} onChange={set("name")} className={bad === "name" ? "[&_input]:border-red-400/60" : ""} />
                <Input name="email" label="Adres e-mail" type="email" required autoComplete="email" inputMode="email" value={d.email} onChange={set("email")} className={bad === "email" ? "[&_input]:border-red-400/60" : ""} />
                <Input name="phone" label="Numer telefonu" type="tel" required autoComplete="tel" inputMode="tel" value={d.phone} onChange={set("phone")} className={bad === "phone" ? "[&_input]:border-red-400/60" : ""} />
                <Select name="service" label="Wybierz usługę" required options={serviceOptions} value={d.service} onChange={set("service")} invalid={bad === "service"} />
                <div className="sm:col-span-2">
                  <Select name="budget" label="Budżet" options={budgets.map((b) => ({ value: b, label: b }))} value={d.budget} onChange={set("budget")} />
                </div>
                <Input name="message" label="Kilka słów o projekcie" required area minLength={10} value={d.message} onChange={set("message")} className={`sm:col-span-2 ${bad === "message" ? "[&_textarea]:border-red-400/60" : ""}`} />
                <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                <label className="mt-3 flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed text-muted sm:col-span-2">
                  <input type="checkbox" checked={consent} onChange={(e) => (setConsent(e.target.checked), bad === "consent" && (setBad(""), setError("")))} className="peer sr-only" />
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 [&>svg]:scale-0 peer-checked:[&>svg]:scale-100 ${bad === "consent" ? "border-red-400/70" : "border-line-2"}`}
                  >
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

                <AnimatePresence mode="wait">
                  {(error || status.state === "error") && (
                    <motion.p key={error + status.message} role="alert" className="text-[14px] text-red-300 sm:col-span-2" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {error || `${status.message} Zadzwoń: ${site.phone}`}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="mt-4 sm:col-span-2">
                  <Magnetic strength={0.08}>
                    <button
                      type="submit"
                      disabled={status.state === "sending"}
                      className="group relative flex h-[64px] w-full min-w-[260px] items-center justify-between overflow-hidden rounded-full bg-ink pr-2 pl-8 text-[17px] font-medium text-bg disabled:opacity-60 sm:w-auto"
                    >
                      <span className="absolute inset-0 bg-accent [clip-path:circle(0%_at_92%_50%)] transition-[clip-path] duration-700 ease-out-expo group-hover:[clip-path:circle(150%_at_92%_50%)]" />
                      <span className="relative mr-8 transition-colors duration-500 group-hover:text-white">{status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}</span>
                      <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-bg text-ink">
                        <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-5 group-hover:-translate-y-5" />
                        <Arrow className="absolute size-4 -translate-x-5 translate-y-5 transition-transform duration-500 ease-out-expo group-hover:translate-x-0 group-hover:translate-y-0" />
                      </span>
                    </button>
                  </Magnetic>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
