"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/site";
import SectionHeader from "./figma/SectionHeader";

const types = ["Landing page", "Strona firmowa", "Sklep", "Portfolio", "Inne"];
const budgets = ["200–500 zł", "500–1000 zł", "1000–2000 zł", "2000+ zł"];

function Chips({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`rounded-lg border px-3 py-2 text-sm transition-all ${
            value === o ? "border-sel bg-sel/15 text-ink" : "border-line bg-white/[0.03] text-muted hover:border-white/20 hover:text-ink"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const field =
  "w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-sel focus:bg-sel/5";

export default function Contact() {
  const [type, setType] = useState(types[0]);
  const [budget, setBudget] = useState(budgets[0]);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    // Bez backendu: otwiera klienta poczty z gotową wiadomością.
    // Podłącz np. Formspree / Resend, jeśli chcesz wysyłkę bezpośrednio ze strony.
    const body = [
      `Imię: ${d.get("name")}`,
      `E-mail: ${d.get("email")}`,
      `Rodzaj strony: ${type}`,
      `Budżet: ${budget}`,
      "",
      `${d.get("message")}`,
    ].join("\n");
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(`Zapytanie: ${type}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <section id="kontakt" className="relative border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-28 sm:py-36 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeader
            index="04"
            frame="Kontakt"
            title={
              <>
                Zróbmy stronę, która <span className="text-gradient font-serif font-normal italic">sprzedaje</span>.
              </>
            }
            lead="Opisz krótko, czego potrzebujesz. Odpiszę z wyceną i propozycją terminu — bez zobowiązań."
          />

          <div className="space-y-3">
            <a href={`mailto:${site.email}`} className="group flex items-center justify-between rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-sel">
              <span>
                <span className="block font-mono text-[11px] text-muted">E-mail</span>
                <span className="text-lg font-medium">{site.email}</span>
              </span>
              <span className="text-xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-sel">→</span>
            </a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="group flex items-center justify-between rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-sel">
              <span>
                <span className="block font-mono text-[11px] text-muted">Telefon</span>
                <span className="text-lg font-medium">{site.phone}</span>
              </span>
              <span className="text-xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-sel">→</span>
            </a>
          </div>

          {/* Komentarz w stylu Figmy */}
          <motion.div
            className="mt-8 flex max-w-sm gap-3"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 18 }}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full rounded-bl-sm bg-comp font-display text-sm font-semibold text-white">
              {site.brand[0].toUpperCase()}
            </span>
            <div className="rounded-2xl rounded-tl-sm border border-line bg-panel px-4 py-3 text-sm">
              <p className="mb-0.5 text-xs">
                <span className="font-medium">{site.brand}</span> <span className="text-muted">· teraz</span>
              </p>
              <p className="text-muted">{site.responseTime}. Pierwsza konsultacja jest zawsze bezpłatna 🙂</p>
            </div>
          </motion.div>
        </div>

        {/* Formularz jako panel właściwości */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-muted">
            <span># Formularz / Zapytanie</span>
            <span>Auto layout</span>
          </div>
          <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xl shadow-black/40 sm:p-7">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="ok"
                  className="flex min-h-[420px] flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-fig-green/15 text-3xl text-fig-green">✓</span>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">Prawie gotowe!</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Otworzyłem Twoją pocztę z gotową wiadomością — wystarczy kliknąć „Wyślij”. Jeśli nic się nie otworzyło, napisz na {site.email}.
                  </p>
                  <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm text-sel hover:underline">
                    Wróć do formularza
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} className="space-y-5" exit={{ opacity: 0 }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs text-muted">Imię</span>
                      <input name="name" required autoComplete="name" placeholder="Jan" className={field} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs text-muted">E-mail</span>
                      <input name="email" type="email" required autoComplete="email" placeholder="jan@firma.pl" className={field} />
                    </label>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs text-muted">Rodzaj strony</span>
                    <Chips name="Rodzaj strony" options={types} value={type} onChange={setType} />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs text-muted">Budżet</span>
                    <Chips name="Budżet" options={budgets} value={budget} onChange={setBudget} />
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-muted">Wiadomość</span>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Czym się zajmujesz i czego potrzebujesz?"
                      className={`${field} resize-none`}
                    />
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-muted">
                    <input type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[var(--color-sel)]" />
                    <span>
                      Akceptuję{" "}
                      <Link href="/polityka-prywatnosci" className="text-ink underline underline-offset-2 hover:text-sel">
                        politykę prywatności
                      </Link>{" "}
                      i zgadzam się na kontakt w sprawie zapytania.
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-xl bg-sel py-4 font-medium text-white transition-transform active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    Wyślij zapytanie →
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
