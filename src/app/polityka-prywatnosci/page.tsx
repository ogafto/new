import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { loadContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Jak afto.works przetwarza dane osobowe, jakich plików cookies używa i jakie masz prawa.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

// treści liczone po loadContent() — dane z CMS (właściciel, adres, kontakt) są zawsze aktualne
function build() {
  const { owner, street, city } = site.legal;

  const summary = [
    `Administratorem danych jestem ja — ${owner}, ${city}.`,
    "Dane z formularza wykorzystuję tylko do odpowiedzi i przygotowania wyceny.",
    "Nie sprzedaję danych i nie wysyłam newsletterów.",
    "Statystyki odwiedzin zbieram anonimowo, bez plików cookies.",
    "Google Analytics włącza się wyłącznie za Twoją zgodą.",
    "W każdej chwili możesz poprosić o wgląd, poprawienie lub usunięcie danych.",
  ];

  const sections: LegalSection[] = [
    {
      title: "Administrator danych",
      items: [
        `Administratorem danych osobowych jest ${owner}, prowadzący działalność nierejestrowaną, ${street}, ${city} (dalej: „Administrator”).`,
        `Kontakt w sprawach danych osobowych: ${site.email}, tel. ${site.phone}. Administrator nie wyznaczył inspektora ochrony danych.`,
      ],
    },
    {
      title: "Cele, podstawy i okres przetwarzania",
      items: [
        "Formularz kontaktowy, e-mail, telefon, Discord — imię i nazwisko, adres e-mail, numer telefonu, wybraną usługę, budżet i treść wiadomości przetwarzam, aby odpowiedzieć na zapytanie i przygotować wycenę (art. 6 ust. 1 lit. b RODO — działania przed zawarciem umowy, oraz lit. f — prawnie uzasadniony interes polegający na odpowiadaniu na wiadomości). Dane przechowuję do zakończenia korespondencji, a jeśli nie dojdzie do współpracy — nie dłużej niż 12 miesięcy od ostatniego kontaktu.",
        "Realizacja umowy — dane kontaktowe i dane potrzebne do rozliczenia przetwarzam w celu wykonania umowy (art. 6 ust. 1 lit. b RODO) przez czas jej trwania, a następnie do upływu terminów przedawnienia roszczeń.",
        "Obowiązki prawne — dane z rachunków przechowuję przez okres wymagany przepisami podatkowymi (art. 6 ust. 1 lit. c RODO).",
        "Panel klienta — imię i nazwisko, adres e-mail, numer telefonu, skrót hasła (samego hasła nie znam), daty logowań oraz treści dodane w edytorze przetwarzam, aby prowadzić konto (art. 6 ust. 1 lit. b RODO), do czasu jego usunięcia.",
        "Dochodzenie i obrona roszczeń — w niezbędnym zakresie, na podstawie prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f RODO), do upływu terminów przedawnienia.",
        "Statystyki odwiedzin — własna analityka bez plików cookies: zapisuję odwiedzone podstrony, czas wizyty, głębokość przewinięcia, kliknięte elementy, typ urządzenia, przeglądarkę, kraj i źródło wejścia. Odwiedzającego rozpoznaję tylko po skrócie, który zmienia się codziennie — adresu IP nie przechowuję. Podstawa: prawnie uzasadniony interes w ulepszaniu strony (art. 6 ust. 1 lit. f RODO). Dane usuwam po 26 miesiącach.",
        "Google Analytics — wyłącznie po wyrażeniu zgody w ustawieniach cookies (art. 6 ust. 1 lit. a RODO), do czasu jej wycofania.",
      ],
    },
    {
      title: "Odbiorcy danych",
      items: [
        "Dane mogą otrzymać wyłącznie podmioty, które pomagają mi prowadzić stronę i współpracę, w niezbędnym zakresie i na podstawie umów powierzenia lub warunków usług: dostawca hostingu i bazy danych, dostawca wysyłki e-maili (Resend), komunikator Discord (powiadomienia o nowych zapytaniach), dostawca przechowywania plików oraz — po wyrażeniu zgody — Google (Google Analytics).",
        "Dane mogą otrzymać także organy publiczne, jeśli wynika to z przepisów prawa.",
        "Niektórzy dostawcy (np. Resend, Discord, Google, Vercel) mają siedzibę w USA. Przekazanie danych odbywa się na podstawie decyzji Komisji Europejskiej w sprawie EU-US Data Privacy Framework lub standardowych klauzul umownych.",
        "Nie sprzedaję danych i nie udostępniam ich w celach marketingowych.",
      ],
    },
    {
      title: "Twoje prawa",
      items: [
        "Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie.",
        "Jeśli przetwarzanie odbywa się na podstawie zgody, możesz ją w każdej chwili wycofać — bez wpływu na zgodność z prawem przetwarzania przed jej wycofaniem.",
        `Aby skorzystać z praw, napisz na ${site.email}. Odpowiem w ciągu miesiąca.`,
        "Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).",
        "Podanie danych jest dobrowolne, ale bez nich nie mogę odpowiedzieć na zapytanie ani założyć konta. Nie podejmuję decyzji w sposób zautomatyzowany i nie profiluję.",
      ],
    },
    {
      title: "Pliki cookies i pamięć przeglądarki",
      items: [
        "Strona używa niezbędnych plików cookies, bez których nie działałaby poprawnie, oraz — tylko za Twoją zgodą — cookies analitycznych Google Analytics.",
        "Zgodę możesz w każdej chwili zmienić lub wycofać w „Ustawieniach cookies” (link w stopce i na górze tej strony). Możesz też zarządzać plikami cookies w ustawieniach przeglądarki.",
        "Własna analityka nie zapisuje niczego na Twoim urządzeniu.",
      ],
      table: {
        head: ["Nazwa", "Rodzaj", "Cel", "Ważność"],
        rows: [
          ["afto_consent", "Niezbędne", "Zapamiętuje Twój wybór dotyczący cookies", "180 dni"],
          ["afto_session", "Niezbędne", "Utrzymuje zalogowanie w panelu klienta", "30 dni lub do wylogowania"],
          ["afto:service", "Niezbędne (pamięć sesji)", "Przenosi wybraną usługę z podstrony projektu do formularza", "Do zamknięcia karty"],
          ["_ga, _ga_*", "Analityczne (Google)", "Statystyki odwiedzin Google Analytics — tylko po zgodzie", "Do 2 lat"],
        ],
      },
    },
    {
      title: "Bezpieczeństwo",
      items: ["Strona korzysta z szyfrowanego połączenia (HTTPS). Hasła do panelu klienta są przechowywane wyłącznie jako skrót kryptograficzny (scrypt).", "Dostęp do danych ma wyłącznie Administrator."],
    },
    {
      title: "Zmiany polityki",
      items: ["Polityka może się zmienić, np. przy zmianie przepisów lub sposobu działania strony. Aktualna wersja jest zawsze dostępna na tej stronie, z datą obowiązywania."],
    },
  ];
  return { summary, sections };
}

export default async function PolitykaPrywatnosci() {
  await loadContent();
  const { summary, sections } = build();
  return (
    <LegalPage
      current="/polityka-prywatnosci"
      title="Polityka prywatności"
      intro="Jakie dane zbieram, po co, jak długo je przechowuję i jakie masz prawa. Bez prawniczego żargonu tam, gdzie się da."
      summary={summary}
      sections={sections}
    />
  );
}
