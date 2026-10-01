const tz = "Europe/Warsaw";
export const fmtDate = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(ms);
export const fmtDateTime = (ms: number) =>
  new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(ms);
export const STAGES = ["Rozmowa", "Kierunek", "Projekt", "Wdrożenie", "Opublikowano"];
