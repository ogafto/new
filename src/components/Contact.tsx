"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import { Arrow } from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";
import Input from "./ui/Input";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
const ease = [0.16, 1, 0.3, 1] as const;

const discord = site.socials.find((s) => s.label === "Discord")?.href ?? "https://discord.com/";

const methods = [
  {
    label: "E-mail",
    value: site.email,
    href: `mailto:${site.email}`,
    copy: site.email,
    icon: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5zM3.5 6l8.5 7 8.5-7",
  },
  {
    label: "Telefon",
    value: site.phone,
    href: `tel:${site.phone.replace(/\s/g, "")}`,
    copy: site.phone,
    icon: "M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 005.6 5.6l1.4-2.3L19.5 15v3.5a1.5 1.5 0 01-1.6 1.5C10.6 19.5 4.5 13.4 4 6.1A1.5 1.5 0 015 4z",
  },
  {
    label: "Discord",
    value: "Napisz na Discordzie",
    href: discord,
    ext: true,
    icon: "M8.5 7.5c2.3-.7 4.7-.7 7 0M7 17c3.3 1.3 6.7 1.3 10 0M8.5 7.5L7.5 6C5.8 6.4 4.6 7 3.5 8 2.4 10.6 2 13.3 2.4 16c1.2 1 2.6 1.6 4 2l1-1.8M15.5 7.5l1-1.5c1.7.4 2.9 1 4 2 1.1 2.6 1.5 5.3 1.1 8-1.2 1-2.6 1.6-4 2l-1-1.8M9.3 13.2a.9.9 0 100-1.8.9.9 0 000 1.8zM14.7 13.2a.9.9 0 100-1.8.9.9 0 000 1.8z",
  },
];

function Method({ m, i }: { m: (typeof methods)[number]; i: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div
      className="group edge relative overflow-hidden rounded-[22px] bg-surface"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: 0.1 + i * 0.08, duration: 1, ease }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {/* światło za kursorem */}
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(260px_circle_at_var(--mx,50%)_var(--my,50%),rgb(139_108_255/0.16),transparent_70%)]" />
      <a href={m.href} {...(m.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="relative flex items-center gap-4 p-5 sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line-2 bg-white/[0.03] text-muted transition-colors duration-500 group-hover:border-accent/50 group-hover:text-accent-2">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={m.icon} />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-dim">{m.label}</span>
          <span className="block truncate text-[16px] tracking-[-0.01em] sm:text-[19px]">{m.value}</span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-2 transition-all duration-500 ease-out-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-ink group-hover:text-bg">
          <Arrow className="size-3.5" />
        </span>
      </a>
      {m.copy && (
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(m.copy!).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
          className="absolute top-3 right-[72px] rounded-full px-2.5 py-1 text-[11.5px] text-dim opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white/5 hover:text-ink focus-visible:opacity-100"
        >
          {copied ? "Skopiowano ✓" : "Kopiuj"}
        </button>
      )}
    </motion.div>
  );
}

