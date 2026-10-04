const tz = "Europe/Warsaw";
export const fmtDate = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(ms);
export const fmtDateTime = (ms: number) =>
  new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(ms);
export const STAGES = ["Rozmowa", "Kierunek", "Projekt", "Wdrożenie", "Opublikowano"];

/** Polska odmiana: plural(1, "plik", "pliki", "plików") → „plik”, 3 → „pliki”, 5/12/25 → „plików”, 22 → „pliki” */
export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n);
  if (a === 1) return one;
  const d = a % 10;
  const h = a % 100;
  return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
}
