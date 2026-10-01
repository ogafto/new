// Wszystkie treści strony w jednym miejscu — edytuj tutaj, a nie w komponentach.

export const site = {
  brand: "afto",
  domain: "afto.works",
  url: "https://afto.works",
  tagline: "Od piksela do zysku.",
  role: "Grafika komputerowa & web design",
  email: "kontakt@afto.works",
  phone: "+48 000 000 000",
  location: "Polska · zdalnie",
  timezone: "Europe/Warsaw",
  responseTime: "Odpowiadam w ciągu 24 godzin",
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "Behance", href: "https://behance.net/" },
    { label: "Dribbble", href: "https://dribbble.com/" },
  ],
  // Dane do regulaminu i polityki prywatności — uzupełnij przed publikacją.
  legal: {
    owner: "[Imię i nazwisko / nazwa firmy]",
    address: "[adres]",
    nip: "[NIP — jeśli dotyczy]",
    updated: "1 października 2026",
  },
};

export type MockTheme = "coffee" | "gym" | "dental" | "photo";

export type Project = {
  name: string;
  slug: string;
  category: string;
  year: string;
  description: string;
  scope: string[];
  theme: MockTheme;
  palette: string[];
  fonts: { name: string; className: string }[];
  // kolory ramki (artboardu) z projektem
  bg: string;
  fg: string;
};

export const projects: Project[] = [
  {
    name: "Ziarno",
    slug: "ziarno",
    category: "Kawiarnia — landing page",
    year: "2026",
    description: "Ciepły, apetyczny landing z menu, mapą i rezerwacją stolika. Zaprojektowany pod szybkie decyzje na telefonie.",
    scope: ["Projekt UI", "Next.js", "Animacje"],
    theme: "coffee",
    palette: ["#2B1D14", "#C8763A", "#E4D5C3", "#F3EBE0"],
    fonts: [
      { name: "Instrument Serif", className: "font-serif italic" },
      { name: "Archivo", className: "font-display" },
    ],
    bg: "#EFE8DD",
    fg: "#2B1D14",
  },
  {
    name: "Volt Gym",
    slug: "volt",
    category: "Siłownia — strona firmowa",
    year: "2026",
    description: "Energetyczna identyfikacja i strona z grafikiem zajęć, cennikiem karnetów i elementami 3D.",
    scope: ["Branding", "3D / WebGL", "SEO"],
    theme: "gym",
    palette: ["#0C0C0C", "#D4FF3A", "#3AFF9C", "#F2F2F2"],
    fonts: [
      { name: "Archivo Expanded", className: "font-display font-black uppercase [font-stretch:125%]" },
      { name: "JetBrains Mono", className: "font-mono" },
    ],
    bg: "#101010",
    fg: "#F2F2F2",
  },
  {
    name: "Nova Dental",
    slug: "nova",
    category: "Klinika — strona z rezerwacjami",
    year: "2025",
    description: "Spokojny design, który buduje zaufanie. Rezerwacja wizyt online i przejrzysty cennik zabiegów.",
    scope: ["UI/UX", "CMS", "Rezerwacje"],
    theme: "dental",
    palette: ["#0F2E33", "#14B8A6", "#E2F3F1", "#F6FBFB"],
    fonts: [
      { name: "Archivo", className: "font-display font-semibold" },
      { name: "Inter", className: "font-ui" },
    ],
    bg: "#E4EFEC",
    fg: "#0F2E33",
  },
  {
    name: "Atelier Mira",
    slug: "mira",
    category: "Fotograf — portfolio",
    year: "2025",
    description: "Edytorialowe portfolio, w którym zdjęcia grają pierwsze skrzypce. Galeria z płynnymi przejściami.",
    scope: ["Art direction", "Galeria", "Motion"],
    theme: "photo",
    palette: ["#111111", "#3B342C", "#8A7A68", "#EAE6DF"],
    fonts: [
      { name: "Instrument Serif", className: "font-serif" },
      { name: "Archivo Narrow", className: "font-display [font-stretch:70%]" },
    ],
    bg: "#171615",
    fg: "#EAE6DF",
  },
];

