import type { ServiceId } from "./site";

/*
 * Podstrony usług (/uslugi/…) — treść pod SEO: każda usługa ma własny adres, tytuł, opis,
 * zakres, FAQ i dane strukturalne. Edytuj tutaj.
 */

export type Offer = {
  slug: string;
  service?: ServiceId; // powiązanie z usługą w formularzu i projektami w portfolio
  name: string; // krótka nazwa (menu, karty)
  h1: string;
  title: string; // <title>
  description: string; // meta description (~150 znaków)
  keywords: string[];
  lead: string;
  price?: number;
  time?: string;
  icon: string;
  forWho: string[];
  includes: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  hidden?: boolean; // usługa ukryta w CMS
  custom?: string; // id własnej usługi z CMS, która przejęła tę podstronę (np. „Animacje”)
};

// miasta, w których najczęściej szukane są usługi — współpraca zdalna z całą Polską
export const cities = ["Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Gdynia", "Łódź", "Katowice", "Szczecin", "Lublin", "Bydgoszcz", "Białystok", "Rzeszów", "Toruń", "Opole"];

export const offers: Offer[] = [
  {
    slug: "strony-internetowe",
    service: "www",
    name: "Strony internetowe",
    h1: "Projektowanie stron internetowych",
    title: "Projektowanie stron internetowych | web designer & developer",
    description: "Nowoczesne strony internetowe dla firm: projekt, kod w Next.js, animacje, SEO i publikacja. Szybkie, dopracowane na telefonie. Strona od 200 zł.",
    keywords: ["projektowanie stron internetowych", "tworzenie stron www", "strona internetowa dla firmy", "strona wizytówka", "landing page", "web designer", "web developer", "projektant stron www", "nowoczesna strona internetowa", "strona w Next.js"],
    lead: "Projektuję i koduję strony, które wyglądają premium i zamieniają odwiedzających w klientów. Od wizytówki po rozbudowaną stronę firmową.",
    price: 200,
    time: "od 3 dni",
    icon: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5zM3 9h18M6 7h.01M8.5 7h.01",
    forWho: ["Firmy usługowe i lokalne biznesy", "Marki osobiste, freelancerzy, specjaliści", "Startupy i nowe produkty (landing page)", "Firmy, które chcą odświeżyć przestarzałą stronę"],
    includes: [
      { title: "Projekt od zera", text: "Indywidualny projekt w Figmie, bez gotowych szablonów, dopasowany do marki i klientów." },
      { title: "Kod w Next.js", text: "Nowoczesna technologia: strona ładuje się błyskawicznie i działa stabilnie." },
      { title: "Wersja mobilna", text: "Każdy ekran dopracowany na telefon, tablet i komputer." },
      { title: "SEO na start", text: "Meta tagi, dane strukturalne, mapa strony i szybkość, która pomaga w Google." },
      { title: "Animacje", text: "Subtelne mikroanimacje, które przyciągają uwagę i budują wrażenie premium." },
      { title: "Publikacja i domena", text: "Podpięcie domeny, certyfikat SSL, formularz kontaktowy i analityka." },
    ],
    faq: [
      { q: "Ile kosztuje strona internetowa?", a: "Prosta strona-wizytówka kosztuje od 200 zł. Cena rośnie z liczbą podstron, funkcji i ilością treści. Konkretną wycenę dostajesz po krótkiej rozmowie." },
      { q: "Ile trwa zrobienie strony?", a: "Wizytówka lub landing page powstaje od 3 dni, rozbudowana strona firmowa zwykle w 1–3 tygodnie. Termin ustalamy przed startem." },
      { q: "Czy strona będzie widoczna w Google?", a: "Tak. Każda strona ma przygotowane podstawy SEO: szybkość, poprawną strukturę nagłówków, opisy, mapę strony i dane strukturalne." },
      { q: "Czy będę mógł sam edytować treści?", a: "Tak. Klienci dostają dostęp do panelu z prostym edytorem treści, w którym zmienią teksty i zdjęcia bez programisty." },
      { q: "Czy pracujesz tylko z firmami z Wrocławia?", a: "Nie, współpracuję zdalnie z klientami z całej Polski. Rozmawiamy telefonicznie, przez Discorda lub wideo." },
    ],
  },
  {
    slug: "sklepy-internetowe",
    service: "shop",
    name: "Sklepy internetowe",
    h1: "Sklepy internetowe, które sprzedają",
    title: "Sklep internetowy | projekt i wdrożenie e-commerce",
    description: "Projekt i wdrożenie sklepu internetowego: koszyk, płatności online, karty produktów i panel. Szybki, piękny i gotowy do sprzedaży. Sklep od 800 zł.",
    keywords: ["sklep internetowy", "tworzenie sklepu internetowego", "projekt sklepu internetowego", "e-commerce", "sklep online dla firmy", "płatności online", "web developer e-commerce"],
    lead: "Sklep, w którym produkty wyglądają jak z katalogu premium, a zakupy zajmują kilka kliknięć, także na telefonie.",
    price: 800,
    time: "od 10 dni",
    icon: "M5 8h14l-1.2 11.1a1 1 0 01-1 .9H7.2a1 1 0 01-1-.9zM9 8V6.5a3 3 0 016 0V8",
    forWho: ["Marki odzieżowe, kosmetyczne i lifestyle", "Rękodzieło i małe manufaktury", "Firmy przenoszące sprzedaż do internetu", "Sklepy, które chcą lepszej konwersji"],
    includes: [
      { title: "Projekt sklepu", text: "Strona główna, kategorie, karty produktów i koszyk zaprojektowane pod sprzedaż." },
      { title: "Płatności online", text: "Szybkie płatności (BLIK, karty, przelewy) i potwierdzenia zamówień." },
      { title: "Karty produktów", text: "Galerie, warianty, opisy i zdjęcia, które pomagają podjąć decyzję." },
      { title: "Panel zarządzania", text: "Dodawanie produktów, zamówienia i treści bez znajomości kodu." },
      { title: "SEO produktów", text: "Opisy, dane strukturalne produktów i szybkie ładowanie stron." },
      { title: "Wersja mobilna", text: "Wygodne zakupy na telefonie, tam, gdzie dziś kupuje większość klientów." },
    ],
    faq: [
      { q: "Ile kosztuje sklep internetowy?", a: "Sklep internetowy kosztuje od 800 zł. Ostateczna cena zależy od liczby produktów, integracji (płatności, kurierzy) i funkcji." },
      { q: "Jakie płatności można podpiąć?", a: "Najpopularniejsze bramki płatnicze: BLIK, karty i szybkie przelewy. Dobieramy rozwiązanie do Twojej sprzedaży." },
      { q: "Czy sam dodam produkty?", a: "Tak, sklep ma panel, w którym dodasz produkty, zdjęcia i ceny oraz obsłużysz zamówienia." },
      { q: "Ile trwa wdrożenie sklepu?", a: "Zwykle od 10 dni do kilku tygodni, zależnie od zakresu i liczby produktów do wprowadzenia." },
    ],
  },
  {
    slug: "identyfikacja-wizualna",
    service: "brand",
    name: "Identyfikacja wizualna",
    h1: "Identyfikacja wizualna i logo",
    title: "Identyfikacja wizualna i projekt logo | grafik i designer",
    description: "Projekt logo i identyfikacji wizualnej: znak, kolory, typografia, materiały do social mediów i księga znaku. Marka, którą się zapamiętuje. Od 300 zł.",
    keywords: ["identyfikacja wizualna", "projekt logo", "logo dla firmy", "branding", "księga znaku", "grafik", "projektant graficzny", "designer"],
    lead: "Spójna marka od logo po posty w social mediach. Tak, żeby klienci rozpoznawali Cię od pierwszego spojrzenia.",
    price: 300,
    time: "od 5 dni",
    icon: "M12 3l2.6 5.6L20.5 9l-4.4 4 1.1 6L12 16.2 6.8 19l1.1-6-4.4-4 5.9-.4z",
    forWho: ["Nowe firmy, które startują z marką", "Firmy z przestarzałym lub niespójnym logo", "Marki osobiste i twórcy", "Produkty i opakowania"],
    includes: [
      { title: "Logo i warianty", text: "Znak główny, wersje uproszczone i ikona, gotowe do każdego zastosowania." },
      { title: "Kolory i typografia", text: "Paleta i fonty, które budują charakter marki i działają wszędzie." },
      { title: "Materiały", text: "Wizytówki, szablony postów, okładki social media, papier firmowy." },
      { title: "Księga znaku", text: "Zasady używania marki, żeby wyglądała spójnie w każdym miejscu." },
      { title: "Pliki do druku i sieci", text: "SVG, PNG, PDF i wszystkie inne formaty, których potrzebujesz." },
      { title: "Animowane logo", text: "Opcjonalnie: logo w ruchu do intro, reklam i social mediów." },
    ],
    faq: [
      { q: "Ile kosztuje projekt logo?", a: "Identyfikacja wizualna zaczyna się od 300 zł. Cena zależy od zakresu: samo logo czy pełny system z materiałami i księgą znaku." },
      { q: "Ile propozycji logo dostanę?", a: "Zaczynamy od kilku kierunków, wybieramy najlepszy i dopracowujemy go w rundach poprawek ustalonych w wycenie." },
      { q: "W jakich formatach dostanę pliki?", a: "W formatach wektorowych (SVG, PDF) i rastrowych (PNG), do druku, internetu i social mediów." },
      { q: "Czy przeniesiesz na mnie prawa autorskie?", a: "Tak, po opłaceniu projektu otrzymujesz autorskie prawa majątkowe do logo i materiałów." },
    ],
  },
  {
    slug: "projekt-ui-ux",
    service: "ui",
    name: "Projekt UI/UX",
    h1: "Projekt UI/UX aplikacji i stron",
    title: "Projekt UI/UX | projektowanie interfejsów i prototypów",
    description: "Projektowanie interfejsów UI/UX w Figmie: makiety, klikalne prototypy i design system dla aplikacji webowych i mobilnych. Projekt od 250 zł.",
    keywords: ["projekt UI/UX", "projektowanie interfejsów", "UX designer", "UI designer", "prototyp aplikacji", "projekt aplikacji mobilnej", "Figma", "design system"],
    lead: "Interfejsy, które są piękne i oczywiste w obsłudze. Od pierwszej makiety po klikalny prototyp gotowy do wdrożenia.",
    price: 250,
    time: "od 3 dni",
    icon: "M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z",
    forWho: ["Startupy budujące MVP", "Aplikacje webowe i SaaS", "Aplikacje mobilne", "Zespoły, które potrzebują design systemu"],
    includes: [
      { title: "Analiza i makiety", text: "Ścieżki użytkownika i makiety, które porządkują funkcje produktu." },
      { title: "Projekt UI", text: "Dopracowane ekrany w Figmie, na komputer i telefon." },
      { title: "Klikalny prototyp", text: "Prototyp do testów z użytkownikami i prezentacji inwestorom." },
      { title: "Design system", text: "Komponenty, kolory i typografia gotowe dla programistów." },
      { title: "Przekazanie do wdrożenia", text: "Specyfikacja i pliki, z którymi zespół od razu zacznie pracę." },
      { title: "Wdrożenie (opcjonalnie)", text: "Mogę też zakodować projekt, od makiety do działającej aplikacji." },
    ],
    faq: [
      { q: "Ile kosztuje projekt UI/UX?", a: "Projekt UI/UX zaczyna się od 250 zł za prosty zakres. Wycena zależy od liczby ekranów i stopnia złożoności produktu." },
      { q: "W jakim programie projektujesz?", a: "W Figmie. Dostajesz dostęp do pliku, prototypu i komponentów." },
      { q: "Czy możesz też zakodować projekt?", a: "Tak, jestem też web developerem i mogę wdrożyć projekt w Next.js." },
    ],
  },
  {
    slug: "animacje",
    name: "Animacje",
    h1: "Animacje logo i motion design",
    title: "Animacja logo i motion design | intro, reklamy, social media",
    description: "Animowane logo, intro do filmów i animacje do social mediów. Ruch, który przyciąga uwagę i wyróżnia markę. Pliki MP4, GIF i Lottie.",
    keywords: ["animacja logo", "animowane logo", "motion design", "intro do filmu", "animacje do social media", "animacja na stronę"],
    lead: "Logo i grafiki w ruchu, które zatrzymują przewijanie. Do intro, reklam, social mediów i na stronę internetową.",
    icon: "M5 4.5v15l13-7.5zM3 4v16",
    forWho: ["Marki obecne w social mediach", "Twórcy wideo i YouTube", "Firmy przygotowujące reklamy", "Strony, które mają się wyróżniać"],
    includes: [
      { title: "Animowane logo", text: "Krótka, efektowna animacja znaku do intro i outro." },
      { title: "Social media", text: "Animowane posty, relacje i okładki w formatach pionowych i kwadratowych." },
      { title: "Animacje na stronę", text: "Lekkie animacje Lottie i mikroanimacje interfejsu." },
      { title: "Formaty", text: "MP4, GIF, Lottie (JSON), gotowe do publikacji." },
    ],
    faq: [
      { q: "W jakich formatach dostanę animację?", a: "Najczęściej MP4 i GIF, a na strony internetowe Lottie (lekki format JSON)." },
      { q: "Ile kosztuje animacja logo?", a: "Wycena zależy od długości i złożoności animacji. Podaję ją po krótkiej rozmowie." },
    ],
  },
];

export const offerBySlug = (slug: string) => offers.find((o) => o.slug === slug);
