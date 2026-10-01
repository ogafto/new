// Wszystkie treści strony w jednym miejscu — edytuj tutaj, a nie w komponentach.

export const site = {
  brand: "afto",
  domain: "afto.works",
  url: "https://afto.works",
  tagline: "Od piksela do zysku.",
  role: "Web designer & developer",
  email: "kontakt@afto.works",
  phone: "+48 000 000 000",
  location: "Polska — zdalnie",
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

export const nav = [
  { href: "#realizacje", label: "Realizacje" },
  { href: "#proces", label: "Proces" },
  { href: "#kontakt", label: "Kontakt" },
];

/* ---------- Usługi (ceny minimalne — dostosuj) ---------- */

export type ServiceId = "www" | "shop" | "brand" | "ui";

export const services: { id: ServiceId; name: string; plural: string; price: number; time: string; description: string }[] = [
  {
    id: "www",
    name: "Strona internetowa",
    plural: "Strony",
    price: 200,
    time: "od 3 dni",
    description: "Wizytówka, landing lub strona firmowa. Projekt, kod i publikacja.",
  },
  {
    id: "shop",
    name: "Sklep internetowy",
    plural: "Sklepy",
    price: 800,
    time: "od 10 dni",
    description: "Sklep z koszykiem i płatnościami online, gotowy do sprzedaży.",
  },
  {
    id: "brand",
    name: "Identyfikacja wizualna",
    plural: "Identyfikacja",
    price: 300,
    time: "od 5 dni",
    description: "Logo, kolory, typografia i materiały, które budują rozpoznawalność.",
  },
  {
    id: "ui",
    name: "Projekt UI/UX",
    plural: "UI/UX",
    price: 250,
    time: "od 3 dni",
    description: "Makiety i klikalny prototyp aplikacji lub strony w Figmie.",
  },
];

export const serviceName = (id: ServiceId) => services.find((s) => s.id === id)!.name;

/* ---------- Prace ---------- */

export type MockTheme = "coffee" | "gym" | "dental" | "photo" | "shop" | "brand" | "ui";

export type Project = {
  name: string;
  slug: string;
  category: ServiceId;
  year: string;
  client: string;
  description: string;
  scope: string[];
  palette: string[];
  tile: string; // kolor tła kafelka z realizacją
  theme: MockTheme; // makieta CSS, dopóki nie ma zrzutu ekranu
  image?: string; // np. "/prace/ziarno.jpg" — wrzuć plik do /public/prace, a podmieni makietę
};

// Przykładowe realizacje — podmień na swoje. Nowa praca = nowy obiekt w tablicy.
export const projects: Project[] = [
  {
    name: "Ziarno",
    slug: "ziarno",
    category: "www",
    year: "2026",
    client: "Kawiarnia speciality",
    description: "Ciepły landing z menu, mapą i rezerwacją stolika. Zaprojektowany pod szybkie decyzje na telefonie.",
    scope: ["Projekt UI", "Next.js", "Animacje"],
    palette: ["#2B1D14", "#C8763A", "#E4D5C3", "#F3EBE0"],
    tile: "#3A2A1E",
    theme: "coffee",
  },
  {
    name: "Forma Store",
    slug: "forma",
    category: "shop",
    year: "2026",
    client: "Marka odzieżowa",
    description: "Minimalistyczny sklep z produktami w roli głównej. Szybki koszyk i płatności jednym kliknięciem.",
    scope: ["E-commerce", "Płatności", "SEO"],
    palette: ["#111111", "#F4F1EC", "#D9D3C7", "#B4502E"],
    tile: "#B4502E",
    theme: "shop",
  },
  {
    name: "Volt Gym",
    slug: "volt",
    category: "www",
    year: "2026",
    client: "Siłownia 24/7",
    description: "Energetyczna strona z grafikiem zajęć, cennikiem karnetów i elementami 3D.",
    scope: ["Strona firmowa", "3D", "CMS"],
    palette: ["#0C0C0C", "#D4FF3A", "#3AFF9C", "#F2F2F2"],
    tile: "#D4FF3A",
    theme: "gym",
  },
  {
    name: "Halny",
    slug: "halny",
    category: "brand",
    year: "2025",
    client: "Browar rzemieślniczy",
    description: "Identyfikacja inspirowana górskim wiatrem: znak, paleta, etykiety i materiały do social mediów.",
    scope: ["Logo", "Księga znaku", "Etykiety"],
    palette: ["#1D2B24", "#E8E2D0", "#C9822B", "#7A9A84"],
    tile: "#C9822B",
    theme: "brand",
  },
  {
    name: "Pulse",
    slug: "pulse",
    category: "ui",
    year: "2025",
    client: "Aplikacja fitness",
    description: "Panel i aplikacja mobilna do śledzenia treningów. Design system i klikalny prototyp.",
    scope: ["UI/UX", "Design system", "Prototyp"],
    palette: ["#0E1116", "#5B8CFF", "#FF6B6B", "#E9EDF5"],
    tile: "#2F3B66",
    theme: "ui",
  },
  {
    name: "Nova Dental",
    slug: "nova",
    category: "www",
    year: "2025",
    client: "Klinika stomatologiczna",
    description: "Spokojny design, który buduje zaufanie. Rezerwacja wizyt online i przejrzysty cennik.",
    scope: ["Strona", "Rezerwacje", "UI"],
    palette: ["#0F2E33", "#14B8A6", "#E2F3F1", "#F6FBFB"],
    tile: "#BFE3DC",
    theme: "dental",
  },
  {
    name: "Atelier Mira",
    slug: "mira",
    category: "www",
    year: "2025",
    client: "Fotograf",
    description: "Edytorialowe portfolio, w którym zdjęcia grają pierwsze skrzypce.",
    scope: ["Portfolio", "Galeria", "Motion"],
    palette: ["#111111", "#3B342C", "#8A7A68", "#EAE6DF"],
    tile: "#2A2622",
    theme: "photo",
  },
];

/* ---------- Proces zamówienia ---------- */

export const steps = [
  { title: "Wybierasz usługę", time: "2 minuty", text: "Zaznaczasz, czego potrzebujesz, i piszesz kilka zdań o firmie." },
  { title: "Rozmowa i wycena", time: "do 24 h", text: "Odzywam się z pytaniami. Dostajesz stałą cenę i termin na piśmie." },
  { title: "Projekt", time: "2–5 dni", text: "Widzisz projekt, zanim powstanie kod. Dwie rundy poprawek w cenie." },
  { title: "Realizacja", time: "3–7 dni", text: "Koduję, testuję na telefonach i komputerach, optymalizuję pod Google." },
  { title: "Start", time: "dzień 10", text: "Publikuję i przekazuję wszystko. 30 dni wsparcia gratis." },
];
