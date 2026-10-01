import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin świadczenia usług projektowania i tworzenia stron internetowych.",
};

const { owner, address, nip } = site.legal;

const sections: LegalSection[] = [
  {
    title: "Postanowienia ogólne",
    items: [
      `Regulamin określa zasady świadczenia usług projektowania i tworzenia stron internetowych przez ${owner}, ${address}, ${nip} (dalej: „Wykonawca”).`,
      `Kontakt z Wykonawcą: ${site.email}, tel. ${site.phone}.`,
      "Klientem może być osoba fizyczna, osoba prawna lub jednostka organizacyjna zamawiająca usługę (dalej: „Klient”).",
      "Złożenie zamówienia oznacza akceptację niniejszego Regulaminu.",
    ],
  },
  {
    title: "Zakres usług",
    items: [
      "Wykonawca świadczy usługi: projektowania interfejsów (UI/UX) w programie Figma, tworzenia stron internetowych, wdrożeń, modyfikacji i opieki technicznej.",
      "Szczegółowy zakres, cena i termin realizacji są ustalane indywidualnie i potwierdzane przez strony drogą elektroniczną przed rozpoczęciem prac.",
      "Ceny podane na stronie są cenami startowymi („od”) i nie stanowią oferty w rozumieniu Kodeksu cywilnego.",
    ],
  },
  {
    title: "Zamówienie i realizacja",
    items: [
      "Zamówienie składa się przez formularz kontaktowy, e-mail lub telefon.",
      "Po ustaleniu zakresu Wykonawca przesyła wycenę. Akceptacja wyceny przez Klienta oznacza zawarcie umowy.",
      "Wykonawca może pobrać zaliczkę, o czym informuje w wycenie. Prace rozpoczynają się po jej zaksięgowaniu.",
      "Klient zobowiązuje się dostarczyć materiały (teksty, zdjęcia, logo) potrzebne do realizacji. Opóźnienia w ich dostarczeniu wydłużają termin realizacji.",
      "W cenie pakietu zawarte są dwie rundy poprawek projektu, chyba że wycena stanowi inaczej. Kolejne zmiany są wyceniane osobno.",
    ],
  },
  {
    title: "Płatności",
    items: [
      "Płatność następuje przelewem na podstawie rachunku lub faktury, w terminie wskazanym w dokumencie.",
      "Publikacja strony na docelowej domenie następuje po zaksięgowaniu pełnej płatności.",
      "Koszty domeny, hostingu i usług zewnętrznych ponosi Klient, chyba że strony ustalą inaczej.",
    ],
  },
  {
    title: "Prawa autorskie",
    items: [
      "Z chwilą zapłaty całości wynagrodzenia Wykonawca przenosi na Klienta autorskie prawa majątkowe do projektu i kodu strony na polach eksploatacji niezbędnych do korzystania ze strony.",
      "Wykonawca zachowuje prawo do zamieszczenia realizacji w swoim portfolio, chyba że Klient wyrazi pisemny sprzeciw.",
      "Klient oświadcza, że dostarczone przez niego materiały nie naruszają praw osób trzecich.",
    ],
  },
  {
    title: "Odstąpienie od umowy (konsumenci)",
    items: [
      "Klient będący konsumentem może odstąpić od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny, składając oświadczenie drogą elektroniczną.",
      "Jeżeli na wyraźne żądanie konsumenta Wykonawca rozpoczął świadczenie usługi przed upływem terminu do odstąpienia, konsument zobowiązany jest do zapłaty za usługi spełnione do chwili odstąpienia.",
      "Prawo odstąpienia nie przysługuje po pełnym wykonaniu usługi za wyraźną zgodą konsumenta, poinformowanego o utracie prawa odstąpienia.",
    ],
  },
  {
    title: "Reklamacje",
    items: [
      `Reklamacje można składać na adres ${site.email}, opisując problem.`,
      "Wykonawca rozpatruje reklamację w ciągu 14 dni od jej otrzymania.",
      "Błędy techniczne strony zgłoszone w okresie wsparcia wskazanym w pakiecie są usuwane bezpłatnie.",
    ],
  },
  {
    title: "Postanowienia końcowe",
    items: [
      "W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego i ustawy o prawach konsumenta.",
      "Wykonawca może zmienić Regulamin. Zmiany nie dotyczą umów zawartych przed ich wprowadzeniem.",
    ],
  },
];

export default function Regulamin() {
  return <LegalPage title="Regulamin" sections={sections} />;
}
