/*
 * Numery telefonów: kraj (kierunkowy) + same cyfry numeru krajowego.
 * Zapis w bazie zawsze jako „+48 600 700 800” — czytelnie i jednoznacznie.
 * Plik bez zależności serwerowych (formularz w panelu + walidacja w akcjach).
 */

export type Country = { code: string; dial: string; name: string; flag: string; min: number; max: number; group?: number[] };

export const COUNTRIES: Country[] = [
  { code: "PL", dial: "48", name: "Polska", flag: "🇵🇱", min: 9, max: 9, group: [3, 3, 3] },
  { code: "DE", dial: "49", name: "Niemcy", flag: "🇩🇪", min: 10, max: 11, group: [3, 4, 4] },
  { code: "GB", dial: "44", name: "Wielka Brytania", flag: "🇬🇧", min: 10, max: 10, group: [4, 3, 3] },
  { code: "IE", dial: "353", name: "Irlandia", flag: "🇮🇪", min: 9, max: 9, group: [2, 3, 4] },
  { code: "NL", dial: "31", name: "Holandia", flag: "🇳🇱", min: 9, max: 9, group: [1, 4, 4] },
  { code: "BE", dial: "32", name: "Belgia", flag: "🇧🇪", min: 9, max: 9, group: [3, 2, 2, 2] },
  { code: "FR", dial: "33", name: "Francja", flag: "🇫🇷", min: 9, max: 9, group: [1, 2, 2, 2, 2] },
  { code: "ES", dial: "34", name: "Hiszpania", flag: "🇪🇸", min: 9, max: 9, group: [3, 3, 3] },
  { code: "IT", dial: "39", name: "Włochy", flag: "🇮🇹", min: 9, max: 10, group: [3, 3, 4] },
  { code: "CZ", dial: "420", name: "Czechy", flag: "🇨🇿", min: 9, max: 9, group: [3, 3, 3] },
  { code: "SK", dial: "421", name: "Słowacja", flag: "🇸🇰", min: 9, max: 9, group: [3, 3, 3] },
  { code: "LT", dial: "370", name: "Litwa", flag: "🇱🇹", min: 8, max: 8, group: [3, 5] },
  { code: "UA", dial: "380", name: "Ukraina", flag: "🇺🇦", min: 9, max: 9, group: [2, 3, 2, 2] },
  { code: "AT", dial: "43", name: "Austria", flag: "🇦🇹", min: 10, max: 11, group: [3, 4, 4] },
  { code: "CH", dial: "41", name: "Szwajcaria", flag: "🇨🇭", min: 9, max: 9, group: [2, 3, 2, 2] },
  { code: "NO", dial: "47", name: "Norwegia", flag: "🇳🇴", min: 8, max: 8, group: [3, 2, 3] },
  { code: "SE", dial: "46", name: "Szwecja", flag: "🇸🇪", min: 7, max: 9, group: [2, 3, 2, 2] },
  { code: "DK", dial: "45", name: "Dania", flag: "🇩🇰", min: 8, max: 8, group: [2, 2, 2, 2] },
  { code: "US", dial: "1", name: "USA / Kanada", flag: "🇺🇸", min: 10, max: 10, group: [3, 3, 4] },
];

export const country = (code: string) => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

/** Rozkłada zapisany numer na kraj i cyfry krajowe (bez kierunkowego) */
export function parsePhone(v: string | null | undefined): { code: string; digits: string } {
  const raw = (v ?? "").trim();
  const d = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || raw.startsWith("00")) {
    const n = raw.startsWith("00") ? d.slice(2) : d;
    // najdłuższy pasujący kierunkowy (np. 353 przed 35…)
    const c = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((x) => n.startsWith(x.dial));
    if (c) return { code: c.code, digits: n.slice(c.dial.length) };
  }
  // bez kierunkowego: 9 cyfr (albo 48 + 9) = Polska
  if (d.length === 11 && d.startsWith("48")) return { code: "PL", digits: d.slice(2) };
  return { code: "PL", digits: d };
}

/** Cyfry pogrupowane jak w danym kraju: 600 700 800 */
export function groupDigits(code: string, digits: string) {
  const g = country(code).group ?? [3, 3, 3, 3];
  const out: string[] = [];
  let i = 0;
  for (const n of g) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + n));
    i += n;
  }
  if (i < digits.length) out.push(digits.slice(i));
  return out.join(" ");
}

export const formatPhone = (code: string, digits: string) => `+${country(code).dial} ${groupDigits(code, digits)}`;

export function phoneError(code: string, digits: string) {
  const c = country(code);
  if (!digits) return null;
  if (!/^\d+$/.test(digits)) return "Numer może zawierać tylko cyfry.";
  if (digits.length < c.min || digits.length > c.max) return c.min === c.max ? `Numer w kraju ${c.name} ma ${c.min} cyfr.` : `Numer w kraju ${c.name} ma od ${c.min} do ${c.max} cyfr.`;
  if (code === "PL" && !/^[1-9]/.test(digits)) return "Numer nie może zaczynać się od zera.";
  return null;
}

/** Walidacja i ujednolicenie dowolnego wpisu (np. „600-700-800”, „+44 7700 900123”) — do akcji serwera */
export function normalizePhone(v: string | null | undefined): { ok: true; value: string | null } | { ok: false; error: string } {
  if (!v || !v.trim()) return { ok: true, value: null };
  if (/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(v)) return { ok: false, error: "Numer telefonu może zawierać tylko cyfry." };
  const { code, digits } = parsePhone(v);
  const err = phoneError(code, digits);
  return err ? { ok: false, error: err } : { ok: true, value: formatPhone(code, digits) };
}
