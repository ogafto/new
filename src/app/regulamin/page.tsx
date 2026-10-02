import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { loadContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin świadczenia usług projektowania stron internetowych, sklepów, identyfikacji wizualnej i projektów UI/UX — afto.works.",
  alternates: { canonical: "/regulamin" },
};

const { owner, street, city } = site.legal;
const contact = `e-mail: ${site.email}, tel. ${site.phone}`;

const summary = [
  "Usługi świadczy Wojciech Lubojański w ramach działalności nierejestrowanej.",
  "Cenę, zakres i termin ustalamy indywidualnie — umowa zawiera się z chwilą akceptacji wyceny.",
  "Po pełnej zapłacie otrzymujesz autorskie prawa majątkowe do projektu i kodu.",
  "Konsument może odstąpić od umowy w ciągu 14 dni — z wyjątkami opisanymi w § 9.",
  "Reklamacje rozpatruję w ciągu 14 dni.",
  "Panel klienta i edytor treści są bezpłatnym dodatkiem do współpracy.",
];

const sections: LegalSection[] = [
  {
    title: "Postanowienia ogólne",
    items: [
      `Regulamin określa zasady świadczenia usług za pośrednictwem serwisu ${site.domain} (dalej: „Serwis”) przez ${owner}, prowadzącego działalność nierejestrowaną w rozumieniu art. 5 ust. 1 ustawy z dnia 6 marca 2018 r. – Prawo przedsiębiorców, adres: ${street}, ${city} (dalej: „Wykonawca”).`,
      `Kontakt z Wykonawcą: ${contact}.`,
      "Działalność nierejestrowana nie podlega wpisowi do CEIDG. Wykonawca nie posługuje się numerami NIP i REGON nadanymi w związku z działalnością gospodarczą.",
      "Klientem jest osoba fizyczna, osoba prawna lub jednostka organizacyjna, która korzysta z usług Wykonawcy (dalej: „Klient”). Konsumentem jest Klient będący osobą fizyczną, który zawiera umowę niezwiązaną bezpośrednio z jego działalnością gospodarczą lub zawodową.",
      "Postanowienia dotyczące konsumentów stosuje się również do osoby fizycznej zawierającej umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy z treści umowy wynika, że nie ma ona dla tej osoby charakteru zawodowego (art. 38a ustawy o prawach konsumenta).",
      "Regulamin jest udostępniony bezpłatnie w Serwisie w sposób umożliwiający jego pobranie, zapisanie i wydrukowanie.",
    ],
  },
  {
    title: "Zakres usług",
    items: [
      "Wykonawca świadczy usługi: projektowania i tworzenia stron internetowych, sklepów internetowych, identyfikacji wizualnej (m.in. logo, kolorystyka, typografia), projektowania interfejsów UI/UX, a także wdrożeń, modyfikacji i opieki technicznej.",
      "Ceny podane w Serwisie są cenami minimalnymi („od”), mają charakter informacyjny i stanowią zaproszenie do zawarcia umowy w rozumieniu art. 71 Kodeksu cywilnego, a nie ofertę.",
      "Podawane ceny są kwotami końcowymi do zapłaty przez Klienta.",
      "Dodatkowo Wykonawca udostępnia bezpłatnie Klientom: panel klienta z podglądem postępu prac oraz edytor treści (CMS) strony wykonanej przez Wykonawcę.",
    ],
  },
  {
    title: "Wymagania techniczne",
    items: [
      "Do korzystania z Serwisu potrzebne jest urządzenie z dostępem do internetu, aktualna przeglądarka internetowa z włączoną obsługą JavaScript oraz — w przypadku kontaktu i panelu klienta — aktywny adres e-mail.",
      "Zakazane jest dostarczanie przez Klienta treści o charakterze bezprawnym oraz podejmowanie działań zakłócających działanie Serwisu.",
    ],
  },
  {
    title: "Zawarcie umowy",
    items: [
      "Klient może złożyć zapytanie przez formularz kontaktowy, e-mailem, telefonicznie lub przez Discord.",
      "Na podstawie zapytania i rozmowy Wykonawca przesyła wycenę zawierającą co najmniej: zakres prac, wynagrodzenie, terminy, liczbę rund poprawek oraz ewentualną zaliczkę.",
      "Umowa zostaje zawarta z chwilą akceptacji wyceny przez Klienta drogą elektroniczną (np. e-mailem). Wykonawca potwierdza zawarcie umowy i jej treść na trwałym nośniku (e-mail).",
      "Zmiana zakresu w trakcie realizacji wymaga uzgodnienia stron i może wpłynąć na wynagrodzenie oraz termin.",
    ],
  },
  {
    title: "Realizacja usług",
    items: [
      "Realizacja przebiega etapami: rozmowa i brief, kierunek wizualny, projekt, wdrożenie. Szczegóły etapów i ich terminy określa wycena.",
      "Klient dostarcza materiały potrzebne do realizacji (np. teksty, zdjęcia, logo, dostępy). Opóźnienie w ich przekazaniu lub w akceptacji etapu odpowiednio wydłuża termin realizacji.",
      "W cenie zawarte są dwie rundy poprawek na każdym etapie, chyba że wycena stanowi inaczej. Kolejne zmiany Wykonawca wycenia osobno, po uzgodnieniu z Klientem.",
      "Wykonawca może korzystać z bibliotek i komponentów open-source oraz zasobów na licencjach dopuszczających zastosowanie komercyjne.",
    ],
  },
  {
    title: "Wynagrodzenie i płatności",
    items: [
      "Płatność następuje przelewem na rachunek bankowy wskazany przez Wykonawcę, w terminie określonym w wycenie lub rachunku.",
      "Wykonawca może pobrać zaliczkę w wysokości wskazanej w wycenie. Prace rozpoczynają się po jej zaksięgowaniu.",
      "Na żądanie Klienta Wykonawca wystawia rachunek.",
      "Publikacja strony na docelowej domenie oraz przekazanie plików źródłowych następują po zaksięgowaniu pełnego wynagrodzenia.",
      "Koszty usług zewnętrznych (np. domena, hosting, płatne wtyczki, licencje na fonty i zdjęcia) ponosi Klient, chyba że strony ustalą inaczej.",
    ],
  },
  {
    title: "Prawa autorskie",
    items: [
      "Z chwilą zapłaty całości wynagrodzenia Wykonawca przenosi na Klienta autorskie prawa majątkowe do wykonanego projektu i kodu, na polach eksploatacji: utrwalanie i zwielokrotnianie dowolną techniką, wprowadzanie do pamięci komputera, publiczne udostępnianie w internecie, rozpowszechnianie oraz wprowadzanie zmian i opracowań.",
      "Do czasu zapłaty całości wynagrodzenia Klient może korzystać z projektów wyłącznie w celu ich akceptacji.",
      "Elementy open-source oraz zasoby osób trzecich pozostają na swoich licencjach.",
      "Wykonawca może zaprezentować wykonaną pracę w swoim portfolio i mediach społecznościowych, chyba że Klient zgłosi sprzeciw.",
      "Klient oświadcza, że przekazane przez niego materiały nie naruszają praw osób trzecich.",
    ],
  },
  {
    title: "Panel klienta i edytor treści (CMS)",
    items: [
      "Konto w panelu klienta można założyć wyłącznie z kodem zaproszenia przesłanym przez Wykonawcę. Założenie konta wymaga potwierdzenia adresu e-mail.",
      "Umowa o prowadzenie konta jest zawierana na czas nieoznaczony i jest bezpłatna. Klient może w każdej chwili zażądać usunięcia konta, pisząc na adres e-mail Wykonawcy.",
      "Klient odpowiada za poufność hasła oraz za treści, które samodzielnie publikuje przez edytor treści.",
      "Wykonawca może zablokować konto w razie naruszenia Regulaminu lub prób zakłócania działania Serwisu, informując o tym Klienta.",
    ],
  },
  {
    title: "Odstąpienie od umowy",
    items: [
      "Konsument może odstąpić od umowy zawartej na odległość w terminie 14 dni od dnia jej zawarcia, bez podawania przyczyny, składając oświadczenie np. e-mailem. Może skorzystać ze wzoru formularza stanowiącego załącznik nr 2 do ustawy o prawach konsumenta, ale nie jest to obowiązkowe.",
      "Do zachowania terminu wystarczy wysłanie oświadczenia przed jego upływem. Wykonawca zwraca płatności w terminie 14 dni od otrzymania oświadczenia, tą samą metodą, której użył Konsument, chyba że Konsument zgodzi się na inną.",
      "Jeżeli na wyraźne żądanie Konsumenta Wykonawca rozpoczął świadczenie usługi przed upływem terminu do odstąpienia, Konsument płaci za świadczenia spełnione do chwili odstąpienia.",
      "Prawo odstąpienia nie przysługuje w przypadku umowy o świadczenie usług, jeżeli Wykonawca wykonał w pełni usługę za wyraźną zgodą Konsumenta, który został poinformowany przed rozpoczęciem świadczenia, że po jego spełnieniu utraci prawo odstąpienia od umowy (art. 38 ust. 1 pkt 1 ustawy o prawach konsumenta).",
    ],
  },
  {
    title: "Reklamacje",
    items: [
      "Wykonawca odpowiada za zgodność usługi z umową. Wobec Konsumentów — na zasadach ustawy o prawach konsumenta, w tym przepisów o treściach i usługach cyfrowych; wobec pozostałych Klientów — na zasadach Kodeksu cywilnego.",
      `Reklamację można złożyć e-mailem na adres ${site.email}. Warto podać: dane kontaktowe, opis problemu i oczekiwany sposób jego rozwiązania.`,
      "Wykonawca odpowiada na reklamację w ciągu 14 dni od jej otrzymania. Odpowiedź zostanie przesłana e-mailem.",
      "Błędy techniczne zgłoszone w okresie wsparcia wskazanym w wycenie Wykonawca usuwa bezpłatnie.",
    ],
  },
  {
    title: "Odpowiedzialność",
    items: [
      "Wykonawca nie odpowiada za przerwy i błędy usług zewnętrznych, z których korzysta strona Klienta (np. hostingu, domeny, bramek płatności), ani za treści dodane przez Klienta.",
      "Wobec Klientów niebędących Konsumentami odpowiedzialność Wykonawcy ogranicza się do wysokości otrzymanego wynagrodzenia i nie obejmuje utraconych korzyści.",
      "Ograniczenia odpowiedzialności nie dotyczą Konsumentów ani szkód wyrządzonych umyślnie.",
    ],
  },
  {
    title: "Pozasądowe rozwiązywanie sporów",
    items: [
      "Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, m.in. z pomocy miejskiego lub powiatowego rzecznika konsumentów, Wojewódzkiego Inspektoratu Inspekcji Handlowej oraz stałych polubownych sądów konsumenckich.",
      "Informacje o tych sposobach są dostępne na stronie Urzędu Ochrony Konkurencji i Konsumentów: uokik.gov.pl.",
    ],
  },
  {
    title: "Postanowienia końcowe",
    items: [
      "W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy o prawach konsumenta, ustawy o świadczeniu usług drogą elektroniczną oraz ustawy o prawie autorskim i prawach pokrewnych.",
      "Spory z Klientami niebędącymi Konsumentami rozstrzyga sąd właściwy dla miejsca zamieszkania Wykonawcy.",
      "Wykonawca może zmienić Regulamin z ważnych przyczyn (np. zmiana przepisów lub zakresu usług). Użytkownicy panelu klienta zostaną poinformowani e-mailem z co najmniej 14-dniowym wyprzedzeniem. Zmiany nie dotyczą umów zawartych wcześniej.",
      `Regulamin obowiązuje od ${site.legal.updated}.`,
    ],
  },
];

export default async function Regulamin() {
  await loadContent();
  return (
    <LegalPage
      current="/regulamin"
      title="Regulamin"
      intro="Zasady współpracy: jak zamawiasz usługę, jak przebiega realizacja, płatności, prawa autorskie i Twoje prawa jako klienta."
      summary={summary}
      sections={sections}
    />
  );
}
