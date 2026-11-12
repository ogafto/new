import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Jak afto.works przetwarza dane osobowe, jakich plików cookies używa i jakie masz prawa.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

function build() {
  const { owner, street, city } = site.legal;

  const summary = [
    `Administratorem danych jestem ja, ${owner}, ${city}.`,
    "Strona to portfolio: nie ma formularzy ani kont, nie podajesz tu żadnych danych.",
    "Statystyki odwiedzin zbieram anonimowo, bez plików cookies.",
    "Google Analytics włącza się wyłącznie za Twoją zgodą.",
    "Nie sprzedaję danych i nie wysyłam newsletterów.",
    "W każdej chwili możesz poprosić o wgląd, poprawienie lub usunięcie danych.",
  ];

  const sections: LegalSection[] = [
    {
      title: "Administrator danych",
      items: [
        `Administratorem danych osobowych jest ${owner}, ${street}, ${city} (dalej: „Administrator”).`,
        `Kontakt w sprawach danych osobowych: ${site.email}. Administrator nie wyznaczył inspektora ochrony danych.`,
      ],
    },
    {
      title: "Cele, podstawy i okres przetwarzania",
      items: [
        "Kontakt: jeśli napiszesz do mnie na Discordzie lub e-mailem, przetwarzam dane, które sam podasz (nazwa użytkownika, adres e-mail, treść wiadomości), aby odpowiedzieć i ewentualnie przygotować współpracę (art. 6 ust. 1 lit. b i f RODO). Wiadomości na Discordzie podlegają też zasadom prywatności Discorda.",
        "Statystyki odwiedzin: własna analityka bez plików cookies: zapisuję odwiedzone podstrony, czas wizyty, głębokość przewinięcia, kliknięte elementy, typ urządzenia, przeglądarkę, kraj i źródło wejścia. Odwiedzającego rozpoznaję tylko po skrócie, który zmienia się codziennie. Adresu IP nie przechowuję. Podstawa: prawnie uzasadniony interes w ulepszaniu strony (art. 6 ust. 1 lit. f RODO). Dane usuwam po 26 miesiącach.",
        "Google Analytics: wyłącznie po wyrażeniu zgody w ustawieniach cookies (art. 6 ust. 1 lit. a RODO), do czasu jej wycofania.",
      ],
    },
    {
      title: "Odbiorcy danych",
      items: [
        "Dane mogą otrzymać wyłącznie podmioty, które pomagają mi prowadzić stronę, w niezbędnym zakresie: dostawca hostingu i bazy danych (Vercel, Turso), dostawca przechowywania plików oraz, po wyrażeniu zgody, Google (Google Analytics).",
        "Niektórzy dostawcy (np. Vercel, Google, Discord) mają siedzibę w USA. Przekazanie danych odbywa się na podstawie decyzji Komisji Europejskiej w sprawie EU-US Data Privacy Framework lub standardowych klauzul umownych.",
        "Dane mogą otrzymać także organy publiczne, jeśli wynika to z przepisów prawa. Nie sprzedaję danych i nie udostępniam ich w celach marketingowych.",
      ],
    },
    {
      title: "Twoje prawa",
      items: [
        "Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie.",
        "Jeśli przetwarzanie odbywa się na podstawie zgody, możesz ją w każdej chwili wycofać, bez wpływu na zgodność z prawem przetwarzania przed jej wycofaniem.",
        `Aby skorzystać z praw, napisz na ${site.email}. Odpowiem w ciągu miesiąca.`,
        "Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).",
        "Nie podejmuję decyzji w sposób zautomatyzowany i nie profiluję.",
      ],
    },
    {
      title: "Pliki cookies i pamięć przeglądarki",
      items: [
        "Strona używa niezbędnych plików cookies, bez których nie działałaby poprawnie, oraz, tylko za Twoją zgodą, cookies analitycznych Google Analytics.",
        "Zgodę możesz w każdej chwili zmienić lub wycofać w „Ustawieniach cookies” (link w stopce i na górze tej strony). Możesz też zarządzać plikami cookies w ustawieniach przeglądarki.",
        "Własna analityka nie zapisuje niczego na Twoim urządzeniu.",
      ],
      table: {
        head: ["Nazwa", "Rodzaj", "Cel", "Ważność"],
        rows: [
          ["afto_consent", "Niezbędne", "Zapamiętuje Twój wybór dotyczący cookies", "180 dni"],
          ["afto_session", "Niezbędne", "Logowanie administratora do panelu (nie dotyczy odwiedzających)", "30 dni lub do wylogowania"],
          ["_ga, _ga_*", "Analityczne (Google)", "Statystyki odwiedzin Google Analytics, tylko po zgodzie", "Do 2 lat"],
        ],
      },
    },
    {
      title: "Bezpieczeństwo",
      items: ["Strona korzysta z szyfrowanego połączenia (HTTPS).", "Dostęp do danych ma wyłącznie Administrator."],
    },
    {
      title: "Zmiany polityki",
      items: ["Polityka może się zmienić, np. przy zmianie przepisów lub sposobu działania strony. Aktualna wersja jest zawsze dostępna na tej stronie, z datą obowiązywania."],
    },
  ];
  return { summary, sections };
}

export default function PolitykaPrywatnosci() {
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
