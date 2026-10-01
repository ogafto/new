// Wszystkie treści strony w jednym miejscu — edytuj tutaj, a nie w komponentach.

export const site = {
  brand: "afto",
  domain: "afto.works",
  url: "https://afto.works",
  tagline: "Od piksela do zysku.",
  role: "Web designer & developer",
  email: "kontakt@afto.works",
  phone: "+48 000 000 000",
  location: "Polska · pracuję zdalnie",
  timezone: "Europe/Warsaw",
  responseTime: "Odpowiadam w ciągu 24h",
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

export const nav = [
  { id: "portfolio", label: "Portfolio" },
  { id: "proces", label: "Proces" },
  { id: "uslugi", label: "Usługi" },
  { id: "cennik", label: "Cennik" },
  { id: "kontakt", label: "Kontakt" },
] as const;

export const stack = ["Figma", "Next.js", "React", "Three.js", "WebGL", "Tailwind CSS", "Motion", "TypeScript", "Vercel", "Resend"];

export type MockTheme = "coffee" | "gym" | "dental" | "photo";

export const projects: {
  name: string;
  slug: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  theme: MockTheme;
  accent: string;
  href?: string;
}[] = [
  {
    name: "Ziarno",
    slug: "ziarno",
    category: "Kawiarnia · Landing page",
    year: "2026",
    description: "Ciepły, apetyczny landing z menu, mapą i rezerwacją stolika. Projekt pod szybkie decyzje na telefonie.",
    tags: ["Figma", "Next.js", "Animacje"],
    theme: "coffee",
    accent: "#c8763a",
  },
  {
    name: "Volt Gym",
    slug: "volt",
    category: "Siłownia · Strona firmowa",
    year: "2026",
    description: "Agresywna, energetyczna identyfikacja z elementami 3D, cennikiem karnetów i grafikiem zajęć.",
    tags: ["3D", "WebGL", "SEO"],
    theme: "gym",
    accent: "#d4ff3a",
  },
  {
    name: "Nova Dental",
    slug: "nova",
    category: "Klinika · Strona + rezerwacje",
    year: "2025",
    description: "Spokojny, zaufany design z rezerwacją wizyt online i przejrzystym cennikiem zabiegów.",
    tags: ["UI/UX", "CMS", "Rezerwacje"],
    theme: "dental",
    accent: "#14b8a6",
  },
  {
    name: "Atelier Mira",
    slug: "mira",
    category: "Fotograf · Portfolio",
    year: "2025",
    description: "Edytorialowe portfolio, w którym zdjęcia grają pierwsze skrzypce. Galeria z płynnymi przejściami.",
    tags: ["Editorial", "Galeria", "Motion"],
    theme: "photo",
    accent: "#eae6df",
  },
];

export const steps = [
  {
    title: "Brief",
    time: "Dzień 1",
    icon: "chat",
    text: "Piszesz przez formularz. W krótkiej rozmowie ustalamy cel strony i to, co ma sprzedawać.",
  },
  {
    title: "Wycena",
    time: "Dzień 1–2",
    icon: "receipt",
    text: "Dostajesz konkretną cenę i termin. Bez ukrytych kosztów i bez drobnego druku.",
  },
  {
    title: "Projekt w Figmie",
    time: "Dzień 2–4",
    icon: "pen",
    text: "Widzisz swoją stronę, zanim powstanie. Klikalny prototyp i dwie rundy poprawek w cenie.",
  },
  {
    title: "Kodowanie",
    time: "Dzień 4–7",
    icon: "code",
    text: "Przenoszę projekt do Next.js: animacje, pełna responsywność, szybkie ładowanie i SEO.",
  },
  {
    title: "Start",
    time: "Dzień 7",
    icon: "rocket",
    text: "Publikuję stronę na Twojej domenie i przekazuję wszystko. 30 dni wsparcia gratis.",
  },
] as const;

export type Plan = {
  name: string;
  price: number;
  note: string;
  time: string;
  featured?: boolean;
  features: string[];
};

export const plans: Plan[] = [
  {
    name: "Start",
    price: 200,
    note: "Landing page / wizytówka",
    time: "3–5 dni",
    features: ["Strona jednostronicowa", "Pełna responsywność", "Formularz kontaktowy", "Podstawowe SEO", "Animacje wejścia"],
  },
  {
    name: "Biznes",
    price: 690,
    note: "Strona firmowa",
    time: "7–10 dni",
    featured: true,
    features: ["Do 5 podstron", "Indywidualny projekt w Figmie", "Zaawansowane animacje", "SEO + Google Maps + Analytics", "2 rundy poprawek", "30 dni wsparcia"],
  },
  {
    name: "Premium",
    price: 1490,
    note: "Efekt wow bez kompromisów",
    time: "10–14 dni",
    features: ["Animacje 3D / WebGL", "Unikalny design od zera", "Panel do edycji treści (CMS)", "Rezerwacje / sklep / integracje", "Priorytetowa realizacja"],
  },
];

export const planNames: string[] = [...plans.map((p) => p.name), "Nie wiem jeszcze"];

export const included = ["Responsywność", "Certyfikat SSL", "Formularz", "Podstawowe SEO", "Szybkie ładowanie"];

export const extras = ["Redesign starej strony", "Opieka techniczna", "Copywriting sprzedażowy", "Konfiguracja domeny i hostingu", "Logo i identyfikacja"];
