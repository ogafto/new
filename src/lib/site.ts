// Wszystkie treści strony w jednym miejscu — edytuj tutaj, a nie w komponentach.

export const site = {
  brand: "afto",
  domain: "afto.works",
  url: "https://afto.works",
  tagline: "Od piksela do zysku.",
  role: "Web designer & developer",
  email: "lubojanskiwojciech1@gmail.com",
  phone: "+48 518 323 533",
  timezone: "Europe/Warsaw",
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "Behance", href: "https://behance.net/" },
    { label: "Dribbble", href: "https://dribbble.com/" },
    { label: "Discord", href: "https://discord.com/" }, // podmień na swój link zaproszenia / profil
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
  { href: "#portfolio", label: "Portfolio" },
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

export type Project = {
  id?: string;
  url?: string | null; // adres gotowej strony (opcjonalnie)
  name: string;
  slug: string;
  category: ServiceId;
  year: string;
  client: string;
  description: string;
  scope: string[];
  palette: string[];
  image: string; // zdjęcie realizacji w /public/prace (najlepiej 1600×1200, JPG)
  gallery?: string[]; // dodatkowe zdjęcia na podstronie realizacji
};

// Startowe projekty — trafiają do bazy przy pierwszym uruchomieniu. Potem portfolio edytujesz w panelu admina.
export const defaultProjects: Project[] = [
  {
    name: "Ziarno",
    slug: "ziarno",
    image: "/prace/ziarno.jpg",
    category: "www",
    year: "2026",
    client: "Kawiarnia speciality",
    description: "Ciepły landing z menu, mapą i rezerwacją stolika. Zaprojektowany pod szybkie decyzje na telefonie.",
    scope: ["Projekt UI", "Next.js", "Animacje"],
    palette: ["#2B1D14", "#C8763A", "#E4D5C3", "#F3EBE0"],
  },
  {
    name: "Forma Store",
    slug: "forma",
    image: "/prace/forma.jpg",
    category: "shop",
    year: "2026",
    client: "Marka odzieżowa",
    description: "Minimalistyczny sklep z produktami w roli głównej. Szybki koszyk i płatności jednym kliknięciem.",
    scope: ["E-commerce", "Płatności", "SEO"],
    palette: ["#111111", "#F4F1EC", "#D9D3C7", "#B4502E"],
  },
  {
    name: "Volt Gym",
    slug: "volt",
    image: "/prace/volt.jpg",
    category: "www",
    year: "2026",
    client: "Siłownia 24/7",
    description: "Energetyczna strona z grafikiem zajęć, cennikiem karnetów i elementami 3D.",
    scope: ["Strona firmowa", "3D", "CMS"],
    palette: ["#0C0C0C", "#D4FF3A", "#3AFF9C", "#F2F2F2"],
  },
  {
    name: "Halny",
    slug: "halny",
    image: "/prace/halny.jpg",
    category: "brand",
    year: "2025",
    client: "Browar rzemieślniczy",
    description: "Identyfikacja inspirowana górskim wiatrem: znak, paleta, etykiety i materiały do social mediów.",
    scope: ["Logo", "Księga znaku", "Etykiety"],
    palette: ["#1D2B24", "#E8E2D0", "#C9822B", "#7A9A84"],
  },
  {
    name: "Pulse",
    slug: "pulse",
    image: "/prace/pulse.jpg",
    category: "ui",
    year: "2025",
    client: "Aplikacja fitness",
    description: "Panel i aplikacja mobilna do śledzenia treningów. Design system i klikalny prototyp.",
    scope: ["UI/UX", "Design system", "Prototyp"],
    palette: ["#0E1116", "#5B8CFF", "#FF6B6B", "#E9EDF5"],
  },
  {
    name: "Nova Dental",
    slug: "nova",
    image: "/prace/nova.jpg",
    category: "www",
    year: "2025",
    client: "Klinika stomatologiczna",
    description: "Spokojny design, który buduje zaufanie. Rezerwacja wizyt online i przejrzysty cennik.",
    scope: ["Strona", "Rezerwacje", "UI"],
    palette: ["#0F2E33", "#14B8A6", "#E2F3F1", "#F6FBFB"],
  },
  {
    name: "Atelier Mira",
    slug: "mira",
    image: "/prace/mira.jpg",
    category: "www",
    year: "2025",
    client: "Fotograf",
    description: "Edytorialowe portfolio, w którym zdjęcia grają pierwsze skrzypce.",
    scope: ["Portfolio", "Galeria", "Motion"],
    palette: ["#111111", "#3B342C", "#8A7A68", "#EAE6DF"],
  },
];

/* ---------- Proces zamówienia ---------- */

export const steps = [
  {
    title: "Rozmowa",
    lead: "Poznaję Twoją firmę i potrzeby",
    text: "Krótka rozmowa o celu, klientach i budżecie. Zadaję pytania, które oszczędzą nam poprawek później — po niej dostajesz konkretną wycenę i termin.",
    points: ["Cel i grupa docelowa", "Zakres i budżet", "Wycena i termin"],
  },
  {
    title: "Kierunek",
    lead: "Ustalamy, jak marka ma wyglądać",
    text: "Moodboard, kolory i typografia. Wybieramy styl, który wyróżni Cię na tle konkurencji, zanim powstanie choćby jeden ekran.",
    points: ["Moodboard", "Paleta i typografia", "Akceptacja stylu"],
  },
  {
    title: "Projekt",
    lead: "Każdy ekran dopracowany co do piksela",
    text: "Pełny projekt w Figmie — desktop i telefon. Klikasz prototyp, zgłaszasz uwagi, a ja dopracowuję szczegóły aż do akceptacji.",
    points: ["Makiety i prototyp", "Wersja mobilna", "Poprawki do akceptacji"],
  },
  {
    title: "Wdrożenie",
    lead: "Kod, animacje i publikacja",
    text: "Koduję projekt z animacjami, optymalizuję szybkość i SEO, podpinam domenę i publikuję. Strona od pierwszego dnia pracuje na Twój wynik.",
    points: ["Kod i animacje", "Szybkość i SEO", "Publikacja na domenie"],
  },
];
