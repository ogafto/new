"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { resetSiteContent, saveSiteContent } from "@/app/panel/admin/tresci/actions";
import type { Content } from "@/lib/content";
import type { ServiceId } from "@/lib/site";
import { Btn, Card, ConfirmBtn, ease, field, Icon, ICONS, Label, Tabs } from "./kit";

type Section = "hero" | "contact" | "services" | "seo" | "legal";
const SECTIONS: { value: Section; label: string }[] = [
  { value: "hero", label: "Strona główna" },
  { value: "contact", label: "Kontakt" },
  { value: "services", label: "Usługi i ceny" },
  { value: "seo", label: "SEO" },
  { value: "legal", label: "Dane firmy" },
];

function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return <span className={`text-[11.5px] tabular-nums ${n > max ? "text-amber-300" : "text-dim"}`}>{n}/{max}</span>;
}

export default function ContentForm({ initial, defaults, services }: { initial: Content; defaults: Content; services: { id: ServiceId; name: string }[] }) {
  const router = useRouter();
  const [c, setC] = useState<Content>(initial);
  const [tab, setTab] = useState<Section>("hero");
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
