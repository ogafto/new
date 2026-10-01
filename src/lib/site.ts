// Wszystkie treści strony w jednym miejscu — edytuj tutaj, a nie w komponentach.

export const site = {
  brand: "afto",
  domain: "afto.studio",
  tagline: "Od piksela do zysku.",
  role: "Web designer & developer",
  email: "kontakt@afto.studio",
  phone: "+48 000 000 000",
  city: "Polska · zdalnie",
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
  { id: "kontakt", label: "Kontakt" },
] as const;

export type MockTheme = "coffee" | "gym" | "dental" | "photo";

export const projects: {
  name: string;
  category: string;
  year: string;
  tags: string[];
  theme: MockTheme;
  href?: string;
}[] = [
  { name: "Ziarno", category: "Kawiarnia · landing page", year: "2026", tags: ["Figma", "Next.js", "Animacje"], theme: "coffee" },
  { name: "Volt Gym", category: "Siłownia · strona firmowa", year: "2026", tags: ["3D", "WebGL", "SEO"], theme: "gym" },
  { name: "Nova Dental", category: "Klinika · strona + rezerwacje", year: "2025", tags: ["UI/UX", "CMS", "Responsywność"], theme: "dental" },
  { name: "Atelier Mira", category: "Fotograf · portfolio", year: "2025", tags: ["Editorial", "Galeria", "Motion"], theme: "photo" },
];

export const steps = [
  {
    title: "Brief",
    time: "Dzień 1",
    text: "Piszesz przez formularz lub dzwonisz. W 15 minut ustalamy, czego potrzebujesz i co ma sprzedawać Twoja strona.",
  },
  {
    title: "Wycena",
    time: "Dzień 1–2",
    text: "Dostajesz konkretną cenę i termin. Bez ukrytych kosztów i bez drobnego druku.",
  },
  {
    title: "Projekt w Figmie",
    time: "Dzień 2–4",
    text: "Widzisz swoją stronę, zanim powstanie. Klikalny prototyp i dwie rundy poprawek w cenie.",
  },
  {
    title: "Kodowanie",
    time: "Dzień 4–7",
    text: "Przenoszę projekt do Next.js: animacje, pełna responsywność, szybkie ładowanie i SEO.",
  },
  {
    title: "Start",
    time: "Dzień 7",
    text: "Publikuję stronę na Twojej domenie i przekazuję wszystko. 30 dni wsparcia gratis.",
  },
];

export const plans = [
  {
    name: "Start",
    price: 200,
    note: "Landing page / wizytówka",
    time: "3–5 dni",
    features: [
      "Strona jednostronicowa (one-page)",
      "Pełna responsywność",
      "Formularz kontaktowy",
      "Podstawowe SEO",
      "Animacje wejścia",
    ],
  },
  {
    name: "Biznes",
    price: 690,
    note: "Strona firmowa",
    time: "7–10 dni",
    featured: true,
    features: [
      "Do 5 podstron",
      "Indywidualny projekt w Figmie",
      "Zaawansowane animacje",
      "SEO + Google Maps + Analytics",
      "2 rundy poprawek",
      "30 dni wsparcia",
    ],
  },
  {
    name: "Premium",
    price: 1490,
    note: "Efekt wow bez kompromisów",
    time: "10–14 dni",
    features: [
      "Animacje 3D / WebGL",
      "Unikalny design od zera",
      "Panel do edycji treści (CMS)",
      "Rezerwacje / sklep / integracje",
      "Priorytetowa realizacja",
    ],
  },
];

export const extras = [
  "Projekt UI w Figmie",
  "Redesign starej strony",
  "Opieka techniczna",
  "Optymalizacja szybkości",
  "Konfiguracja domeny i hostingu",
  "Copywriting sprzedażowy",
];

export const marquee = [
  "Figma → Next.js",
  "Animacje 3D",
  "Strony od 200 zł",
  "100% responsywne",
  "SEO w standardzie",
  "Gotowe w 7 dni",
  "Design, który sprzedaje",
];
