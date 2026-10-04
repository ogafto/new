// Typy i szablony CMS — bez zależności serwerowych (używane też w komponentach klienckich)

export type FieldType = "text" | "textarea" | "image" | "url" | "number" | "toggle" | "color" | "date" | "secret";
export type Field = { key: string; label: string; type: FieldType; required?: boolean; help?: string };
export type Collection = { id: string; site_id: string; key: string; name: string; kind: "single" | "list"; fields: Field[]; sort: number; item?: string | null; hint?: string | null };
export type Entry = { id: string; collection_id: string; data: Record<string, unknown>; sort: number; updated_at: number; updated_by: string | null };
export type Site = { id: string; name: string; domain: string | null; owner_id: string | null; public_key: string; webhook_url: string | null; created_at: number; updated_at: number; secret_key?: string | null; last_seen?: number | null; last_origin?: string | null; schema_at?: number | null };

// adres strony: domena (https) albo pełny adres http://IP:port
export const siteHref = (domain: string | null | undefined) => (!domain ? null : /^https?:\/\//.test(domain) ? domain : `https://${domain}`);

export const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: "text", label: "Tekst" },
  { type: "textarea", label: "Długi tekst" },
  { type: "image", label: "Zdjęcie" },
  { type: "url", label: "Link" },
  { type: "number", label: "Liczba" },
  { type: "toggle", label: "Tak / nie" },
  { type: "color", label: "Kolor" },
  { type: "date", label: "Data" },
  { type: "secret", label: "Sekret (klucz API, hasło)" },
];

// gotowe szablony do szybkiego startu
export const PRESETS: Record<string, { name: string; collections: { key: string; name: string; kind: "single" | "list"; fields: Field[] }[] }> = {
  firma: {
    name: "Strona firmowa",
    collections: [
      {
        key: "hero",
        name: "Baner główny",
        kind: "single",
        fields: [
          { key: "title", label: "Nagłówek", type: "text", required: true },
          { key: "subtitle", label: "Podtytuł", type: "textarea" },
          { key: "image", label: "Zdjęcie", type: "image" },
          { key: "cta", label: "Tekst przycisku", type: "text" },
        ],
      },
      {
        key: "about",
        name: "O nas",
        kind: "single",
        fields: [
          { key: "title", label: "Tytuł", type: "text" },
          { key: "text", label: "Treść", type: "textarea" },
          { key: "image", label: "Zdjęcie", type: "image" },
        ],
      },
      {
        key: "services",
        name: "Usługi",
        kind: "list",
        fields: [
          { key: "name", label: "Nazwa", type: "text", required: true },
          { key: "description", label: "Opis", type: "textarea" },
          { key: "price", label: "Cena", type: "text" },
        ],
      },
      {
        key: "gallery",
        name: "Galeria",
        kind: "list",
        fields: [
          { key: "image", label: "Zdjęcie", type: "image", required: true },
          { key: "caption", label: "Podpis", type: "text" },
        ],
      },
      {
        key: "contact",
        name: "Kontakt",
        kind: "single",
        fields: [
          { key: "phone", label: "Telefon", type: "text" },
          { key: "email", label: "E-mail", type: "text" },
          { key: "address", label: "Adres", type: "textarea" },
          { key: "hours", label: "Godziny otwarcia", type: "textarea" },
        ],
      },
    ],
  },
  gastro: {
    name: "Restauracja / kawiarnia",
    collections: [
      {
        key: "hero",
        name: "Baner główny",
        kind: "single",
        fields: [
          { key: "title", label: "Nagłówek", type: "text", required: true },
          { key: "subtitle", label: "Podtytuł", type: "textarea" },
          { key: "image", label: "Zdjęcie", type: "image" },
        ],
      },
      {
        key: "menu",
        name: "Menu",
        kind: "list",
        fields: [
          { key: "name", label: "Danie", type: "text", required: true },
          { key: "category", label: "Kategoria", type: "text" },
          { key: "description", label: "Opis", type: "textarea" },
          { key: "price", label: "Cena (zł)", type: "number" },
          { key: "image", label: "Zdjęcie", type: "image" },
          { key: "available", label: "Dostępne", type: "toggle" },
        ],
      },
      {
        key: "news",
        name: "Aktualności",
        kind: "list",
        fields: [
          { key: "title", label: "Tytuł", type: "text", required: true },
          { key: "date", label: "Data", type: "date" },
          { key: "text", label: "Treść", type: "textarea" },
          { key: "image", label: "Zdjęcie", type: "image" },
        ],
      },
      {
        key: "contact",
        name: "Kontakt i godziny",
        kind: "single",
        fields: [
          { key: "phone", label: "Telefon", type: "text" },
          { key: "address", label: "Adres", type: "textarea" },
          { key: "hours", label: "Godziny otwarcia", type: "textarea" },
        ],
      },
    ],
  },
  pusta: { name: "Pusta (sam zbudujesz)", collections: [] },
};


/** Ujednolicenie wartości wpisu do typów pól (zapis z panelu i treści startowe zgłaszane przez stronę) */
export function cleanEntry(fields: Field[], data: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const f of fields) {
    const v = data?.[f.key];
    if (f.type === "toggle") clean[f.key] = v === true || v === "true" || v === 1;
    else if (f.type === "number") clean[f.key] = v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v);
    else clean[f.key] = typeof v === "string" ? v.slice(0, f.type === "textarea" ? 20000 : 2000) : typeof v === "number" ? String(v) : null;
  }
  return clean;
}
