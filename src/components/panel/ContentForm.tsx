"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { resetSiteContent, restoreSiteContent, saveSiteContent } from "@/app/panel/admin/tresci/actions";
import { setSitePreview } from "@/app/panel/actions";
import type { Content } from "@/lib/content";
import type { ServiceId } from "@/lib/site";
import { Badge, Btn, Card, ConfirmBtn, ease, field, Icon, ICONS, Label, Toggle } from "./kit";
import IconPicker from "./IconPicker";
import { SectionCard, SectionNav, type NavItem, type NavStatus } from "./settings/SectionNav";

type Section = "soon" | "hero" | "texts" | "notice" | "contact" | "services" | "process" | "seo" | "legal" | "history";
const ROCKET = "M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3a14 14 0 017-8c2.5-1 5-1 7-1 0 2 0 4.5-1 7a14 14 0 01-8 7zM9 12H5l2-4h4M12 15v4l4-2v-4M15 9h.01";
const SECTIONS: { value: Section; label: string; icon: string; keys: (keyof Content)[] }[] = [
  { value: "soon", label: "Tryb zapowiedzi", icon: ROCKET, keys: ["soon"] },
  { value: "hero", label: "Strona główna", icon: ICONS.home, keys: ["hero"] },
  { value: "texts", label: "Teksty sekcji", icon: ICONS.doc, keys: ["texts", "forms"] },
  { value: "notice", label: "Ogłoszenie i status", icon: ICONS.bell, keys: ["announcement", "availability"] },
  { value: "contact", label: "Kontakt", icon: ICONS.phone, keys: ["email", "phone", "socials"] },
  { value: "services", label: "Usługi i ceny", icon: ICONS.money, keys: ["services", "customServices", "hiddenServices"] },
  { value: "process", label: "Proces", icon: ICONS.layers, keys: ["steps"] },
  { value: "seo", label: "SEO", icon: ICONS.search, keys: ["seo"] },
  { value: "legal", label: "Dane firmy", icon: ICONS.shield, keys: ["legal"] },
  { value: "history", label: "Historia", icon: ICONS.clock, keys: [] },
];
const TEXT_GROUPS: { key: keyof Content["texts"]; title: string; text: string; icon: string; fields: Record<string, [string, "line" | "area"]> }[] = [
  { key: "hero", title: "Pierwszy ekran", text: "Przyciski pod nagłówkiem (nagłówek i opis są w „Strona główna”).", icon: ICONS.home, fields: { cta: ["Przycisk główny", "line"], ctaSecondary: ["Przycisk drugi", "line"], recent: ["Podpis przy miniaturach projektów", "line"] } },
  { key: "work", title: "Portfolio", text: "Sekcja z projektami na stronie głównej.", icon: ICONS.grid, fields: { label: ["Duży napis / etykieta", "line"], text: ["Opis pod sekcją", "area"], more: ["Link do całego portfolio", "line"], view: ["Przycisk na projekcie", "line"] } },
  {
    key: "process",
    title: "Proces",
    text: "Nagłówek nad etapami i wezwanie na dole (same etapy są w „Proces”).",
    icon: ICONS.layers,
    fields: { kicker: ["Etykieta", "line"], title: ["Nagłówek — linia 1", "line"], accent: ["Nagłówek — linia 2 (fiolet)", "line"], text: ["Opis", "area"], ctaText: ["Wezwanie — początek", "line"], ctaAccent: ["Wezwanie — wyróżnione", "line"], ctaButton: ["Przycisk", "line"] },
  },
  {
    key: "contact",
    title: "Kontakt i formularz",
    text: "Nagłówek sekcji, pytania kolejnych kroków formularza i podziękowanie po wysłaniu.",
    icon: ICONS.mail,
    fields: {
      kicker: ["Etykieta", "line"],
      title: ["Nagłówek — linia 1", "line"],
      accent: ["Nagłówek — linia 2", "line"],
      text: ["Opis", "area"],
      direct: ["Nad danymi kontaktowymi", "line"],
      q1: ["Pytanie 1 (usługa)", "line"],
      q2: ["Pytanie 2 (budżet)", "line"],
      q3: ["Pytanie 3 (opis)", "line"],
      q4: ["Pytanie 4 (kontakt)", "line"],
      example: ["Przykład w opisie projektu", "line"],
      when: ["Pytanie o termin", "line"],
      send: ["Przycisk wysyłania", "line"],
      successTitle: ["Po wysłaniu — nagłówek", "line"],
      successText: ["Po wysłaniu — tekst", "area"],
    },
  },
  { key: "footer", title: "Stopka", text: "Przewijany napis i hasło pod logo.", icon: ICONS.site, fields: { marquee: ["Przewijany napis", "line"], tagline: ["Hasło pod logo", "area"] } },
];

