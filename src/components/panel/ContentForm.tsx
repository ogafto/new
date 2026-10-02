"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { resetSiteContent, restoreSiteContent, saveSiteContent } from "@/app/panel/admin/tresci/actions";
import type { Content } from "@/lib/content";
import type { ServiceId } from "@/lib/site";
import { Badge, Btn, Card, ConfirmBtn, ease, field, Icon, ICONS, Label, Tabs, Toggle } from "./kit";

type Section = "soon" | "hero" | "notice" | "contact" | "services" | "process" | "seo" | "legal" | "history";
const SECTIONS: { value: Section; label: string }[] = [
  { value: "soon", label: "Tryb zapowiedzi" },
  { value: "hero", label: "Strona główna" },
  { value: "notice", label: "Ogłoszenie i status" },
  { value: "contact", label: "Kontakt" },
  { value: "services", label: "Usługi i ceny" },
  { value: "process", label: "Proces" },
  { value: "seo", label: "SEO" },
  { value: "legal", label: "Dane firmy" },
  { value: "history", label: "Historia" },
];
type Version = { ts: number; actor: string | null; section: string };
const when = (ts: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(ts);

function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return <span className={`text-[11.5px] tabular-nums ${n > max ? "text-amber-300" : "text-dim"}`}>{n}/{max}</span>;
}

