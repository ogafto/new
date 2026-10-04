"use client";

import { useState } from "react";
import { COUNTRIES, country, formatPhone, groupDigits, parsePhone, phoneError } from "@/lib/phone";

/*
 * Telefon: kraj (flaga + kierunkowy) i sam numer — da się wpisać tylko cyfry, odstępy dokładają się same,
 * licznik cyfr i komunikat od razu. Na zewnątrz oddaje gotowy numer „+48 600 700 800” (albo "" gdy pusty).
 */
export default function PhoneInput({ value, onChange, name, className = "", large = false }: { value: string; onChange?: (v: string, valid: boolean) => void; name?: string; className?: string; large?: boolean }) {
  const init = parsePhone(value);
  const [code, setCode] = useState(init.code);
  const [digits, setDigits] = useState(init.digits);
  const c = country(code);
  const err = phoneError(code, digits);
  const full = digits ? formatPhone(code, digits) : "";
  const emit = (cc: string, d: string) => onChange?.(d ? formatPhone(cc, d) : "", !phoneError(cc, d));

  return (
    <div className={className}>
      <div className={`flex items-stretch overflow-hidden border ${large ? "h-[60px] rounded-2xl" : "h-11 rounded-xl"} bg-white/[0.03] transition-[border-color,box-shadow] duration-300 focus-within:shadow-[0_0_0_4px_rgb(139_108_255/0.12)] ${err && digits.length >= c.min ? "border-red-400/60" : "border-white/[0.06] focus-within:border-accent hover:border-white/25"}`}>
        <label className="relative flex shrink-0 items-center gap-1.5 border-r border-white/[0.06] pr-7 pl-3 text-[14.5px]">
          <span aria-hidden>{c.flag}</span>
          <span className="tabular-nums text-muted">+{c.dial}</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2 size-3.5 text-dim" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
          <select
            value={code}
            onChange={(e) => {
              const cc = e.target.value;
              const d = digits.slice(0, country(cc).max);
              setCode(cc);
              setDigits(d);
              emit(cc, d);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Kraj"
          >
            {COUNTRIES.map((x) => (
              <option key={x.code} value={x.code}>
                {x.flag} {x.name} (+{x.dial})
              </option>
            ))}
          </select>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={groupDigits(code, digits)}
          onChange={(e) => {
            // wklejony numer z kierunkowym (np. +44 7700 900123) — przestaw kraj
            const raw = e.target.value;
            if (/^\s*(\+|00)/.test(raw)) {
              const p = parsePhone(raw);
              setCode(p.code);
              setDigits(p.digits.slice(0, country(p.code).max));
              return emit(p.code, p.digits.slice(0, country(p.code).max));
            }
            const d = raw.replace(/\D/g, "").slice(0, c.max);
            setDigits(d);
            emit(code, d);
          }}
          onKeyDown={(e) => {
            if (e.key.length === 1 && !/[\d+ ]/.test(e.key) && !e.metaKey && !e.ctrlKey) e.preventDefault();
          }}
          placeholder={groupDigits(code, "6".padEnd(c.min, "0").slice(0, c.min)).replace(/\d/g, "0")}
          className="min-w-0 flex-1 bg-transparent px-3 text-[15px] tracking-[0.02em] text-ink tabular-nums outline-none placeholder:text-dim"
          aria-invalid={!!err && digits.length >= c.min}
        />
        <span className={`flex shrink-0 items-center pr-3 text-[12px] tabular-nums ${digits.length >= c.min && !err ? "text-emerald-300" : "text-dim"}`}>
          {digits.length >= c.min && !err ? "✓" : `${digits.length}/${c.min === c.max ? c.min : `${c.min}–${c.max}`}`}
        </span>
      </div>
      {name && <input type="hidden" name={name} value={full} />}
      <p className={`mt-1.5 text-[12px] ${err && digits.length > 0 && digits.length >= c.min ? "text-red-300" : "text-dim"}`}>{err && digits.length >= c.min ? err : `${c.name} · ${c.min === c.max ? `${c.min} cyfr` : `${c.min}–${c.max} cyfr`} · możesz wkleić numer z +kierunkowym`}</p>
    </div>
  );
}
