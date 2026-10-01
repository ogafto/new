"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import { track } from "./Analytics";
import { Arrow, Magnetic } from "./ui/Button";

/*
 * Kontakt jako zdanie do uzupełnienia: „Cześć! Nazywam się ___ z firmy ___…”.
 * Pola rosną razem z tekstem, listy rozwijają się pod słowem, brakujące pole drga i podświetla się.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const budgets = ["do 1 000 zł", "1–3 tys. zł", "3–6 tys. zł", "powyżej 6 tys. zł", "do ustalenia"];
const discord = site.socials.find((s) => s.label === "Discord")?.href ?? "https://discord.com/";
type Key = "name" | "firm" | "service" | "other" | "budget" | "message" | "phone" | "email";
type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

// pole w tekście: szerokość = treść (albo podpowiedź)
function Blank({ id, value, onChange, placeholder, type = "text", bad, onFocus, autoComplete, inputMode }: { id: Key; value: string; onChange: (v: string) => void; placeholder: string; type?: string; bad: boolean; onFocus: () => void; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  const [focus, setFocus] = useState(false);
  return (
    <motion.span className="relative mx-[0.15em] inline-grid max-w-full align-baseline" animate={bad ? { x: [0, -8, 7, -4, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
      <span className="invisible col-start-1 row-start-1 overflow-hidden px-[0.1em] whitespace-pre">{value || placeholder}</span>
      <input
        id={`c-${id}`}
        name={id}
        type={type}
        size={1}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-label={placeholder}
        aria-invalid={bad}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocus(true);
          onFocus();
        }}
        onBlur={() => setFocus(false)}
        className="col-start-1 row-start-1 w-full min-w-0 bg-transparent px-[0.1em] text-ink outline-none placeholder:text-white/25"
      />
      <span className={`absolute inset-x-0 -bottom-[0.06em] h-[2px] rounded-full ${bad ? "bg-red-400" : "bg-white/15"}`} />
      <motion.span className="absolute inset-x-0 -bottom-[0.06em] h-[2px] origin-left rounded-full bg-gradient-to-r from-accent to-accent-2" initial={false} animate={{ scaleX: focus || (value && !bad) ? 1 : 0, opacity: focus ? 1 : value ? 0.55 : 0 }} transition={{ duration: 0.5, ease }} />
    </motion.span>
  );
}

// wybór z listy rozwijanej pod słowem
function Pick({ id, value, options, onChange, placeholder, bad, onFocus }: { id: Key; value: string; options: { value: string; label: string; meta?: string }[]; onChange: (v: string) => void; placeholder: string; bad: boolean; onFocus: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("mousedown", close);
    addEventListener("keydown", esc);
    return () => {
      removeEventListener("mousedown", close);
      removeEventListener("keydown", esc);
    };
  }, [open]);
  const current = options.find((o) => o.value === value);
  return (
    <motion.span ref={ref} className={`relative mx-[0.15em] inline-block ${open ? "z-40" : ""}`} animate={bad ? { x: [0, -8, 7, -4, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
      <button
        id={`c-${id}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          onFocus();
        }}
        className={`group relative inline-flex items-baseline gap-[0.2em] px-[0.1em] transition-colors ${current ? "text-ink" : "text-white/25 hover:text-white/45"}`}
      >
        {current?.label ?? placeholder}
        <motion.svg viewBox="0 0 12 12" className="size-[0.45em] self-center" animate={{ rotate: open ? 180 : 0 }} aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </motion.svg>
        <span className={`absolute inset-x-0 -bottom-[0.06em] h-[2px] rounded-full ${bad ? "bg-red-400" : current ? "bg-gradient-to-r from-accent to-accent-2 opacity-60" : "bg-white/15"}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="listbox"
            className="edge absolute top-full left-0 z-30 mt-3 block w-[min(320px,80vw)] overflow-hidden rounded-2xl bg-surface p-1.5 text-[15px] leading-normal tracking-normal shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)]"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.25, ease }}
          >
            {options.map((o, i) => (
              <motion.button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-4 rounded-xl px-3.5 py-2.5 text-left transition-colors ${o.value === value ? "bg-accent/15 text-ink" : "text-muted hover:bg-white/[0.05] hover:text-ink"}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {o.label}
                {o.meta && <span className="text-[13px] text-dim">{o.meta}</span>}
              </motion.button>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}

const empty: Record<Key, string> = { name: "", firm: "", service: "", other: "", budget: "", message: "", phone: "", email: "" };

export default function Contact() {
  const [d, setD] = useState(empty);
  const [bad, setBad] = useState<Key | null>(null);
  const [hint, setHint] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");
  const started = useRef(false);
  const set = (k: Key) => (v: string) => {
    setD((x) => ({ ...x, [k]: v }));
    if (bad === k) {
      setBad(null);
      setHint("");
    }
  };
  const start = () => {
    if (started.current) return;
    started.current = true;
    track("form", "start");
  };

  // wybór z podstrony projektu („Zamów podobny projekt”)
  useEffect(() => {
    const add = (id: ServiceId) => setD((x) => ({ ...x, service: id }));
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

  const svc = services.find((s) => s.id === d.service);
  const checks: [Key, boolean, string][] = [
    ["name", d.name.trim().length >= 2, "Jak masz na imię?"],
    ["service", !!d.service && (d.service !== "other" || d.other.trim().length > 1), d.service === "other" ? "Napisz, czego potrzebujesz." : "Wybierz, czego potrzebujesz."],
    ["message", d.message.trim().length >= 10, "Napisz kilka słów o projekcie (min. 10 znaków)."],
    ["phone", d.phone.replace(/\D/g, "").length >= 9, "Podaj numer telefonu."],
    ["email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email), "Podaj poprawny e-mail."],
  ];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const miss = checks.find(([, ok]) => !ok);
    if (miss) {
      setBad(miss[0]);
      setHint(miss[2]);
      document.getElementById(`c-${miss[0] === "service" && d.service === "other" ? "other" : miss[0]}`)?.focus();
      return;
    }
    if (!consent) {
      setHint("Zaznacz zgodę na przetwarzanie danych.");
      return;
    }
    setHint("");
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name,
          firm: d.firm,
          email: d.email,
          phone: d.phone,
          topic: svc ? `${svc.name} (od ${svc.price} zł)` : `Inne: ${d.other}`,
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

  const B = (k: Key, placeholder: string, extra: Partial<Parameters<typeof Blank>[0]> = {}) => <Blank id={k} value={d[k]} onChange={set(k)} placeholder={placeholder} bad={bad === k} onFocus={start} {...extra} />;

  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="relative overflow-clip py-32 lg:py-44">
      <div className="pointer-events-none absolute -top-40 right-[-15%] size-[900px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.1),transparent)]" aria-hidden />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.p className="kicker" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              Kontakt
            </motion.p>
            <h2 id="kontakt-title" className="h-display mt-7 overflow-hidden pb-[0.1em] text-[clamp(2.8rem,6vw,5.6rem)]">
              <motion.span className="block" initial={{ y: "105%" }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 1.1, ease }}>
                Napisz do mnie.
              </motion.span>
            </h2>
          </div>
          <motion.p className="max-w-[320px] text-[15px] leading-relaxed text-muted" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            Uzupełnij luki w zdaniu — zajmie to mniej niż minutę.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {status.state === "sent" ? (
            <motion.div key="ok" className="py-20 lg:py-28" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden>
                <motion.circle cx="32" cy="32" r="30" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
                <motion.path d="M20 33l8 8 16-17" stroke="var(--color-accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }} />
              </svg>
              <p className="h-display mt-10 text-[clamp(2.4rem,5.6vw,5rem)]">
                {`Dzięki${sender ? `, ${sender}` : ""}.`.split(" ").map((w, i) => (
                  <motion.span key={i} className="mr-[0.25em] inline-block" initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.3 + i * 0.12, duration: 0.8, ease }}>
                    {w}
                  </motion.span>
                ))}
                <motion.span className="block text-muted" initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.6, duration: 0.8, ease }}>
                  Odezwę się wkrótce.
                </motion.span>
              </p>
              <button type="button" onClick={() => setStatus({ state: "idle" })} className="link-u mt-10 text-[15px]">
                Napisz ponownie
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} noValidate className="relative mt-16 lg:mt-20" exit={{ opacity: 0, y: -20, filter: "blur(10px)" }} transition={{ duration: 0.5 }}>
              <motion.div
                className="text-[clamp(1.45rem,3.1vw,2.7rem)] leading-[1.75] tracking-[-0.025em] text-muted"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              >
                {[
                  <>
                    Cześć! Nazywam się {B("name", "imię i nazwisko", { autoComplete: "name" })}
                    {" z firmy "}
                    {B("firm", "nazwa (opcjonalnie)", { autoComplete: "organization" })}.
                  </>,
                  <>
                    {" Szukam kogoś, kto zrobi dla mnie "}
                    <Pick
                      id="service"
                      value={d.service}
                      onChange={set("service")}
                      placeholder="wybierz usługę"
                      bad={bad === "service"}
                      onFocus={start}
                      options={[...services.map((s) => ({ value: s.id, label: s.name.toLowerCase(), meta: `od ${s.price} zł` })), { value: "other", label: "coś innego" }]}
                    />
                    {d.service === "other" && <>({B("other", "co dokładnie?")})</>}
                    {" w budżecie "}
                    <Pick id="budget" value={d.budget} onChange={set("budget")} placeholder="do ustalenia" bad={false} onFocus={start} options={budgets.map((b) => ({ value: b, label: b }))} />.
                  </>,
                  <>
                    {" W skrócie: "}
                    {B("message", "kilka słów o projekcie i celu")}.
                  </>,
                  <>
                    {" Najlepiej złapać mnie pod numerem "}
                    {B("phone", "telefon", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
                    {" albo mailowo: "}
                    {B("email", "e-mail", { type: "email", autoComplete: "email", inputMode: "email" })}.
                  </>,
                ].map((part, i) => (
                  <motion.span key={i} className="inline" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.9, ease } } }}>
                    {part}
                  </motion.span>
                ))}
              </motion.div>
              <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

              <div className="mt-14 flex flex-col gap-8 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-muted">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="peer sr-only" />
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-line-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 [&>svg]:scale-0 peer-checked:[&>svg]:scale-100">
                      <svg width="11" height="11" viewBox="0 0 10 10" className="transition-transform duration-300" aria-hidden>
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
                  <AnimatePresence mode="wait">
                    {(hint || status.state === "error") && (
                      <motion.p key={hint + status.message} role="alert" className="text-[14px] text-red-300" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {hint || `${status.message} Zadzwoń: ${site.phone}`}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <Magnetic strength={0.15}>
                  <button
                    type="submit"
                    disabled={status.state === "sending"}
                    className="group relative flex h-[76px] items-center gap-6 overflow-hidden rounded-full bg-ink pr-2.5 pl-9 text-[19px] font-medium text-bg disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-accent [clip-path:circle(0%_at_90%_50%)] transition-[clip-path] duration-700 ease-out-expo group-hover:[clip-path:circle(150%_at_90%_50%)]" />
                    <span className="relative transition-colors duration-500 group-hover:text-white">{status.state === "sending" ? "Wysyłanie…" : "Wyślij wiadomość"}</span>
                    <span className="relative grid size-14 place-items-center overflow-hidden rounded-full bg-bg text-ink">
                      <Arrow className="size-5 transition-transform duration-500 ease-out-expo group-hover:translate-x-6 group-hover:-translate-y-6" />
                      <Arrow className="absolute size-5 -translate-x-6 translate-y-6 transition-transform duration-500 ease-out-expo group-hover:translate-x-0 group-hover:translate-y-0" />
                    </span>
                  </button>
                </Magnetic>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* bezpośrednio */}
        <div className="mt-24 grid gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-3">
          {[
            { label: "E-mail", value: site.email, href: `mailto:${site.email}` },
            { label: "Telefon", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
            { label: "Discord", value: "Napisz na Discordzie", href: discord, ext: true },
          ].map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group relative flex min-w-0 flex-col justify-between gap-10 overflow-hidden bg-bg p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.9, ease }}
            >
              <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-accent/20 to-transparent transition-transform duration-700 ease-out-expo group-hover:translate-y-0" />
              <span className="relative flex items-center justify-between text-[13px] text-dim">
                {c.label}
                <span className="grid size-9 place-items-center rounded-full border border-line-2 text-ink transition-all duration-500 ease-out-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-ink group-hover:text-bg">
                  <Arrow className="size-3.5" />
                </span>
              </span>
              <span className="relative text-[clamp(1.05rem,1.6vw,1.4rem)] tracking-[-0.02em] break-all">{c.value}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