export default function ContentForm({ initial, defaults, services, history }: { initial: Content; defaults: Content; services: { id: ServiceId; name: string }[]; history: Version[] }) {
  const router = useRouter();
  const [c, setC] = useState<Content>(initial);
  const [tab, setTab] = useState<Section>("hero");
  useEffect(() => {
    const h = location.hash.slice(1) as Section;
    if (SECTIONS.some((x) => x.value === h)) setTimeout(() => setTab(h), 0);
  }, []);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>();
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(c) !== JSON.stringify(initial);

  const set = <K extends keyof Content>(k: K, v: Content[K]) => setC((x) => ({ ...x, [k]: v }));
  const save = () =>
    start(async () => {
      const r = await saveSiteContent(c, SECTIONS.find((s) => s.value === tab)!.label);
      setMsg(r);
      if (r.ok) router.refresh();
      setTimeout(() => setMsg(undefined), 3500);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="-mx-1 overflow-x-auto px-1 pb-1" data-lenis-prevent>
          <Tabs id="content" value={tab} onChange={setTab} items={SECTIONS} />
        </div>
        <p className="text-[12.5px] text-dim">Zmiany pojawiają się na stronie od razu po zapisaniu.</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease }}>
          {tab === "hero" && (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <Card>
                <h2 className="mb-5 text-[16px] font-medium">Nagłówek i opis</h2>
                <div className="space-y-4">
                  <Label label="Linia 1">
                    <input className={`${field} h-11`} value={c.hero.line1} onChange={(e) => set("hero", { ...c.hero, line1: e.target.value })} placeholder={defaults.hero.line1} />
                  </Label>
                  <Label label="Linia 2">
                    <input className={`${field} h-11`} value={c.hero.line2} onChange={(e) => set("hero", { ...c.hero, line2: e.target.value })} placeholder={defaults.hero.line2} />
                  </Label>
                  <Label label="Linia 3 (fioletowa)">
                    <input className={`${field} h-11`} value={c.hero.accent} onChange={(e) => set("hero", { ...c.hero, accent: e.target.value })} placeholder={defaults.hero.accent} />
                  </Label>
                  <Label label="Opis pod nagłówkiem">
                    <textarea rows={3} className={`${field} resize-none py-3`} value={c.hero.text} onChange={(e) => set("hero", { ...c.hero, text: e.target.value })} placeholder={defaults.hero.text} />
                  </Label>
                </div>
              </Card>
              <Card pad={false} className="min-h-[320px]">
                <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_20%,rgb(139_108_255/0.22),transparent_70%)]" aria-hidden />
                <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                  <p className="mb-4 text-[12px] text-dim">Podgląd</p>
                  <p className="h-display text-[clamp(1.9rem,4.2vw,3.2rem)] leading-[0.95]">
                    {c.hero.line1 || defaults.hero.line1}
                    <br />
                    {c.hero.line2 || defaults.hero.line2}
                    <br />
                    <span className="text-accent-2">{c.hero.accent || defaults.hero.accent}</span>
                  </p>
                  <p className="mt-5 max-w-[380px] border-t border-line pt-4 text-[13.5px] leading-relaxed text-muted">{c.hero.text || defaults.hero.text}</p>
                </div>
              </Card>
            </div>
          )}

          {tab === "soon" && (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <Card glow={c.soon.enabled}>
                <div className={`mb-5 flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors ${c.soon.enabled ? "border-amber-300/30 bg-amber-300/[0.07]" : "border-line"}`}>
                  <div>
                    <h2 className="text-[16px] font-medium">{c.soon.enabled ? "Strona jest ukryta" : "Strona jest widoczna"}</h2>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-dim">
                      {c.soon.enabled
                        ? "Odwiedzający widzą tylko ekran zapowiedzi. Ty (zalogowany admin) widzisz pełną stronę. Panel i logowanie działają normalnie."
                        : "Włącz, żeby zamiast strony pokazać ekran „Coś nowego nadchodzi” z przyciskiem Discorda."}
                    </p>
                  </div>
                  <Toggle label="" checked={c.soon.enabled} onChange={(v) => set("soon", { ...c.soon, enabled: v })} />
                </div>
                <div className="grid gap-4">
                  <Label label="Mały napis nad tytułem">
                    <input className={`${field} h-11`} maxLength={40} value={c.soon.kicker} onChange={(e) => set("soon", { ...c.soon, kicker: e.target.value })} />
                  </Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Label label="Tytuł">
                      <input className={`${field} h-11`} maxLength={40} value={c.soon.title} onChange={(e) => set("soon", { ...c.soon, title: e.target.value })} />
                    </Label>
                    <Label label="Druga linia (podświetlona)">
                      <input className={`${field} h-11`} maxLength={40} value={c.soon.accent} onChange={(e) => set("soon", { ...c.soon, accent: e.target.value })} />
                    </Label>
                  </div>
                  <Label label="Opis">
                    <textarea rows={3} maxLength={240} className={`${field} resize-none py-3`} value={c.soon.text} onChange={(e) => set("soon", { ...c.soon, text: e.target.value })} />
                  </Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Label label="Tekst przycisku">
                      <input className={`${field} h-11`} maxLength={40} value={c.soon.button} onChange={(e) => set("soon", { ...c.soon, button: e.target.value })} />
                    </Label>
                    <Label label="Link do Discorda" hint="Puste = link z zakładki Kontakt">
                      <input type="url" className={`${field} h-11`} value={c.soon.link} onChange={(e) => set("soon", { ...c.soon, link: e.target.value })} placeholder="https://discord.gg/…" />
                    </Label>
                  </div>
                  <Label label="Odliczanie do (opcjonalnie)" hint="Pokaże licznik dni, godzin, minut i sekund">
                    <div className="flex gap-2">
                      <input type="datetime-local" className={`${field} h-11`} value={c.soon.date} onChange={(e) => set("soon", { ...c.soon, date: e.target.value })} />
                      {c.soon.date && (
                        <Btn type="button" size="sm" variant="ghost" className="!h-11" onClick={() => set("soon", { ...c.soon, date: "" })}>
                          Usuń
                        </Btn>
                      )}
                    </div>
                  </Label>
                </div>
              </Card>
              <Card pad={false} className="min-h-[420px]">
                <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgb(139_108_255/0.35),transparent_70%),radial-gradient(30%_30%_at_50%_45%,rgb(180_162_255/0.25),transparent_70%)]" aria-hidden />
                <div className="relative flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
                  <p className="kicker">{c.soon.kicker || "afto.works"}</p>
                  <p className="h-display mt-5 text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.95]">
                    {c.soon.title || "Coś nowego"}
                    <br />
                    <span className="text-accent-2">{c.soon.accent || "nadchodzi."}</span>
                  </p>
                  <p className="mt-4 max-w-[340px] text-[13px] leading-relaxed text-muted">{c.soon.text}</p>
                  <span className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#5865F2] px-5 text-[13.5px] font-medium text-white">{c.soon.button || "Dołącz na Discordzie"}</span>
                  <a href="/wkrotce" target="_blank" className="mt-6 text-[12.5px] text-dim underline decoration-white/20 underline-offset-4 hover:text-ink">
                    Otwórz pełny podgląd ↗
                  </a>
                </div>
              </Card>
            </div>
          )}

          {tab === "notice" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[16px] font-medium">Pasek ogłoszeń</h2>
                    <p className="mt-0.5 text-[13px] text-dim">Elegancka wiadomość na dole strony — promocja, nowość, wolne terminy.</p>
                  </div>
                  <Toggle label="" checked={c.announcement.enabled} onChange={(v) => set("announcement", { ...c.announcement, enabled: v })} />
                </div>
                <div className={`space-y-4 transition-opacity ${c.announcement.enabled ? "" : "opacity-50"}`}>
                  <Label label="Treść">
                    <input className={`${field} h-11`} maxLength={120} value={c.announcement.text} onChange={(e) => set("announcement", { ...c.announcement, text: e.target.value })} />
                  </Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Label label="Tekst przycisku">
                      <input className={`${field} h-11`} maxLength={30} value={c.announcement.label} onChange={(e) => set("announcement", { ...c.announcement, label: e.target.value })} />
                    </Label>
                    <Label label="Link" hint="np. /portfolio albo /#kontakt">
                      <input className={`${field} h-11`} value={c.announcement.link} onChange={(e) => set("announcement", { ...c.announcement, link: e.target.value })} />
                    </Label>
                  </div>
                </div>
                <div className="mt-5 flex justify-center rounded-2xl bg-[radial-gradient(60%_80%_at_50%_100%,rgb(139_108_255/0.18),transparent)] p-5">
                  <span className="edge inline-flex max-w-full items-center gap-3 rounded-full bg-surface/90 py-1.5 pr-1.5 pl-4 text-[13px] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)]">
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inset-0 animate-ping rounded-full bg-accent-2/70" />
                      <span className="relative size-2 rounded-full bg-accent-2" />
                    </span>
                    <span className="truncate">{c.announcement.text || "Treść ogłoszenia"}</span>
                    {c.announcement.label && <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-[12px] font-medium text-bg">{c.announcement.label}</span>}
                  </span>
                </div>
              </Card>
              <Card>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[16px] font-medium">Status dostępności</h2>
                    <p className="mt-0.5 text-[13px] text-dim">Widoczny przy formularzu kontaktowym — buduje zaufanie i pilność.</p>
                  </div>
                  <Toggle label="" checked={c.availability.open} onChange={(v) => set("availability", { ...c.availability, open: v, text: v ? "Przyjmuję nowe projekty" : "Wolne terminy od przyszłego miesiąca" })} />
                </div>
                <Label label="Tekst statusu">
                  <input className={`${field} h-11`} maxLength={60} value={c.availability.text} onChange={(e) => set("availability", { ...c.availability, text: e.target.value })} />
                </Label>
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line p-4">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] ${c.availability.open ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-amber-300/25 bg-amber-300/10 text-amber-100"}`}>
                    <span className="relative flex size-2">
                      <span className={`absolute inset-0 animate-ping rounded-full ${c.availability.open ? "bg-emerald-400/70" : "bg-amber-300/70"}`} />
                      <span className={`relative size-2 rounded-full ${c.availability.open ? "bg-emerald-400" : "bg-amber-300"}`} />
                    </span>
                    {c.availability.text}
                  </span>
                  <span className="text-[12px] text-dim">podgląd</span>
                </div>
              </Card>
            </div>
          )}

          {tab === "process" && (
            <div className="grid gap-4 md:grid-cols-2">
              {c.steps.map((st, i) => {
                const upd = (p: Partial<typeof st>) => set("steps", c.steps.map((x, j) => (j === i ? { ...x, ...p } : x)));
                return (
                  <Card key={i} delay={i * 0.04}>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-[12.5px] text-accent-2 tabular-nums">0{i + 1}</span>
                      <h2 className="text-[16px] font-medium">Etap {i + 1}</h2>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                        <Label label="Nazwa">
                          <input className={`${field} h-11`} value={st.title} onChange={(e) => upd({ title: e.target.value })} />
                        </Label>
                        <Label label="Podtytuł">
                          <input className={`${field} h-11`} value={st.lead} onChange={(e) => upd({ lead: e.target.value })} />
                        </Label>
                      </div>
                      <Label label="Opis">
                        <textarea rows={3} className={`${field} resize-none py-3`} value={st.text} onChange={(e) => upd({ text: e.target.value })} />
                      </Label>
                      <Label label="Punkty (po przecinku)">
                        <input className={`${field} h-11`} value={st.points.join(", ")} onChange={(e) => upd({ points: e.target.value.split(",").map((x) => x.trimStart()).filter((x, k, a) => x || k === a.length - 1) })} />
                      </Label>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {tab === "history" && (
            <Card>
              <h2 className="text-[16px] font-medium">Historia zmian</h2>
              <p className="mt-0.5 mb-5 text-[13px] text-dim">Ostatnie 20 zapisów. Każdy zapis zachowuje poprzednią wersję — możesz do niej wrócić jednym kliknięciem.</p>
              {history.length === 0 ? (
                <p className="py-8 text-center text-[13.5px] text-dim">Jeszcze nic nie zapisano.</p>
              ) : (
                <ul className="relative space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-line">
                  {history.map((h, i) => (
                    <li key={h.ts} className="relative flex items-center gap-4 rounded-xl py-2.5 pr-2 pl-9 transition-colors hover:bg-white/[0.02]">
                      <span className={`absolute top-1/2 left-[6px] size-[11px] -translate-y-1/2 rounded-full ring-4 ring-surface ${i === 0 ? "bg-accent" : "bg-white/25"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px]">Przed: {h.section}</span>
                        <span className="block text-[12px] text-dim">
                          {when(h.ts)}
                          {h.actor ? ` · ${h.actor}` : ""}
                        </span>
                      </span>
                      {i === 0 && <Badge tone="accent">ostatnia</Badge>}
                      <Btn
                        size="sm"
                        icon={ICONS.refresh}
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const r = await restoreSiteContent(h.ts);
                            if (r.content) setC(r.content);
                            setMsg(r);
                            router.refresh();
                            setTimeout(() => setMsg(undefined), 3500);
                          })
                        }
                      >
                        Przywróć
                      </Btn>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {tab === "contact" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-5 text-[16px] font-medium">Dane kontaktowe</h2>
                <div className="space-y-4">
                  <Label label="E-mail" hint="Stopka, sekcja kontaktu, panel klienta, dokumenty prawne.">
                    <input type="email" className={`${field} h-11`} value={c.email} onChange={(e) => set("email", e.target.value)} />
                  </Label>
                  <Label label="Telefon">
                    <input className={`${field} h-11`} value={c.phone} onChange={(e) => set("phone", e.target.value)} />
                  </Label>
                </div>
              </Card>
              <Card>
                <h2 className="mb-5 text-[16px] font-medium">Social media</h2>
                <div className="space-y-4">
                  {c.socials.map((s, i) => (
                    <Label key={s.label} label={s.label} hint={s.label === "Discord" ? "Link zaproszenia na serwer albo do profilu." : undefined}>
                      <input
                        type="url"
                        className={`${field} h-11`}
                        value={s.href}
                        onChange={(e) => set("socials", c.socials.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))}
                        placeholder="https://"
                      />
                    </Label>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === "services" && (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((s, i) => {
                const v = c.services[s.id];
                const upd = (p: Partial<typeof v>) => set("services", { ...c.services, [s.id]: { ...v, ...p } });
                return (
                  <Card key={s.id} delay={i * 0.04}>
                    <h2 className="mb-5 text-[16px] font-medium">{s.name}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Label label="Cena od (zł)">
                        <input type="number" min={0} inputMode="numeric" className={`${field} h-11`} value={v.price} onChange={(e) => upd({ price: Number(e.target.value) })} />
                      </Label>
                      <Label label="Czas realizacji">
                        <input className={`${field} h-11`} value={v.time} onChange={(e) => upd({ time: e.target.value })} placeholder="od 3 dni" />
                      </Label>
                      <Label label="Krótki opis" className="sm:col-span-2">
                        <textarea rows={2} className={`${field} resize-none py-3`} value={v.description} onChange={(e) => upd({ description: e.target.value })} />
                      </Label>
                    </div>
                  </Card>
                );
              })}
              <p className="text-[12.5px] text-dim md:col-span-2">Ceny i czasy trafiają do formularza kontaktu, na podstrony usług (/uslugi) i do danych strukturalnych dla Google.</p>
            </div>
          )}

          {tab === "seo" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-5 text-[16px] font-medium">Wynik w Google</h2>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between">
                      <span className="text-[13px] text-muted">Tytuł strony</span>
                      <Counter value={c.seo.title} max={65} />
                    </div>
                    <input className={`${field} h-11`} value={c.seo.title} onChange={(e) => set("seo", { ...c.seo, title: e.target.value })} />
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between">
                      <span className="text-[13px] text-muted">Opis</span>
                      <Counter value={c.seo.description} max={160} />
                    </div>
                    <textarea rows={4} className={`${field} resize-none py-3`} value={c.seo.description} onChange={(e) => set("seo", { ...c.seo, description: e.target.value })} />
                  </div>
                  <p className="text-[12px] leading-relaxed text-dim">Najważniejsza fraza na początku tytułu. Google ucina tytuły powyżej ~60 znaków i opisy powyżej ~155.</p>
                </div>
              </Card>
              <Card>
                <p className="mb-4 text-[12px] text-dim">Podgląd wyniku</p>
                <div className="rounded-2xl bg-white p-5 text-left">
                  <p className="text-[12.5px] text-[#4d5156]">afto.works</p>
                  <p className="mt-1 line-clamp-1 text-[19px] leading-snug text-[#1a0dab]">{c.seo.title || defaults.seo.title}</p>
                  <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-[#4d5156]">{c.seo.description || defaults.seo.description}</p>
                </div>
              </Card>
            </div>
          )}

          {tab === "legal" && (
            <Card>
              <h2 className="mb-1 text-[16px] font-medium">Dane do regulaminu i polityki prywatności</h2>
              <p className="mb-5 text-[13px] text-dim">Pojawiają się w dokumentach prawnych i danych strukturalnych.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Label label="Imię i nazwisko / firma">
                  <input className={`${field} h-11`} value={c.legal.owner} onChange={(e) => set("legal", { ...c.legal, owner: e.target.value })} />
                </Label>
                <Label label="Forma działalności">
                  <input className={`${field} h-11`} value={c.legal.form} onChange={(e) => set("legal", { ...c.legal, form: e.target.value })} />
                </Label>
                <Label label="Ulica">
                  <input className={`${field} h-11`} value={c.legal.street} onChange={(e) => set("legal", { ...c.legal, street: e.target.value })} />
                </Label>
                <Label label="Kod i miasto">
                  <input className={`${field} h-11`} value={c.legal.city} onChange={(e) => set("legal", { ...c.legal, city: e.target.value })} />
                </Label>
                <Label label="Data aktualizacji dokumentów" className="sm:col-span-2">
                  <input className={`${field} h-11`} value={c.legal.updated} onChange={(e) => set("legal", { ...c.legal, updated: e.target.value })} placeholder="2 października 2026" />
                </Label>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* pasek zapisu */}
      <div className="sticky bottom-3 z-30 lg:bottom-5">
        <motion.div
          className="edge flex flex-col gap-3 rounded-[20px] bg-bg/95 p-3 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.9)] sm:flex-row sm:items-center sm:justify-between sm:pl-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={msg?.ok ?? msg?.error ?? (dirty ? "dirty" : "clean")}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 text-[13.5px] ${msg?.error ? "text-red-200" : msg?.ok ? "text-emerald-200" : dirty ? "text-amber-200" : "text-dim"}`}
            >
              {msg?.ok && <Icon d={ICONS.check} className="size-4" />}
              {msg?.error ?? msg?.ok ?? (dirty ? "Masz niezapisane zmiany" : "Wszystko zapisane")}
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-2">
            <ConfirmBtn
              label="Przywrócić domyślne?"
              onConfirm={() =>
                start(async () => {
                  const r = await resetSiteContent();
                  setC(defaults);
                  setMsg(r);
                  router.refresh();
                })
              }
            >
              Domyślne
            </ConfirmBtn>
            <Btn type="button" variant="primary" icon={ICONS.check} disabled={pending || !dirty} onClick={save} className="flex-1 sm:flex-none">
              {pending ? "Zapisywanie…" : "Zapisz zmiany"}
            </Btn>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
