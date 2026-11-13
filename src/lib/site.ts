// Ustawienia i teksty strony w jednym miejscu — edytuj tutaj, a nie w komponentach.

export const DISCORD = "https://discord.gg/cmxqNvjfS3";

export const site = {
  brand: "afto",
  domain: "afto.works",
  url: "https://afto.works",
  role: "Designer & Web Developer",
  email: "lubojanskiwojciech1@gmail.com",
  socials: [
    { label: "Discord", href: DISCORD },
    { label: "Instagram", href: "https://www.instagram.com/w.lubo33" },
    { label: "Behance", href: "https://behance.net/wojciechdesigner" },
    { label: "Dribbble", href: "https://dribbble.com/afto" },
  ],
  // Dane do polityki prywatności
  legal: {
    owner: "Wojciech Lubojański",
    street: "ul. Stalowa 92/5a",
    city: "53-440 Wrocław",
    updated: "12 listopada 2026",
  },
};

export const copy = {
  seo: {
    title: "Developer & Designer | afto.works",
    description: "Robię wszystko, czego potrzebuje Twój serwer, marka albo pomysł, od grafiki po gotowy kod. Zobacz portfolio i napisz na Discordzie.",
  },
  hero: {
    line1: "Projekty,",
    line2: "które robią",
    accent: "wrażenie.",
    text: "Projektuję i koduję strony internetowe, sklepy i identyfikacje wizualne dla marek, które chcą być zapamiętane.",
    cta: "Zamów projekt",
    secondary: "Portfolio",
    recent: "Ostatnie projekty",
  },
  work: { label: "Portfolio", open: "Otwórz kategorię" },
  footer: { cta: "Masz pomysł?", accent: "Pogadajmy na Discordzie." },
};

/* ---------- Projekty startowe (tylko pusta baza przy pierwszym uruchomieniu) ---------- */

type DemoProject = { name: string; slug: string; image: string; category: string; year: string; client: string; description: string; scope: string[]; palette: string[]; gallery?: string[] };

// Startowe projekty — trafiają do bazy przy pierwszym uruchomieniu. Potem portfolio edytujesz w panelu admina.
export const defaultProjects: DemoProject[] = [
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