type Version = { ts: number; actor: string | null; section: string };
const when = (ts: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(ts);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  const pct = Math.min(1, n / max);
  return (
    <span className="flex items-center gap-2">
      <span className="h-1 w-10 overflow-hidden rounded-full bg-white/[0.06]">
        <span className={`block h-full rounded-full transition-[width] duration-300 ${n > max ? "bg-amber-300" : "bg-accent"}`} style={{ width: `${pct * 100}%` }} />
      </span>
      <span className={`text-[11.5px] tabular-nums ${n > max ? "text-amber-300" : "text-dim"}`}>
        {n}/{max}
      </span>
    </span>
  );
}

/* Ramka podglądu w stylu okna przeglądarki */
function Preview({ children, url = "afto.works", className = "", delay = 0.06, light = false }: { children: React.ReactNode; url?: string; className?: string; delay?: number; light?: boolean }) {
  return (
    <motion.div
      className={`edge relative flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-[#0a0a0e] shadow-[0_30px_80px_-40px_rgb(0_0_0/0.95)] ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease }}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
        </span>
        <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md bg-white/[0.04] px-3 py-1 text-[11.5px] text-dim">
          <Icon d={ICONS.shield} className="size-3 shrink-0" />
          <span className="truncate">{url}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-dim">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative size-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="hidden sm:inline">na żywo</span>
        </span>
      </div>
      <div className={`relative flex-1 ${light ? "bg-white" : ""}`}>{children}</div>
    </motion.div>
  );
}

const input = `${field} h-11`;
const area = `${field} resize-none py-3 leading-relaxed`;

export default function ContentForm({ initial, defaults, services, history }: { initial: Content; defaults: Content; services: { id: ServiceId; name: string }[]; history: Version[] }) {
  const router = useRouter();
  const [c, setC] = useState<Content>(initial);
  // punkt odniesienia dla „niezapisanych zmian”: ostatni zapis albo świeże dane z serwera
  const [base, setBase] = useState<Content>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setBase(initial);
  }
  const [tab, setTab] = useState<Section>("hero");
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1) as Section;
      if (SECTIONS.some((x) => x.value === h)) setTab(h);
    };
    const t = setTimeout(read, 0);
    addEventListener("hashchange", read);
    return () => {
      clearTimeout(t);
      removeEventListener("hashchange", read);
    };
  }, []);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>();
  const [pending, start] = useTransition();
  const dirty = !same(c, base);
  const changed = SECTIONS.filter((s) => s.keys.some((k) => !same(c[k], base[k])));

  const pick = (s: string) => {
    setTab(s as Section);
    setHash(s);
    if (window.scrollY > 200) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const set = <K extends keyof Content>(k: K, v: Content[K]) => setC((x) => ({ ...x, [k]: v }));
  const flash = (r: { ok?: string; error?: string }) => {
    setMsg(r);
    setTimeout(() => setMsg(undefined), 3500);
  };
  const save = useCallback(
    () =>
      start(async () => {
        const label = changed.length ? changed.map((s) => s.label).join(", ") : SECTIONS.find((s) => s.value === tab)!.label;
        const r = await saveSiteContent(c, label);
        flash(r);
        if (r.ok) {
          setBase(c);
          router.refresh();
        }
      }),
    [c, changed, tab, router],
  );

  // ⌘S / Ctrl+S
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !pending) save();
      }
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [dirty, pending, save]);

  const items: NavItem[] = SECTIONS.map((s) => {
    let status: NavStatus | undefined;
    if (changed.includes(s)) status = "dirty";
    else if (s.value === "soon") status = c.soon.enabled ? "warn" : undefined;
    else if (s.value === "notice") status = c.announcement.enabled ? "ok" : undefined;
    return { id: s.value, label: s.label, icon: s.icon, status, meta: s.value === "history" && history.length ? String(history.length) : undefined };
  });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 lg:grid-cols-[212px_minmax(0,1fr)]">
      <SectionNav
        id="content"
        items={items}
        active={tab}
        onPick={pick}
        footer={
          <a href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-muted transition-colors hover:bg-white/[0.03] hover:text-ink">
            <Icon d={ICONS.site} className="size-4 text-dim" />
            Otwórz stronę
          </a>
        }
      />

      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3, ease }} className="space-y-4">
            {tab === "hero" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <SectionCard icon={ICONS.home} title="Nagłówek i opis" text="Pierwszy ekran strony głównej.">
                  <div className="space-y-4">
                    <Label label="Linia 1">
                      <input className={input} value={c.hero.line1} onChange={(e) => set("hero", { ...c.hero, line1: e.target.value })} placeholder={defaults.hero.line1} />
                    </Label>
                    <Label label="Linia 2">
                      <input className={input} value={c.hero.line2} onChange={(e) => set("hero", { ...c.hero, line2: e.target.value })} placeholder={defaults.hero.line2} />
                    </Label>
                    <Label label="Linia 3 · akcent">
                      <input className={`${input} text-accent-2`} value={c.hero.accent} onChange={(e) => set("hero", { ...c.hero, accent: e.target.value })} placeholder={defaults.hero.accent} />
                    </Label>
                    <Label label="Opis">
                      <textarea rows={3} className={area} value={c.hero.text} onChange={(e) => set("hero", { ...c.hero, text: e.target.value })} placeholder={defaults.hero.text} />
                    </Label>
                  </div>
                </SectionCard>
                <Preview className="min-h-[360px]">
                  <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_10%,rgb(139_108_255/0.28),transparent_70%)]" aria-hidden />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(80%_70%_at_70%_20%,black,transparent)]" aria-hidden />
                  <div className="relative flex h-full min-h-[320px] flex-col justify-end p-6 sm:p-8">
                    <span className="kicker mb-5 self-start !text-[11px]">Web designer · {new Date().getFullYear()}</span>
                    <p className="h-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[0.95] break-words">
                      {c.hero.line1 || defaults.hero.line1}
                      <br />
                      {c.hero.line2 || defaults.hero.line2}
                      <br />
                      <span className="text-accent-2">{c.hero.accent || defaults.hero.accent}</span>
                    </p>
                    <p className="mt-5 max-w-[380px] border-t border-white/[0.08] pt-4 text-[13px] leading-relaxed text-muted">{c.hero.text || defaults.hero.text}</p>
                  </div>
                </Preview>
              </div>
            )}

            {tab === "soon" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <SectionCard
                  icon={ROCKET}
                  title="Tryb zapowiedzi"
                  glow={c.soon.enabled}
                  badge={<Badge tone={c.soon.enabled ? "amber" : "green"}>{c.soon.enabled ? "Strona ukryta" : "Strona widoczna"}</Badge>}
                >
                  <div className={`mb-5 flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors duration-300 ${c.soon.enabled ? "border-amber-300/30 bg-amber-300/[0.06]" : "border-white/[0.07] bg-white/[0.02]"}`}>
                    <div className="min-w-0">
                      <p className="text-[14px]">{c.soon.enabled ? "Odwiedzający widzą ekran zapowiedzi" : "Pokaż ekran zapowiedzi zamiast strony"}</p>
                      <p className="mt-0.5 text-[12.5px] text-dim">{c.soon.enabled ? "Panel i logowanie działają normalnie." : "Z przyciskiem Discorda i opcjonalnym odliczaniem."}</p>
                    </div>
                    <Toggle label="" checked={c.soon.enabled} onChange={(v) => set("soon", { ...c.soon, enabled: v })} />
                  </div>
                  <div className="grid gap-4">
                    <Label label="Napis nad tytułem">
                      <input className={input} maxLength={40} value={c.soon.kicker} onChange={(e) => set("soon", { ...c.soon, kicker: e.target.value })} />
                    </Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Label label="Tytuł">
                        <input className={input} maxLength={40} value={c.soon.title} onChange={(e) => set("soon", { ...c.soon, title: e.target.value })} />
                      </Label>
                      <Label label="Druga linia · akcent">
                        <input className={`${input} text-accent-2`} maxLength={40} value={c.soon.accent} onChange={(e) => set("soon", { ...c.soon, accent: e.target.value })} />
                      </Label>
                    </div>
                    <Label label="Opis">
                      <textarea rows={3} maxLength={240} className={area} value={c.soon.text} onChange={(e) => set("soon", { ...c.soon, text: e.target.value })} />
                    </Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Label label="Tekst przycisku">
                        <input className={input} maxLength={40} value={c.soon.button} onChange={(e) => set("soon", { ...c.soon, button: e.target.value })} />
                      </Label>
                      <Label label="Link do Discorda" hint="Puste = link z Kontaktu">
                        <input type="url" className={input} value={c.soon.link} onChange={(e) => set("soon", { ...c.soon, link: e.target.value })} placeholder="https://discord.gg/…" />
                      </Label>
                    </div>
                    <Label label="Odliczanie do" hint="Opcjonalnie">
                      <div className="flex gap-2">
                        <input type="datetime-local" className={`${input} min-w-0`} value={c.soon.date} onChange={(e) => set("soon", { ...c.soon, date: e.target.value })} />
                        {c.soon.date && (
                          <Btn type="button" size="sm" variant="ghost" className="!h-11" onClick={() => set("soon", { ...c.soon, date: "" })}>
                            Usuń
                          </Btn>
                        )}
                      </div>
                    </Label>
                  </div>
                </SectionCard>
                <div className="flex min-w-0 flex-col gap-3">
                  <Preview url="afto.works/wkrotce" className="min-h-[440px] flex-1">
                    <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgb(139_108_255/0.32),transparent_70%),radial-gradient(28%_28%_at_50%_45%,rgb(180_162_255/0.22),transparent_70%)]" aria-hidden />
                    <div className="relative flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center">
                      <p className="kicker">{c.soon.kicker || "afto.works"}</p>
                      <p className="h-display mt-5 text-[clamp(2rem,3.8vw,3.2rem)] leading-[0.95]">
                        {c.soon.title || "Coś nowego"}
                        <br />
                        <span className="text-accent-2">{c.soon.accent || "nadchodzi."}</span>
                      </p>
                      <p className="mt-4 max-w-[340px] text-[13px] leading-relaxed text-muted">{c.soon.text}</p>
                      {c.soon.date && (
                        <div className="mt-5 flex gap-2">
                          {["dni", "godz", "min", "sek"].map((u) => (
                            <span key={u} className="grid w-12 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-1.5">
                              <span className="text-[16px] tabular-nums">00</span>
                              <span className="text-[9.5px] text-dim">{u}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#5865F2] px-5 text-[13.5px] font-medium text-white shadow-[0_12px_30px_-10px_rgb(88_101_242/0.8)]">{c.soon.button || "Dołącz na Discordzie"}</span>
                    </div>
                  </Preview>
                  <div className="flex flex-wrap gap-2">
                    <a href="/wkrotce" target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 px-3.5 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-ink">
                      <Icon d={ICONS.site} className="size-3.5" /> Ekran zapowiedzi
                    </a>
                    {base.soon.enabled && (
                      <button
                        type="button"
                        onClick={async () => {
                          await setSitePreview(true);
                          window.open("/", "_blank");
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 px-3.5 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-ink"
                      >
                        <Icon d={ICONS.eye} className="size-3.5" /> Pełna strona (tylko Ty)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "notice" && (
              <>
                <SectionCard icon={ICONS.bell} title="Pasek ogłoszeń" text="Nad nawigacją strony." badge={<Toggle label="" checked={c.announcement.enabled} onChange={(v) => set("announcement", { ...c.announcement, enabled: v })} />}>
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className={`space-y-4 transition-opacity duration-300 ${c.announcement.enabled ? "" : "opacity-50"}`}>
                      <Label label="Treść">
                        <input className={input} maxLength={120} value={c.announcement.text} onChange={(e) => set("announcement", { ...c.announcement, text: e.target.value })} />
                      </Label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Label label="Przycisk">
                          <input className={input} maxLength={30} value={c.announcement.label} onChange={(e) => set("announcement", { ...c.announcement, label: e.target.value })} />
                        </Label>
                        <Label label="Link" hint="/portfolio, /#kontakt…">
                          <input className={input} value={c.announcement.link} onChange={(e) => set("announcement", { ...c.announcement, link: e.target.value })} />
                        </Label>
                      </div>
                    </div>
                    <Preview delay={0.1} className="min-h-[200px]">
                      <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_0%,rgb(139_108_255/0.2),transparent)]" aria-hidden />
                      <div className={`relative flex h-full min-h-[180px] flex-col items-center px-4 pt-5 transition-opacity duration-300 ${c.announcement.enabled ? "" : "opacity-40"}`}>
                        <span className="edge inline-flex max-w-full items-center gap-3 rounded-full bg-surface/90 py-1.5 pr-1.5 pl-4 text-[12.5px] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)]">
                          <span className="relative flex size-2 shrink-0">
                            <span className="absolute inset-0 animate-ping rounded-full bg-accent-2/70" />
                            <span className="relative size-2 rounded-full bg-accent-2" />
                          </span>
                          <span className="truncate">{c.announcement.text || "Treść ogłoszenia"}</span>
                          {c.announcement.label && <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-[11.5px] font-medium text-bg">{c.announcement.label}</span>}
                        </span>
                        <div className="mt-6 flex w-full max-w-[300px] items-center justify-between opacity-40" aria-hidden>
                          <span className="h-2 w-12 rounded-full bg-white/30" />
                          <span className="flex gap-2">
                            <span className="h-1.5 w-8 rounded-full bg-white/20" />
                            <span className="h-1.5 w-8 rounded-full bg-white/20" />
                            <span className="h-1.5 w-8 rounded-full bg-white/20" />
                          </span>
                        </div>
                        <div className="mt-6 w-full max-w-[300px] space-y-2 opacity-25" aria-hidden>
                          <span className="block h-4 w-4/5 rounded bg-white/40" />
                          <span className="block h-4 w-3/5 rounded bg-white/40" />
                        </div>
                      </div>
                    </Preview>
                  </div>
                </SectionCard>
                <SectionCard
                  icon={ICONS.target}
                  title="Status dostępności"
                  text="Przy formularzu i w stopce."
                  delay={0.05}
                  badge={<Toggle label="" checked={c.availability.open} onChange={(v) => set("availability", { ...c.availability, open: v, text: v ? "Przyjmuję nowe projekty" : "Wolne terminy od przyszłego miesiąca" })} />}
                >
                  <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <Label label="Tekst statusu">
                      <input className={input} maxLength={60} value={c.availability.text} onChange={(e) => set("availability", { ...c.availability, text: e.target.value })} />
                    </Label>
                    <div className="flex h-11 items-center">
                      <span className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] ${c.availability.open ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-amber-300/25 bg-amber-300/10 text-amber-100"}`}>
                        <span className="relative flex size-2 shrink-0">
                          <span className={`absolute inset-0 animate-ping rounded-full ${c.availability.open ? "bg-emerald-400/70" : "bg-amber-300/70"}`} />
                          <span className={`relative size-2 rounded-full ${c.availability.open ? "bg-emerald-400" : "bg-amber-300"}`} />
                        </span>
                        <span className="truncate">{c.availability.text || "—"}</span>
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {tab === "process" && (
              <div className="grid gap-4 xl:grid-cols-2">
                {c.steps.map((st, i) => {
                  const upd = (p: Partial<typeof st>) => set("steps", c.steps.map((x, j) => (j === i ? { ...x, ...p } : x)));
                  return (
                    <Card key={i} delay={i * 0.04}>
                      <div className="mb-5 flex items-center gap-3">
                        <span className="h-display grid size-10 place-items-center rounded-xl bg-[linear-gradient(135deg,rgb(139_108_255/0.3),rgb(139_108_255/0.08))] text-[15px] text-accent-2 ring-1 ring-accent/25 tabular-nums">0{i + 1}</span>
                        <div className="min-w-0">
                          <h2 className="truncate text-[16px] font-medium">{st.title || `Etap ${i + 1}`}</h2>
                          <p className="truncate text-[12.5px] text-dim">{st.lead || "Podtytuł"}</p>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                          <Label label="Nazwa">
                            <input className={input} value={st.title} onChange={(e) => upd({ title: e.target.value })} />
                          </Label>
                          <Label label="Podtytuł">
                            <input className={input} value={st.lead} onChange={(e) => upd({ lead: e.target.value })} />
                          </Label>
                        </div>
                        <Label label="Opis">
                          <textarea rows={3} className={area} value={st.text} onChange={(e) => upd({ text: e.target.value })} />
                        </Label>
                        <Label label="Punkty" hint="Po przecinku">
                          <input className={input} value={st.points.join(", ")} onChange={(e) => upd({ points: e.target.value.split(",").map((x) => x.trimStart()).filter((x, k, a) => x || k === a.length - 1) })} />
                        </Label>
                        {st.points.filter(Boolean).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {st.points.filter(Boolean).map((p, k) => (
                              <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[12px] text-muted">
                                <Icon d={ICONS.check} className="size-3 text-accent-2" />
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {tab === "history" && (
              <SectionCard icon={ICONS.clock} title="Historia zmian" text="Ostatnie 20 zapisów — każdą wersję możesz przywrócić." badge={history.length ? <Badge>{history.length}</Badge> : undefined}>
                {history.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <span className="grid size-12 place-items-center rounded-2xl border border-line-2 text-dim">
                      <Icon d={ICONS.clock} className="size-5" />
                    </span>
                    <p className="mt-4 text-[14px] text-muted">Jeszcze nic nie zapisano</p>
                  </div>
                ) : (
                  <ul className="relative -mx-2 space-y-0.5 before:absolute before:top-5 before:bottom-5 before:left-[25px] before:w-px before:bg-white/[0.07]">
                    {history.map((h, i) => (
                      <motion.li
                        key={h.ts}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.03, duration: 0.35, ease }}
                        className="group relative flex items-center gap-3 rounded-xl py-2.5 pr-2 pl-11 transition-colors hover:bg-white/[0.03]"
                      >
                        <span className={`absolute top-1/2 left-[20px] size-[11px] -translate-y-1/2 rounded-full ring-4 ring-[rgb(16_16_22)] ${i === 0 ? "bg-accent shadow-[0_0_10px_rgb(139_108_255/0.9)]" : "bg-white/20"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px]">
                            <span className="text-dim">Przed: </span>
                            {h.section}
                          </span>
                          <span className="block truncate text-[12px] text-dim">
                            {when(h.ts)}
                            {h.actor ? ` · ${h.actor}` : ""}
                          </span>
                        </span>
                        {i === 0 && <Badge tone="accent">ostatnia</Badge>}
                        <Btn
                          size="sm"
                          variant="ghost"
                          icon={ICONS.refresh}
                          disabled={pending}
                          className="sm:opacity-60 sm:group-hover:opacity-100"
                          onClick={() =>
                            start(async () => {
                              const r = await restoreSiteContent(h.ts);
                              if (r.content) {
                                setC(r.content);
                                setBase(r.content);
                              }
                              flash(r);
                              router.refresh();
                            })
                          }
                        >
                          <span className="hidden sm:inline">Przywróć</span>
                        </Btn>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            )}

            {tab === "contact" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <SectionCard icon={ICONS.mail} title="Dane kontaktowe" text="Stopka, kontakt, panel klienta, dokumenty.">
                  <div className="space-y-4">
                    <Label label="E-mail">
                      <div className="relative">
                        <Icon d={ICONS.mail} className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-dim" />
                        <input type="email" className={`${input} pl-10`} value={c.email} onChange={(e) => set("email", e.target.value)} />
                      </div>
                    </Label>
                    <Label label="Telefon">
                      <div className="relative">
                        <Icon d={ICONS.phone} className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-dim" />
                        <input className={`${input} pl-10`} value={c.phone} onChange={(e) => set("phone", e.target.value)} />
                      </div>
                    </Label>
                  </div>
                </SectionCard>
                <SectionCard icon={ICONS.link} title="Social media" delay={0.04} badge={<Badge>{`${c.socials.filter((s) => s.href).length}/${c.socials.length}`}</Badge>}>
                  <div className="space-y-3">
                    {c.socials.map((s, i) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className={`w-[84px] shrink-0 truncate text-[13px] ${s.href ? "text-ink" : "text-dim"}`}>{s.label}</span>
                        <input
                          type="url"
                          className={`${input} min-w-0`}
                          value={s.href}
                          onChange={(e) => set("socials", c.socials.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))}
                          placeholder="https://"
                          aria-label={s.label}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === "services" && (
              <div className="grid gap-4 xl:grid-cols-2">
                {services.map((s, i) => {
                  const v = c.services[s.id];
                  const upd = (p: Partial<typeof v>) => set("services", { ...c.services, [s.id]: { ...v, ...p } });
                  const hidden = c.hiddenServices.includes(s.id);
                  return (
                    <Card key={s.id} delay={i * 0.04} className={hidden ? "opacity-60" : ""}>
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-[16px] font-medium">{v.name || s.name}</h2>
                          <div className="mt-2">
                            <Toggle checked={!hidden} onChange={(on) => set("hiddenServices", on ? c.hiddenServices.filter((x) => x !== s.id) : [...c.hiddenServices, s.id])} label={hidden ? "Ukryta" : "Widoczna w formularzach"} />
                          </div>
                        </div>
                        <span className="shrink-0 text-right">
                          <span className="block text-[11px] text-dim">od</span>
                          <span className="h-display block text-[24px] leading-none tabular-nums">{Number(v.price || 0).toLocaleString("pl-PL")} zł</span>
                        </span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Label label="Nazwa" className="sm:col-span-2">
                          <input className={input} value={v.name ?? s.name} maxLength={60} onChange={(e) => upd({ name: e.target.value })} />
                        </Label>
                        <div className="sm:col-span-2">
                          <IconPicker value={v.icon ?? ""} name={v.name || s.name} onChange={(icon) => upd({ icon: icon || ({ www: "web", shop: "shop", brand: "brand", ui: "ui" } as Record<string, string>)[s.id] || "other" })} />
                        </div>
                        <Label label="Cena od (zł)">
                          <input type="number" min={0} inputMode="numeric" className={`${input} tabular-nums`} value={v.price} onChange={(e) => upd({ price: Number(e.target.value) })} />
                        </Label>
                        <Label label="Czas realizacji">
                          <input className={input} value={v.time} onChange={(e) => upd({ time: e.target.value })} placeholder="od 3 dni" />
                        </Label>
                        <Label label="Krótki opis" className="sm:col-span-2">
                          <textarea rows={2} className={area} value={v.description} onChange={(e) => upd({ description: e.target.value })} />
                        </Label>
                      </div>
                    </Card>
                  );
                })}
                {c.customServices.map((v, i) => {
                  const upd = (p: Partial<typeof v>) => set("customServices", c.customServices.map((x) => (x.id === v.id ? { ...x, ...p } : x)));
                  return (
                    <Card key={v.id} delay={(services.length + i) * 0.04} glow>
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-[11.5px] text-accent-2">Własna usługa</span>
                          <h2 className="mt-2 text-[16px] font-medium">{v.name || "Nowa usługa"}</h2>
                        </div>
                        <ConfirmBtn onConfirm={() => set("customServices", c.customServices.filter((x) => x.id !== v.id))}>Usuń</ConfirmBtn>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Label label="Nazwa" className="sm:col-span-2">
                          <input className={input} value={v.name} maxLength={60} onChange={(e) => upd({ name: e.target.value })} placeholder="np. Kampania Google Ads" />
                        </Label>
                        <div className="sm:col-span-2">
                          <IconPicker value={v.icon ?? ""} name={v.name} onChange={(icon) => upd({ icon })} />
                        </div>
                        <Label label="Cena od (zł)">
                          <input type="number" min={0} inputMode="numeric" className={`${input} tabular-nums`} value={v.price} onChange={(e) => upd({ price: Number(e.target.value) })} />
                        </Label>
                        <Label label="Czas realizacji">
                          <input className={input} value={v.time} onChange={(e) => upd({ time: e.target.value })} placeholder="od 3 dni" />
                        </Label>
                        <Label label="Krótki opis" className="sm:col-span-2">
                          <textarea rows={2} className={area} value={v.description} onChange={(e) => upd({ description: e.target.value })} />
                        </Label>
                      </div>
                    </Card>
                  );
                })}
                <button
                  type="button"
                  onClick={() => set("customServices", [...c.customServices, { id: `c-${Math.random().toString(36).slice(2, 8)}`, name: "", price: 0, time: "", description: "", icon: "" }])}
                  disabled={c.customServices.length >= 20}
                  className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-line-2 text-muted transition-colors hover:border-accent/50 hover:bg-accent/[0.04] hover:text-ink disabled:opacity-40"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-accent text-white shadow-[0_0_24px_-6px_rgb(139_108_255/0.9)] transition-transform duration-500 group-hover:rotate-90">
                    <Icon d={ICONS.plus} className="size-5" />
                  </span>
                  <span className="text-[15px]">Dodaj usługę</span>
                  <span className="text-[12.5px] text-dim">Pojawi się w formularzu na stronie, na /uslugi, w stopce i w „Zamów usługę” u klientów</span>
                </button>
              </div>
            )}

            {tab === "texts" && (
              <div className="grid gap-4 xl:grid-cols-2">
                {TEXT_GROUPS.map((g) => (
                  <SectionCard key={g.key} icon={g.icon} title={g.title} text={g.text}>
                    <div className="space-y-4">
                      {Object.entries(g.fields).map(([f, [label, kind]]) => {
                        const val = (c.texts[g.key] as Record<string, string>)[f] ?? "";
                        const upd = (v: string) => set("texts", { ...c.texts, [g.key]: { ...c.texts[g.key], [f]: v } });
                        return (
                          <Label key={f} label={label}>
                            {kind === "area" ? <textarea rows={2} className={area} value={val} onChange={(e) => upd(e.target.value)} /> : <input className={input} value={val} onChange={(e) => upd(e.target.value)} />}
                          </Label>
                        );
                      })}
                    </div>
                  </SectionCard>
                ))}
                <SectionCard icon={ICONS.money} title="Formularz — budżety" text="Kafelki budżetu na stronie i w „Zamów usługę” u klientów.">
                  <div className="space-y-2">
                    {c.forms.budgets.map((b, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                        <input className={input} value={b.v} onChange={(e) => set("forms", { ...c.forms, budgets: c.forms.budgets.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)) })} placeholder="np. 500–1 000 zł" />
                        <input className={input} value={b.hint} onChange={(e) => set("forms", { ...c.forms, budgets: c.forms.budgets.map((x, j) => (j === i ? { ...x, hint: e.target.value } : x)) })} placeholder="Podpowiedź" />
                        <button type="button" onClick={() => set("forms", { ...c.forms, budgets: c.forms.budgets.filter((_, j) => j !== i) })} className="grid size-11 place-items-center rounded-xl text-dim hover:bg-red-400/10 hover:text-red-200" aria-label="Usuń">
                          <Icon d={ICONS.trash} className="size-4" />
                        </button>
                      </div>
                    ))}
                    {c.forms.budgets.length < 10 && (
                      <button type="button" onClick={() => set("forms", { ...c.forms, budgets: [...c.forms.budgets, { v: "", hint: "" }] })} className="flex h-10 items-center gap-2 rounded-full bg-white/[0.05] px-4 text-[13px] text-muted hover:text-ink">
                        <Icon d={ICONS.plus} className="size-4" /> Dodaj budżet
                      </button>
                    )}
                  </div>
                </SectionCard>
                <SectionCard icon={ICONS.clock} title="Formularz — terminy" text="Odpowiedzi na pytanie „Kiedy chcesz zacząć?” (strona i panel klienta).">
                  <div className="space-y-2">
                    {c.forms.timelines.map((t, i) => (
                      <div key={i} className="flex gap-2">
                        <input className={input} value={t} onChange={(e) => set("forms", { ...c.forms, timelines: c.forms.timelines.map((x, j) => (j === i ? e.target.value : x)) })} />
                        <button type="button" onClick={() => set("forms", { ...c.forms, timelines: c.forms.timelines.filter((_, j) => j !== i) })} className="grid size-11 shrink-0 place-items-center rounded-xl text-dim hover:bg-red-400/10 hover:text-red-200" aria-label="Usuń">
                          <Icon d={ICONS.trash} className="size-4" />
                        </button>
                      </div>
                    ))}
                    {c.forms.timelines.length < 8 && (
                      <button type="button" onClick={() => set("forms", { ...c.forms, timelines: [...c.forms.timelines, ""] })} className="flex h-10 items-center gap-2 rounded-full bg-white/[0.05] px-4 text-[13px] text-muted hover:text-ink">
                        <Icon d={ICONS.plus} className="size-4" /> Dodaj termin
                      </button>
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === "seo" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <SectionCard icon={ICONS.search} title="Wynik w Google" text="Tytuł i opis strony głównej.">
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[13px] text-muted">Tytuł</span>
                        <Counter value={c.seo.title} max={65} />
                      </div>
                      <input className={input} value={c.seo.title} onChange={(e) => set("seo", { ...c.seo, title: e.target.value })} />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[13px] text-muted">Opis</span>
                        <Counter value={c.seo.description} max={160} />
                      </div>
                      <textarea rows={4} className={area} value={c.seo.description} onChange={(e) => set("seo", { ...c.seo, description: e.target.value })} />
                    </div>
                  </div>
                </SectionCard>
                <Preview url="google.com/search?q=afto" light className="self-start">
                  <div className="p-5 text-left sm:p-6">
                    <div className="mb-5 flex h-9 items-center gap-2 rounded-full border border-[#dfe1e5] px-4 text-[13px] text-[#4d5156]">
                      <Icon d={ICONS.search} className="size-3.5 text-[#9aa0a6]" />
                      afto works
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-7 place-items-center rounded-full bg-[#f1f3f4] text-[11px] font-semibold text-[#202124]">a.</span>
                      <span className="min-w-0">
                        <span className="block text-[13px] leading-tight text-[#202124]">afto.works</span>
                        <span className="block text-[11.5px] leading-tight text-[#4d5156]">https://afto.works</span>
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[19px] leading-snug text-[#1a0dab]">{c.seo.title || defaults.seo.title}</p>
                    <p className="mt-1 line-clamp-3 text-[13.5px] leading-relaxed text-[#4d5156]">{c.seo.description || defaults.seo.description}</p>
                  </div>
                </Preview>
              </div>
            )}

            {tab === "legal" && (
              <SectionCard icon={ICONS.shield} title="Dane firmy" text="Do regulaminu i polityki prywatności.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Label label="Imię i nazwisko / firma">
                    <input className={input} value={c.legal.owner} onChange={(e) => set("legal", { ...c.legal, owner: e.target.value })} />
                  </Label>
                  <Label label="Forma działalności">
                    <input className={input} value={c.legal.form} onChange={(e) => set("legal", { ...c.legal, form: e.target.value })} />
                  </Label>
                  <Label label="Ulica">
                    <input className={input} value={c.legal.street} onChange={(e) => set("legal", { ...c.legal, street: e.target.value })} />
                  </Label>
                  <Label label="Kod i miasto">
                    <input className={input} value={c.legal.city} onChange={(e) => set("legal", { ...c.legal, city: e.target.value })} />
                  </Label>
                  <Label label="Data aktualizacji dokumentów" className="sm:col-span-2">
                    <input className={input} value={c.legal.updated} onChange={(e) => set("legal", { ...c.legal, updated: e.target.value })} placeholder="2 października 2026" />
                  </Label>
                </div>
              </SectionCard>
            )}
          </motion.div>
        </AnimatePresence>

        {/* pasek zapisu */}
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 mt-4 lg:bottom-5">
          <motion.div
            className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-[20px] border bg-[rgb(12_12_17/0.92)] p-2 pl-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-xl transition-colors duration-500 sm:p-2.5 sm:pl-5 ${dirty ? "border-accent/30" : "border-white/[0.08]"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45, ease }}
          >
            {dirty && <span className="pointer-events-none absolute inset-x-0 -top-px h-px bg-[linear-gradient(90deg,transparent,rgb(180_162_255/0.9),transparent)]" aria-hidden />}
            <AnimatePresence mode="wait">
              <motion.div
                key={msg?.ok ?? msg?.error ?? (dirty ? `d${changed.length}` : "clean")}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-[13px] sm:text-[13.5px]"
              >
                <span className={`size-2 shrink-0 rounded-full ${msg?.error ? "bg-red-400" : msg?.ok ? "bg-emerald-400" : dirty ? "bg-accent-2 shadow-[0_0_10px_rgb(180_162_255/0.9)]" : "bg-emerald-400/60"}`} />
                <span className={`min-w-0 truncate ${msg?.error ? "text-red-200" : msg?.ok ? "text-emerald-200" : dirty ? "text-ink" : "text-dim"}`}>
                  {msg?.error ?? msg?.ok ?? (dirty ? `Niezapisane: ${changed.map((s) => s.label).join(", ") || "zmiany"}` : "Wszystko zapisane")}
                </span>
              </motion.div>
            </AnimatePresence>
            <div className="flex shrink-0 items-center gap-1.5">
              {dirty && (
                <Btn type="button" size="sm" variant="ghost" onClick={() => setC(base)} disabled={pending} className="!hidden sm:!inline-flex">
                  Odrzuć
                </Btn>
              )}
              <ConfirmBtn
                label="Na pewno?"
                onConfirm={() =>
                  start(async () => {
                    const r = await resetSiteContent();
                    setC(defaults);
                    setBase(defaults);
                    flash(r);
                    router.refresh();
                  })
                }
              >
                <span className="hidden sm:inline">Domyślne</span>
              </ConfirmBtn>
              <Btn type="button" variant="primary" size="sm" icon={ICONS.check} disabled={pending || !dirty} onClick={save}>
                {pending ? "Zapisuję…" : "Zapisz"}
                <kbd className="ml-1 hidden rounded border border-black/15 px-1 font-sans text-[10.5px] text-black/50 lg:inline">⌘S</kbd>
              </Btn>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function setHash(h: string) {
  history.replaceState(null, "", `#${h}`);
}
