"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/site";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };
type Sent = { name: string; message: string };

const ease = [0.16, 1, 0.3, 1] as const;

function Avatar({ label, className }: { label: string; className: string }) {
  return <span className={`grid size-7 shrink-0 place-items-center rounded-full font-ui text-[11px] font-semibold ${className}`}>{label}</span>;
}

/*
 * Formularz kontaktowy w formie komentarza z Figmy.
 * Wysyła do /api/contact (Resend + Discord).
 */
export default function CommentComposer({ prefill, onClearPrefill, compact = false }: { prefill?: string; onClearPrefill?: () => void; compact?: boolean }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [sent, setSent] = useState<Sent | null>(null);
  const [text, setText] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, topic: prefill ?? "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Nie udało się wysłać wiadomości.");
      setSent({ name: d.name, message: d.message });
      setStatus({ state: "sent" });
      setText("");
      form.reset();
      onClearPrefill?.();
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Nie udało się wysłać wiadomości." });
    }
  };

  return (
    <div className="flex h-full flex-col font-ui text-[14px] text-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-3.5">
        <span className="text-[13px] font-semibold">{sent ? "Wątek" : "Nowy komentarz"}</span>
        {!compact && <span className="text-[12px] text-black/40">{site.domain} / Kontakt</span>}
      </div>

      <div className={`flex-1 overflow-y-auto px-5 ${compact ? "py-4" : "py-5"}`}>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="thread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex gap-3">
                <Avatar label="Ty" className="bg-sel text-white" />
                <div>
                  <p className="text-[13px]">
                    <span className="font-semibold">{sent.name}</span> <span className="text-black/40">· teraz</span>
                  </p>
                  <p className="mt-1 leading-relaxed whitespace-pre-wrap">{sent.message}</p>
                </div>
              </div>
              <motion.div className="flex gap-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5, ease }}>
                <Avatar label={site.brand[0].toUpperCase()} className="bg-ink text-white" />
                <div>
                  <p className="text-[13px]">
                    <span className="font-semibold">{site.brand}</span> <span className="text-black/40">· teraz</span>
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Dzięki, {sent.name.split(" ")[0]}! Twoja wiadomość dotarła. Odezwę się w ciągu 24 godzin z pytaniami albo wyceną.
                  </p>
                </div>
              </motion.div>
              <button type="button" onClick={() => setSent(null)} className="text-[13px] font-medium text-sel hover:underline">
                Napisz kolejny komentarz
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" id={compact ? "comment-pop" : "comment-main"} onSubmit={submit} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex gap-3">
                <Avatar label="Ty" className="mt-1 bg-sel text-white" />
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <input
                    name="name"
                    required
                    minLength={2}
                    autoComplete="name"
                    placeholder="Imię"
                    aria-label="Imię"
                    className="h-10 rounded-md border border-black/10 px-3 outline-none transition-colors placeholder:text-black/35 focus:border-sel focus:ring-2 focus:ring-sel/20"
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="E-mail"
                    aria-label="E-mail"
                    className="h-10 rounded-md border border-black/10 px-3 outline-none transition-colors placeholder:text-black/35 focus:border-sel focus:ring-2 focus:ring-sel/20"
                  />
                </div>
              </div>

              {prefill && (
                <div className="ml-10 flex items-start gap-2 rounded-md bg-comp/[0.08] px-3 py-2 text-[12px] text-comp">
                  <span className="flex-1">◆ {prefill}</span>
                  <button type="button" onClick={onClearPrefill} aria-label="Usuń konfigurację" className="text-comp/70 hover:text-comp">
                    ✕
                  </button>
                </div>
              )}

              <div className="ml-10">
                <textarea
                  ref={area}
                  name="message"
                  required
                  minLength={10}
                  rows={compact ? 3 : 5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Dodaj komentarz… Czym się zajmujesz i czego potrzebujesz?"
                  aria-label="Wiadomość"
                  className="w-full resize-none rounded-md border border-black/10 px-3 py-2.5 leading-relaxed outline-none transition-colors placeholder:text-black/35 focus:border-sel focus:ring-2 focus:ring-sel/20"
                />
                <input name="company" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />

                <div className="mt-3 flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-black/50">
                    <input type="checkbox" required className="mt-0.5 size-3.5 shrink-0 accent-[#0d99ff]" />
                    <span>
                      Akceptuję{" "}
                      <Link href="/polityka-prywatnosci" className="text-black/70 underline underline-offset-2">
                        politykę prywatności
                      </Link>
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={status.state === "sending"}
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-sel text-white transition-[transform,background-color] hover:bg-[#0a87e3] active:scale-95 disabled:opacity-60"
                    aria-label="Wyślij komentarz"
                  >
                    {status.state === "sending" ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                        <path d="M7 12V2M2.5 6.5L7 2l4.5 4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>

                {status.state === "error" && (
                  <p role="alert" className="mt-3 rounded-md bg-measure/10 px-3 py-2 text-[12px] text-measure">
                    {status.message} Napisz bezpośrednio:{" "}
                    <a href={`mailto:${site.email}`} className="underline">
                      {site.email}
                    </a>
                  </p>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
