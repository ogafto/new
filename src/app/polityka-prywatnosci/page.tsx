import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Zasady przetwarzania danych osobowych i plików cookies.",
};

const { owner, address } = site.legal;

const sections: LegalSection[] = [
  {
    title: "Administrator danych",
    items: [
      `Administratorem danych osobowych jest ${owner}, ${address} (dalej: „Administrator”).`,
      `W sprawach ochrony danych możesz kontaktować się pod adresem ${site.email}.`,
    ],
  },
  {
    title: "Jakie dane przetwarzam i po co",
    items: [
      "Imię, adres e-mail, numer telefonu i treść wiadomości — w celu odpowiedzi na zapytanie i przygotowania wyceny (art. 6 ust. 1 lit. b RODO).",
      "Dane niezbędne do wystawienia rachunku lub faktury — w celu wypełnienia obowiązków prawnych (art. 6 ust. 1 lit. c RODO).",
      "Dane z korespondencji — w celu ewentualnego dochodzenia roszczeń lub obrony przed nimi (art. 6 ust. 1 lit. f RODO).",
    ],
  },
  {
    title: "Jak długo przechowuję dane",
    items: [
      "Dane z zapytań — do czasu zakończenia korespondencji, a w przypadku zawarcia umowy przez okres jej realizacji.",
      "Dane rozliczeniowe — przez okres wymagany przepisami podatkowymi.",
    ],
  },
  {
    title: "Odbiorcy danych",
    items: [
      "Dane mogą być przekazywane podmiotom wspierającym działalność Administratora: dostawcy poczty e-mail, hostingu oraz biuru rachunkowemu — wyłącznie w niezbędnym zakresie.",
      "Dane nie są sprzedawane ani udostępniane w celach marketingowych osobom trzecim.",
    ],
  },
  {
    title: "Twoje prawa",
    items: [
      "Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz wniesienia sprzeciwu.",
      "Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych.",
      "Podanie danych jest dobrowolne, ale niezbędne do odpowiedzi na zapytanie.",
    ],
  },
  {
    title: "Pliki cookies",
    items: [
      "Strona używa niezbędnych plików cookies, w tym ciasteczka „afto_consent”, które zapamiętuje Twój wybór dotyczący cookies przez 180 dni.",
      "Za Twoją zgodą strona może używać cookies analitycznych (Google Analytics 4) do anonimowych statystyk odwiedzin oraz marketingowych do pomiaru skuteczności reklam.",
      "Cookies opcjonalne są ładowane dopiero po wyrażeniu zgody. Zgodę możesz w każdej chwili zmienić lub wycofać, klikając „Ustawienia cookies” w stopce strony.",
      "Możesz też zarządzać plikami cookies w ustawieniach swojej przeglądarki.",
    ],
  },

];

export default function PolitykaPrywatnosci() {
  return <LegalPage title="Polityka prywatności" sections={sections} />;
}
