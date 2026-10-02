"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { services, site, type ServiceId } from "@/lib/site";
import { track } from "./Analytics";
import { Arrow, Magnetic } from "./ui/Button";
import { FadeUp, Heading } from "./ui/Reveal";
import Input from "./ui/Input";
import { content } from "@/lib/content";

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

type Opt = ServiceId | "anim" | "other";
const options: { id: Opt; name: string; meta: string }[] = [
  ...services.map((s) => ({ id: s.id as Opt, name: s.name, meta: `od ${s.price} zł · ${s.time}` })),
  { id: "anim", name: "Animacja", meta: "Logo w ruchu, intro, social media" },
  { id: "other", name: "Coś innego", meta: "Opiszesz w kolejnym kroku" },
];

const empty = { services: [] as Opt[], other: "", budget: "", message: "", timeline: "", name: "", email: "", phone: "" };
type Data = typeof empty;
type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

/*
 * Animowane ikony usług — reagują na najechanie (hover) i na wybór (on).
 * Warianty płyną z kafelka: rest → hover → on.
 */
const spring = { type: "spring", stiffness: 380, damping: 18 } as const;
function ServiceIcon({ id, on, hover }: { id: Opt; on: boolean; hover: boolean }) {
  const st = on ? "on" : hover ? "hover" : "rest";
  const svg = (children: React.ReactNode) => (
    <svg viewBox="0 0 24 24" className="size-[26px] overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
  let art: React.ReactNode;
  if (id === "www")
    art = svg(
      <>
        <rect x="3" y="4.5" width="18" height="15" rx="2.2" />
        <path d="M3 8.5h18" />
        <motion.circle cx="5.6" cy="6.5" r="0.6" fill="currentColor" animate={{ opacity: st === "rest" ? 1 : [1, 0.2, 1] }} transition={{ repeat: st === "rest" ? 0 : Infinity, duration: 1 }} />
        {[11.5, 14.2, 16.9].map((y, i) => (
          <motion.path key={y} d={`M6 ${y}h${[12, 9, 6][i]}`} style={{ originX: 0 }} animate={{ scaleX: st === "rest" ? 1 : [0.15, 1] }} transition={{ delay: i * 0.08, duration: 0.5, ease }} />
        ))}
      </>,
    );
  else if (id === "shop")
    art = svg(
      <motion.g animate={{ y: st === "rest" ? 0 : [0, -3, 0], rotate: st === "rest" ? 0 : [0, -8, 6, 0] }} transition={{ duration: 0.6 }} style={{ originX: "50%", originY: "100%" }}>
        <path d="M5 8.5h14l-1.2 11a1.2 1.2 0 01-1.2 1H7.4a1.2 1.2 0 01-1.2-1z" />
        <motion.path d="M9 8.5V7a3 3 0 016 0v1.5" animate={{ y: st === "rest" ? 0 : -1.2 }} transition={spring} />
        <motion.circle cx="12" cy="14" r="1.6" fill="currentColor" stroke="none" initial={false} animate={{ scale: on ? 1 : 0 }} transition={spring} />
      </motion.g>,
    );
  else if (id === "brand")
    art = svg(
      <>
        <motion.path
          d="M12 3l2.6 5.6L20.5 9l-4.4 4 1.1 6L12 16.2 6.8 19l1.1-6-4.4-4 5.9-.4z"
          animate={{ rotate: st === "rest" ? 0 : 72, scale: st === "on" ? 1.08 : 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          style={{ originX: "50%", originY: "55%" }}
        />
        {[
          [20, 3],
          [3.5, 4],
          [21, 18],
        ].map(([x, y], i) => (
          <motion.path
            key={i}
            d={`M${x} ${y - 1.2}v2.4M${x - 1.2} ${y}h2.4`}
            strokeWidth="1.2"
            initial={false}
            animate={{ opacity: st === "rest" ? 0 : 1, scale: st === "rest" ? 0 : 1 }}
            transition={{ delay: i * 0.08, ...spring }}
          />
        ))}
      </>,
    );
  else if (id === "ui")
    art = svg(
      <>
        <motion.rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" animate={st === "rest" ? { x: 0, y: 0 } : { x: 9.5, y: 0 }} transition={spring} />
        <motion.rect x="13" y="3.5" width="7.5" height="4" rx="1.2" animate={st === "rest" ? { x: 0, y: 0 } : { x: -9.5, y: 0 }} transition={{ ...spring, delay: 0.04 }} />
        <motion.rect x="13" y="10" width="7.5" height="10.5" rx="1.5" animate={st === "rest" ? { x: 0 } : { x: -9.5 }} transition={{ ...spring, delay: 0.08 }} />
        <motion.rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" animate={st === "rest" ? { x: 0 } : { x: 9.5 }} transition={{ ...spring, delay: 0.12 }} />
      </>,
    );
  else if (id === "anim")
    art = svg(
      <>
        <motion.circle cx="12" cy="12" r="9" strokeDasharray="4 3" animate={{ rotate: st === "rest" ? 0 : 180 }} transition={{ duration: 1.2, ease }} style={{ originX: "50%", originY: "50%" }} />
        <motion.path
          d="M10 8.5v7l5.5-3.5z"
          fill={on ? "currentColor" : "none"}
          animate={{ scale: st === "rest" ? 1 : [1, 1.25, 1], x: st === "rest" ? 0 : [0, 1, 0] }}
          transition={{ duration: 0.6 }}
          style={{ originX: "50%", originY: "50%" }}
        />
      </>,
    );
  else
    art = svg(
      <>
        <motion.path d="M12 5v14M5 12h14" animate={{ rotate: st === "rest" ? 0 : 135 }} transition={{ type: "spring", stiffness: 220, damping: 14 }} style={{ originX: "50%", originY: "50%" }} />
        <motion.circle cx="12" cy="12" r="9.5" strokeWidth="1" initial={false} animate={{ pathLength: st === "rest" ? 0 : 1, opacity: st === "rest" ? 0 : 0.6 }} transition={{ duration: 0.6, ease }} />
      </>,
    );
  return (
    <span
      className={`relative grid size-14 shrink-0 place-items-center rounded-2xl border transition-colors duration-500 ${on ? "border-accent/60 bg-gradient-to-br from-accent/35 to-accent/10 text-white shadow-[0_0_24px_rgb(139_108_255/0.35)]" : "border-line-2 bg-white/[0.03] text-muted group-hover:border-white/20 group-hover:text-ink"}`}
    >
      {art}
    </span>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={`grid size-6 shrink-0 place-items-center rounded-full border transition-all duration-300 ${on ? "border-accent bg-accent shadow-[0_0_16px_rgb(139_108_255/0.6)]" : "border-line-2"}`}>
      <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden>
        <motion.path
          d="M2 5.2l2 2 4-4.4"
          stroke="white"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />
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

const direct = [
  { label: "E-mail", value: site.email, short: "Napisz maila", href: `mailto:${site.email}`, copy: site.email, kind: "mail" as const },
  { label: "Telefon", value: site.phone, short: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, copy: site.phone, kind: "phone" as const },
  { label: "Discord", value: "Napisz na Discordzie", href: discord, kind: "discord" as const },
];

// Animowane ikony kanałów — grają po najechaniu na wiersz (group/dc)
function DirectIcon({ kind }: { kind: "mail" | "phone" | "discord" }) {
  const common = "size-[18px]";
  if (kind === "mail")
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 7.5A1.5 1.5 0 014.5 6h15A1.5 1.5 0 0121 7.5v10a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5z" />
        {/* klapka koperty otwiera się */}
        <path d="M3.5 7l8.5 6.5L20.5 7" className="origin-[50%_28%] transition-transform duration-500 ease-out-expo group-hover/dc:[transform:scaleY(-1)_translateY(-4px)]" />
        {/* list wysuwa się z koperty */}
        <path d="M8 13V9.5h8V13" className="translate-y-2 opacity-0 transition-all duration-500 ease-out-expo group-hover/dc:-translate-y-1 group-hover/dc:opacity-100" />
      </svg>
    );
  if (kind === "phone")
    return (
      <svg viewBox="0 0 24 24" className={`${common} overflow-visible`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <g className="origin-center group-hover/dc:animate-[ring_0.7s_ease-in-out_2]">
          <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 005.6 5.6l1.4-2.3L19.5 15v3.5a1.5 1.5 0 01-1.6 1.5C10.6 19.5 4.5 13.4 4 6.1A1.5 1.5 0 015 4z" />
        </g>
        {/* fale dźwięku */}
        <path d="M15 5a4.5 4.5 0 014 4" className="opacity-0 transition-opacity delay-100 duration-300 group-hover/dc:opacity-100" />
        <path d="M15 1.8a7.7 7.7 0 017.2 7.2" className="opacity-0 transition-opacity delay-200 duration-300 group-hover/dc:opacity-100" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={`${common} transition-transform duration-500 ease-out-expo group-hover/dc:-translate-y-0.5 group-hover/dc:-rotate-6`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.5 7.5c2.3-.7 4.7-.7 7 0M7 17c3.3 1.3 6.7 1.3 10 0M8.5 7.5L7.5 6C5.8 6.4 4.6 7 3.5 8 2.4 10.6 2 13.3 2.4 16c1.2 1 2.6 1.6 4 2l1-1.8M15.5 7.5l1-1.5c1.7.4 2.9 1 4 2 1.1 2.6 1.5 5.3 1.1 8-1.2 1-2.6 1.6-4 2l-1-1.8" />
      {/* oczka mrugają */}
      <g className="origin-[50%_55%] group-hover/dc:animate-[blink_0.9s_ease-in-out_2]">
        <path d="M9.3 13.2a.9.9 0 100-1.8.9.9 0 000 1.8zM14.7 13.2a.9.9 0 100-1.8.9.9 0 000 1.8z" fill="currentColor" />
      </g>
    </svg>
  );
}

// Bezpośredni kontakt: ikona w kółku (wypełnia się fioletem) + wartość + „Kopiuj”
function DirectItem({ c }: { c: (typeof direct)[number] }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="group/dc flex items-center gap-3">
      <a href={c.href} {...(c.kind === "discord" ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex min-w-0 items-center gap-4 rounded-2xl py-1.5 pr-2">
        <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line-2 text-muted transition-[border-color,color] duration-500 group-hover/dc:border-accent/60 group-hover/dc:text-white">
          <span className="absolute inset-0 scale-0 rounded-full bg-gradient-to-br from-accent to-[#6d4fe6] transition-transform duration-500 ease-out-expo group-hover/dc:scale-100" />
          <span className="relative">
            <DirectIcon kind={c.kind} />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] text-dim">{c.label}</span>
          <span className="link-u block truncate text-[16.5px] text-muted transition-colors group-hover/dc:text-ink">{c.value}</span>
        </span>
      </a>
      {c.copy && (
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(c.copy!).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            })
          }
          className="mt-4 shrink-0 text-[12.5px] text-dim opacity-0 transition-opacity duration-300 group-hover/dc:opacity-100 hover:text-ink focus-visible:opacity-100"
        >
          {copied ? "Skopiowano ✓" : "Kopiuj"}
        </button>
      )}
    </li>
  );
}

export default function Contact() {
  const [step, setStep] = useState(0);
  const [hov, setHov] = useState<Opt | null>(null);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<Data>(empty);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sender, setSender] = useState("");
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set =
    <K extends keyof Data>(k: K) =>
    (v: Data[K]) => {
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
    const add = (id: ServiceId) => setD((x) => ({ ...x, services: x.services.includes(id) ? x.services : [...x.services, id] }));
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

  const toggle = (id: Opt) => set("services")(d.services.includes(id) ? d.services.filter((x) => x !== id) : [...d.services, id]);
  const names = d.services.map((id) => options.find((o) => o.id === id)!.name);
  const serviceLabel = names.length > 2 ? `${names[0]} +${names.length - 1}` : names.join(", ");
  const topic = d.services
    .map((id) => {
      const s = services.find((x) => x.id === id);
      return s ? `${s.name} (od ${s.price} zł)` : id === "anim" ? "Animacja" : "Coś innego";
    })
    .join(", ");

  const validate = (s: number): string => {
    if (s === 0 && !d.services.length) return "Wybierz przynajmniej jedną usługę.";
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
          topic,
          budget: d.budget,
          timeline: d.timeline,
          message: d.message,
          company,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Nie udało się wysłać wiadomości.");
      track("form", "submit", names.join(", "));
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

  const availability = content().availability;

  return (
    <section id="kontakt" className="relative mx-auto max-w-[1400px] px-5 py-32 sm:px-10 lg:py-40">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        {/* lewa kolumna: nagłówek + bezpośredni kontakt (jak w stopce) */}
        {/* lewa kolumna jedzie razem z przewijaniem do końca karty formularza */}
        <div className="flex min-w-0 flex-col lg:sticky lg:top-28 lg:self-start">
          <FadeUp>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="kicker">Kontakt</p>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] ${availability.open ? "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200" : "border-amber-300/25 bg-amber-300/[0.07] text-amber-100"}`}>
                <span className="relative flex size-1.5">
                  <span className={`absolute inset-0 animate-ping rounded-full ${availability.open ? "bg-emerald-400/70" : "bg-amber-300/70"}`} />
                  <span className={`relative size-1.5 rounded-full ${availability.open ? "bg-emerald-400" : "bg-amber-300"}`} />
                </span>
                {availability.text}
              </span>
            </div>
          </FadeUp>
          <Heading
            className="mt-7 text-[clamp(2.6rem,4.3vw,4.4rem)]"
            lines={[
              "Porozmawiajmy",
              <span key="2" className="text-muted">
                o Twoim projekcie
              </span>,
            ]}
          />
          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-[380px] text-[17px] leading-relaxed text-muted">Cztery krótkie pytania — zajmie to mniej niż minutę. Odezwę się z pytaniami i wyceną.</p>
          </FadeUp>

          <FadeUp delay={0.15} className="mt-12">
            <p className="text-[13px] text-dim">Wolisz bezpośrednio?</p>
            <ul className="mt-5 space-y-2">
              {direct.map((c) => (
                <DirectItem key={c.label} c={c} />
              ))}
            </ul>
          </FadeUp>
        </div>

        <motion.div
          className="edge relative min-w-0 overflow-hidden rounded-[28px] bg-surface"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease }}
        >
          <div className="pointer-events-none absolute -top-40 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.12),transparent)]" aria-hidden />

          <AnimatePresence mode="wait" initial={false}>
            {status.state === "sent" ? (
              <motion.div key="ok" className="relative flex flex-col items-center px-6 py-20 text-center sm:py-24" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="relative">
                  <Burst />
                  <svg viewBox="0 0 64 64" className="relative size-20" fill="none" aria-hidden>
                    <motion.circle cx="32" cy="32" r="30" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
                    <motion.path
                      d="M20 33l8 8 16-17"
                      stroke="var(--color-accent-2)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.5, duration: 0.6, ease }}
                    />
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
                          <motion.span
                            className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                            initial={false}
                            animate={{ width: i < step ? "100%" : i === step ? "45%" : "0%" }}
                            transition={{ duration: 0.7, ease }}
                          />
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
                    <h3 className="h-display text-[clamp(1.9rem,3.4vw,2.8rem)]">
                      {questions[step].split(" ").map((w, i) => (
                        <motion.span key={i} className="mr-[0.25em] inline-block" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05, duration: 0.6, ease }}>
                          {w}
                        </motion.span>
                      ))}
                    </h3>

                    {step === 0 && (
                      <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {options.map((o, i) => {
                          const on = d.services.includes(o.id);
                          return (
                            <motion.button
                              key={o.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggle(o.id)}
                              onPointerEnter={() => setHov(o.id)}
                              onPointerLeave={() => setHov(null)}
                              className={`group relative flex items-center gap-4 overflow-hidden rounded-[22px] border p-4 text-left transition-colors duration-300 sm:p-5 ${
                                on ? "border-accent bg-accent/[0.12]" : "border-line-2 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                              }`}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <ServiceIcon id={o.id} on={on} hover={hov === o.id} />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[17px] text-ink">{o.name}</span>
                                <span className={`mt-0.5 block text-[13px] ${on ? "text-accent-2" : "text-dim"}`}>{o.meta}</span>
                              </span>
                              <Check on={on} />
                            </motion.button>
                          );
                        })}
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
                                {d.timeline === t ? (
                                  <motion.span layoutId="ct-time" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                                ) : (
                                  <span className="absolute inset-0 rounded-full border border-line-2" />
                                )}
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
                    <motion.p
                      key={error + status.message}
                      role="alert"
                      className="mt-5 text-[14px] text-red-300"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
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
                    <span className="text-[13px] text-dim">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={d.services.length} className="inline-block" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.25 }}>
                          {d.services.length ? `Wybrano: ${d.services.length}` : "Możesz wybrać kilka"}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  )}
                  {
                    <Magnetic strength={0.12}>
                      <button
                        type="submit"
                        disabled={status.state === "sending" || (step === 0 && !d.services.length) || (step === 1 && !d.budget)}
                        className="group relative ml-auto flex h-[60px] items-center gap-6 overflow-hidden rounded-full bg-ink pr-2 pl-7 text-[16px] font-medium text-bg transition-opacity duration-500 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <span className="absolute inset-0 bg-accent [clip-path:circle(0%_at_90%_50%)] transition-[clip-path] duration-700 ease-out-expo group-hover:[clip-path:circle(150%_at_90%_50%)]" />
                        <span className="relative transition-colors duration-500 group-hover:text-white">{step < 3 ? "Dalej" : status.state === "sending" ? "Wysyłanie…" : "Wyślij zapytanie"}</span>
                        <span className="relative grid size-11 place-items-center overflow-hidden rounded-full bg-bg text-ink">
                          <Arrow className={`size-4 transition-transform duration-500 ease-out-expo ${step < 3 ? "rotate-45 group-hover:translate-x-0.5" : "group-hover:translate-x-5 group-hover:-translate-y-5"}`} />
                          {step === 3 && <Arrow className="absolute size-4 -translate-x-5 translate-y-5 transition-transform duration-500 ease-out-expo group-hover:translate-x-0 group-hover:translate-y-0" />}
                        </span>
                      </button>
                    </Magnetic>
                  }
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