function ServiceTile({ on, onClick, title, meta, sub }: { on: boolean; onClick: () => void; title: string; meta?: string; sub?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left ${meta ? "min-h-[92px]" : ""} transition-[border-color,background-color] duration-300 ${
        on ? "border-accent bg-accent/[0.1]" : "border-line-2 bg-white/[0.02] hover:border-white/25"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={`text-[15px] leading-snug transition-colors ${on ? "text-ink" : "text-muted group-hover:text-ink"}`}>{title}</span>
        <span className={`grid size-5 shrink-0 place-items-center rounded-full border transition-all duration-300 ${on ? "border-accent bg-accent" : "border-line-2"}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform duration-300 ease-out-expo ${on ? "scale-100" : "scale-0"}`} aria-hidden>
            <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {(meta || sub) && (
        <span className="mt-3 flex items-baseline justify-between gap-3 text-[13px]">
          {meta && <span className={on ? "text-accent-2" : "text-ink/80"}>{meta}</span>}
          {sub && <span className="text-dim">{sub}</span>}
        </span>
      )}
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
  const total = services.filter((s) => picked.includes(s.id)).reduce((a, s) => a + s.price, 0);

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
      <div className="mb-14 flex flex-col justify-between gap-8 lg:mb-20 lg:flex-row lg:items-end">
        <div>
          <FadeUp>
            <p className="kicker">Kontakt</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.8rem,6.5vw,6.4rem)]" lines={["Porozmawiajmy", <span key="2" className="text-muted">o Twoim projekcie</span>]} />
        </div>
        <FadeUp delay={0.1}>
          <p className="max-w-[360px] text-[17px] leading-relaxed text-muted">Wybierz, czego potrzebujesz, i opisz projekt — albo po prostu zadzwoń.</p>
        </FadeUp>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          {methods.map((m, i) => (
            <Method key={m.label} m={m} i={i} />
          ))}
          <motion.div
            className="relative mt-3 overflow-hidden rounded-[22px] border border-line p-5 sm:p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: 0.35, duration: 1, ease }}
          >
            <p className="text-[13px] text-dim">Co dalej?</p>
            <ol className="mt-5 space-y-5">
              {[
                ["Odpisuję i umawiamy krótką rozmowę", "Telefon, Discord albo e-mail — jak Ci wygodniej."],
                ["Dostajesz wycenę i termin", "Zakres, cena i harmonogram — na piśmie."],
                ["Startujemy", "Dostajesz dostęp do panelu klienta z postępem projektu."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="relative grid size-7 shrink-0 place-items-center rounded-full border border-line-2 text-[12px] text-accent-2">
                    {i + 1}
                    {i < 2 && <span className="absolute top-full left-1/2 h-5 w-px -translate-x-1/2 bg-line" />}
                  </span>
                  <span>
                    <span className="block text-[15px]">{t}</span>
                    <span className="mt-0.5 block text-[13.5px] text-dim">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
          <FadeUp delay={0.4} className="mt-auto hidden pt-8 lg:block">
            <p className="text-[13px] text-dim">Social</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted">
              {site.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link-u hover:text-ink">
                  {s.label}
                </a>
              ))}
            </div>
          </FadeUp>
        </div>

        <motion.div
          className="edge relative min-w-0 overflow-hidden rounded-[28px] bg-surface p-5 sm:p-9"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease }}
        >
          <div className="pointer-events-none absolute -top-40 right-0 size-[460px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" aria-hidden />

          <AnimatePresence mode="wait">
            {status.state === "sent" ? (
              <motion.div key="ok" className="relative flex min-h-[620px] flex-col items-center justify-center text-center" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
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
                <div className="flex items-baseline gap-3">
                  <span className="text-[13px] text-accent-2 tabular-nums">01</span>
                  <p className="text-[16px] text-ink">Czego potrzebujesz?</p>
                  <span className="text-[13px] text-dim">możesz wybrać kilka</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {services.map((s) => (
                    <ServiceTile key={s.id} on={picked.includes(s.id)} onClick={() => toggle(s.id)} title={s.name} meta={`od ${s.price} zł`} sub={s.time} />
                  ))}
                </div>
                <div className="mt-2.5">
                  <ServiceTile on={other} onClick={() => setOther((o) => !o)} title="Coś innego" />
                </div>

                <AnimatePresence initial={false}>
                  {other && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                      <div className="pt-2.5">
                        <Input name="other" label="Czego potrzebujesz? (np. katalog PDF, landing do kampanii)" required />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-10 flex items-baseline gap-3">
                  <span className="text-[13px] text-accent-2 tabular-nums">02</span>
                  <p className="text-[16px] text-ink">Twoje dane</p>
                </div>
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <Input name="name" label="Imię" required autoComplete="name" />
                  <Input name="phone" label="Telefon" type="tel" inputMode="tel" required autoComplete="tel" />
                  <Input name="email" label="E-mail" type="email" required autoComplete="email" className="sm:col-span-2" />
                  <Input name="message" label="Opowiedz krótko o projekcie" required area minLength={10} className="sm:col-span-2" />
                </div>
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
                      {status.message} Zadzwoń: <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="underline">{site.phone}</a>
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* podsumowanie + CTA */}
                <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
                  <div className="min-w-[150px] text-[13px] text-dim">
                    Start od
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={total}
                        className="block text-[24px] tracking-[-0.02em] text-ink"
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.45, ease }}
                      >
                        {total ? `${total} zł` : "—"}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <button
                    type="submit"
                    disabled={status.state === "sending"}
                    className="group relative flex h-[64px] flex-1 items-center justify-between overflow-hidden rounded-full bg-ink pr-2 pl-8 text-[17px] font-medium text-bg disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-accent [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-700 ease-out-expo group-hover:[clip-path:inset(0_0_0_0)]" />
                    <span className="relative transition-colors duration-500 group-hover:text-white">{status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}</span>
                    <span className="relative grid size-12 place-items-center rounded-full bg-bg text-ink">
                      <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