export const steps = [
  { title: "Rozmowa", time: "Dzień 1", text: "Opowiadasz o firmie i celu strony. Ja słucham i zadaję pytania, które oszczędzą nam poprawek." },
  { title: "Wycena", time: "Dzień 1–2", text: "Dostajesz stałą cenę i termin na piśmie. Bez ukrytych kosztów." },
  { title: "Projekt w Figmie", time: "Dzień 2–5", text: "Widzisz swoją stronę, zanim powstanie kod. Klikalny prototyp, dwie rundy poprawek." },
  { title: "Kodowanie", time: "Dzień 5–9", text: "Przenoszę projekt piksel w piksel do Next.js. Animacje, responsywność, SEO." },
  { title: "Publikacja", time: "Dzień 10", text: "Strona ląduje na Twojej domenie. Przekazuję dostępy i zostaję na 30 dni wsparcia." },
];

/*
 * Konfigurator usług (ramka "Usługi").
 * Ceny poza "Strona internetowa od 200 zł" są przykładowe — dostosuj do swojego cennika.
 */
export type ServiceProp =
  | { type: "select"; key: string; label: string; options: { label: string; price: number }[] }
  | { type: "bool"; key: string; label: string; price: number };

export type Service = {
  id: string;
  name: string;
  short: string;
  description: string;
  deliverables: string[];
  time: string;
  base: number;
  props: ServiceProp[];
};

export const services: Service[] = [
  {
    id: "web",
    name: "Strona internetowa",
    short: "Strona www",
    description: "Od wizytówki po rozbudowaną stronę firmową. Projekt w Figmie, kod w Next.js, pełna responsywność.",
    deliverables: ["Projekt graficzny w Figmie", "Wersja mobilna i desktopowa", "Podstawowe SEO i analityka", "Publikacja na Twojej domenie"],
    time: "3–14 dni",
    base: 200,
    props: [
      {
        type: "select",
        key: "pages",
        label: "Podstrony",
        options: [
          { label: "1", price: 0 },
          { label: "do 5", price: 490 },
          { label: "do 10", price: 990 },
        ],
      },
      { type: "bool", key: "motion", label: "Animacje premium", price: 300 },
      { type: "bool", key: "webgl", label: "Elementy 3D / WebGL", price: 500 },
      { type: "bool", key: "cms", label: "Panel do edycji treści", price: 400 },
      { type: "bool", key: "shop", label: "Sklep lub rezerwacje", price: 800 },
    ],
  },
  {
    id: "ui",
    name: "Projekt UI/UX",
    short: "UI/UX",
    description: "Makiety i klikalny prototyp w Figmie — gotowe do wdrożenia przez Ciebie lub Twój zespół.",
    deliverables: ["Plik Figma z komponentami", "Klikalny prototyp", "Wersje mobilne", "Przekazanie dla programisty"],
    time: "3–10 dni",
    base: 150,
    props: [
      {
        type: "select",
        key: "screens",
        label: "Ekrany",
        options: [
          { label: "do 3", price: 0 },
          { label: "do 8", price: 350 },
          { label: "10+", price: 750 },
        ],
      },
      { type: "bool", key: "system", label: "Design system", price: 300 },
      { type: "bool", key: "proto", label: "Prototyp z animacjami", price: 150 },
    ],
  },
  {
    id: "brand",
    name: "Identyfikacja wizualna",
    short: "Branding",
    description: "Logo i spójny wygląd marki, który od pierwszego kontaktu buduje zaufanie.",
    deliverables: ["Logo w wersjach i kolorach", "Paleta i typografia", "Pliki do druku i internetu", "Mini-przewodnik użycia"],
    time: "5–14 dni",
    base: 300,
    props: [
      { type: "bool", key: "book", label: "Księga znaku", price: 250 },
      { type: "bool", key: "print", label: "Wizytówki i papier firmowy", price: 150 },
      { type: "bool", key: "social", label: "Szablony social media", price: 200 },
    ],
  },
  {
    id: "graphic",
    name: "Grafika & social media",
    short: "Grafika",
    description: "Posty, banery, okładki i materiały reklamowe — spójne z Twoją marką i gotowe do publikacji.",
    deliverables: ["Grafiki w formatach pod platformy", "Pliki źródłowe", "Wersje do reklam", "Spójny styl serii"],
    time: "2–7 dni",
    base: 100,
    props: [
      {
        type: "select",
        key: "pack",
        label: "Pakiet",
        options: [
          { label: "5", price: 0 },
          { label: "15", price: 200 },
          { label: "30", price: 450 },
        ],
      },
      { type: "bool", key: "anim", label: "Wersje animowane", price: 150 },
    ],
  },
];
