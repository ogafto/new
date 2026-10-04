/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROMPT DO AI — podpinanie dowolnej strony klienta pod CMS afto.works
 * ─────────────────────────────────────────────────────────────────────────────
 *  Jak używać:
 *   1. Panel → Strony klientów → (strona) → Integracja.
 *   2. Opcjonalnie opisz, czego klient potrzebuje (np. „sklep pod serwer Minecraft:
 *      rangi, ceny, płatności klienta przez jego Stripe, komendy RCON po zakupie”).
 *   3. Skopiuj gotowy prompt i wklej go w AI pracującym na kodzie strony klienta
 *      (Claude Code, Cursor, ChatGPT z repo). Klucze są już w nim wpisane.
 *
 *  Prompt mówi AI, żeby:
 *   - samo wybrało z kodu, co ma być edytowalne (teksty, zdjęcia, oferta, ceny, FAQ, linki, ustawienia),
 *   - zgłosiło to do panelu jednym PUT /schema RAZEM z obecną treścią strony (defaults) —
 *     klient od razu widzi w panelu to, co jest na stronie, i może to zmieniać, usuwać, dopisywać,
 *   - opisało każdą sekcję po ludzku (hint) i nazwało element listy (item: „pytanie”, „ranga”),
 *   - zarejestrowało webhook odświeżania — zmiana klienta jest na stronie od razu,
 *   - renderowało stronę dokładnie z CMS-a (usunięte przez klienta = znika ze strony),
 *   - trzymało klucze klienta (płatności, API, hasła) w polach „sekret” — nigdy w przeglądarce,
 *   - miało treści awaryjne tylko na wypadek awarii API.
 *  Plik bez zależności serwerowych — używany w komponencie panelu.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Collection } from "./cms-schema";

export function cmsPrompt(p: { site: string; domain: string | null; api: string; publicKey: string; secretKey: string; origin: string; collections: Pick<Collection, "key" | "name" | "kind" | "fields">[]; brief: string }) {
  const current = p.collections.length
    ? p.collections.map((c) => `- ${c.key} (${c.kind === "list" ? "lista" : "pojedyncza"}, „${c.name}”): ${c.fields.map((f) => `${f.key}:${f.type}`).join(", ") || "bez pól"}`).join("\n")
    : "- (brak — zdefiniuj sekcje od zera)";
  return `Jesteś senior full-stack developerem. Podłącz tę stronę („${p.site}”${p.domain ? `, ${p.domain}` : ""}) do zewnętrznego, headless CMS-a w panelu afto.works, tak żeby właściciel strony mógł sam edytować jej treść i ustawienia z panelu klienta — bez ruszania kodu.

## Co ma robić strona / czego potrzebuje klient
${p.brief.trim() || "Edycja wszystkich treści widocznych na stronie (teksty, zdjęcia, oferta, ceny, kontakt, linki, SEO)."}

## Dane dostępowe
Dodaj do zmiennych środowiskowych (NIE commituj do repo):
AFTO_CMS_URL=${p.api}
AFTO_CMS_SECRET=${p.secretKey}
Publiczny adres (bez sekretów, można użyć w przeglądarce): ${p.api}

## API (zwykły JSON, działa z każdą technologią)
- GET  ${p.api}
  → { site, updatedAt, private: false, content: { [sekcja]: obiekt (single) | tablica obiektów z polem id (list) } }
  Publiczne, BEZ cache (zmiana klienta jest w API natychmiast), CORS włączony. NIE zawiera pól typu "secret".
- GET  ${p.api}?private=1   z nagłówkiem  Authorization: Bearer $AFTO_CMS_SECRET
  → to samo + pola "secret". Wołaj WYŁĄCZNIE po stronie serwera (API route, server component, backend, plugin) — nigdy z przeglądarki.
- GET  ${p.api}/{sekcja}  (i ?private=1) — jedna sekcja.
- PUT  ${p.api}/schema   z Authorization: Bearer $AFTO_CMS_SECRET, body:
  {
    "webhook": "https://ADRES-STRONY/api/revalidate?token=…",          // panel woła go (POST) po każdym zapisie klienta
    "collections": [
      { "key": "faq", "name": "Pytania i odpowiedzi", "kind": "list", "item": "pytanie",
        "hint": "Sekcja FAQ na dole strony głównej",
        "fields": [ { "key": "question", "label": "Pytanie", "type": "text", "required": true },
                    { "key": "answer", "label": "Odpowiedź", "type": "textarea" } ],
        "defaults": [ { "question": "…obecne pytanie ze strony…", "answer": "…" }, … ] },
      { "key": "hero", "name": "Baner główny", "kind": "single", "hint": "Pierwszy ekran strony",
        "fields": [ … ], "defaults": { "title": "…obecny nagłówek…", "image": "https://…/hero.jpg" } }
    ]
  }
  Dopisuje/aktualizuje sekcje po kluczu (nic nie usuwa). "defaults" (obecna treść strony) wgrywa się TYLKO RAZ na sekcję —
  dzięki temu klient od razu widzi w panelu wszystko, co jest na stronie, a jego późniejsze zmiany i usunięcia nie są nadpisywane.
- GET  ${p.api}/schema   z Bearer — aktualny schemat.
Typy pól: text, textarea, image (pełny URL obrazka), url, number, toggle (bool), color (#hex), date (RRRR-MM-DD), secret (klucz API / hasło — tylko z ?private=1).

## Obecny schemat w panelu
${current}

## Zadanie krok po kroku
1. Przejrzyj kod strony i wypisz wszystko, co właściciel może chcieć zmieniać, w kolejności, w jakiej występuje na stronie: teksty i nagłówki, zdjęcia, oferta/produkty/cennik, FAQ, opinie, zespół, galeria, dane kontaktowe, godziny, linki social media, SEO (title/description), ogłoszenia, przełączniki sekcji (toggle).
2. Zaprojektuj schemat PROSTY DLA LAIKA (klient nie jest techniczny i nie dostanie instrukcji):
   - rzeczy występujące raz → kind "single"; powtarzalne (FAQ, produkty, rangi, pakiety, usługi, galeria, opinie, zespół) → kind "list",
   - "name" = nazwa części strony po polsku, tak jak klient ją widzi („Pytania i odpowiedzi”, „Rangi w sklepie”),
   - "hint" = jedno zdanie, gdzie to jest na stronie i co się stanie po zmianie,
   - "item" = nazwa jednego elementu listy w bierniku/mianowniku („pytanie”, „rangę”, „zdjęcie”, „opinię”) — przycisk w panelu brzmi „Dodaj {item}”,
   - etykiety pól krótkie i ludzkie, "help" tylko gdy trzeba (np. format, rozmiar zdjęcia), klucze snake_case po angielsku,
   - tylko to, co naprawdę warto edytować — bez technicznych pól, bez duplikatów. Ceny jako number (zł), obrazy jako image.
3. Integracje i płatności klienta: klucze, tokeny, hasła, ID kont (np. klucz Stripe/PayPal/Przelewy24 klienta, webhook Discorda, hasło RCON, IP i port serwera gry, klucze API dostawców) → osobna sekcja "integrations" (single, name „Ustawienia i integracje”) z polami type "secret" (i "text"/"url" dla rzeczy niewrażliwych). Czytaj je tylko na serwerze przez ?private=1.
4. Przygotuj "defaults" = DOKŁADNIE obecna treść strony: wszystkie teksty dosłownie, każdy element każdej listy (np. wszystkie pytania FAQ), obrazy jako pełne publiczne URL-e (zdjęcia z repo opublikuj pod stałym adresem strony). Po wgraniu klient ma zobaczyć w panelu 1:1 to, co jest na stronie.
5. Odświeżanie od razu: zrób endpoint revalidate (np. Next.js: app/api/revalidate/route.ts z sekretnym tokenem → revalidatePath("/") / revalidateTag("afto-cms"); inne technologie: wyczyść cache / przebuduj) i podaj jego pełny adres https w polu "webhook" przy PUT /schema. Dodatkowo cache treści na serwerze max 10 s (fetch { next: { revalidate: 10, tags: ["afto-cms"] } }), żeby zmiany były widoczne nawet bez webhooka.
6. Napisz skrypt (np. scripts/afto-schema.(ts|js|php)), który wysyła schemat + defaults przez PUT /schema, i uruchom go. Schemat trzymaj w repo jako jedno źródło prawdy (ponowne uruchomienie jest bezpieczne — defaults nie nadpisują zmian klienta).
   Klucze sekcji i pól są zapisywane 1:1 (np. heroTitle) — używaj w kodzie strony DOKŁADNIE tych samych kluczy przy odczycie.
   WERYFIKACJA (obowiązkowa): odpowiedź PUT ma mieć puste "warnings" i "seeded" > 0 dla sekcji z treścią; potem GET /schema (Bearer) → "entries" > 0 w każdej sekcji; GET ${p.api} → "content" zawiera obecną treść strony. Jeśli nie — popraw i wyślij ponownie, zanim skończysz.
7. Napisz małego klienta CMS (jedna funkcja/moduł) z twardymi zasadami renderowania:
   - po wgraniu treści CMS jest JEDYNYM źródłem prawdy: strona pokazuje dokładnie to, co zwraca API,
   - pusta lista → ta część strony się nie wyświetla (klient usunął wszystkie FAQ = brak sekcji FAQ), puste pole → element ukryty,
   - treści awaryjne (obecne teksty z kodu) TYLKO gdy API nie odpowiada (błąd sieci / 5xx / timeout 3 s) — nigdy jako uzupełnienie pustych pól,
   - waliduj typy (liczby, URL-e), tekst wstawiaj jako tekst (nie surowy HTML), kolejność list jak w API.
8. Podmień zahardkodowane treści na dane z CMS-a. Nie zmieniaj wyglądu strony — zmienia się tylko źródło treści.
9. Obrazy z CMS-a to pełne adresy URL — dodaj ${p.origin.replace(/^https?:\/\//, "")} i domenę strony do dozwolonych hostów obrazków (np. next.config images.remotePatterns).
10. Bezpieczeństwo: AFTO_CMS_SECRET i pola "secret" nigdy nie trafiają do kodu klienckiego, logów ani odpowiedzi API strony; token endpointu revalidate trzymaj w env.
11. Na koniec wypisz: listę części strony i pól (co klient może edytować), jakie zmienne środowiskowe ustawić na produkcji, adres webhooka, co przetestowałeś (w tym: zmiana w panelu → widoczna na stronie, usunięcie elementu listy → znika ze strony).

Pisz czysty, produkcyjny kod w stylu istniejącego projektu.`;
}

/*
 * Prompt naprawczy — gdy strona jest już podpięta, ale w panelu brakuje treści (puste sekcje):
 * AI zbiera obecną treść ze strony i wysyła ją jako defaults, z kluczami identycznymi jak w kodzie, i sprawdza wynik.
 */
export function cmsFixPrompt(p: { api: string; secretKey: string; problems: string[] }) {
  return `Ta strona jest już podłączona do CMS-a afto.works, ale w panelu klienta brakuje treści — klient nie widzi, co jest na stronie, więc nie może tego edytować. Napraw to.

Problemy wykryte przez panel:
${p.problems.map((x) => `- ${x}`).join("\n") || "- brak treści w sekcjach"}

Dane: AFTO_CMS_URL=${p.api}  AFTO_CMS_SECRET=${p.secretKey}  (nagłówek: Authorization: Bearer $AFTO_CMS_SECRET)

1. Znajdź w kodzie istniejący schemat / skrypt CMS (jeśli jest) i moduł, który czyta treści z CMS-a. Klucze sekcji i pól w schemacie MUSZĄ być identyczne z tymi, których strona używa przy odczycie (np. content.hero.title).
2. Dla KAŻDEJ edytowalnej sekcji dodaj "defaults" = dokładna, obecna treść widoczna na stronie (wszystkie teksty dosłownie, każdy element list: usługi, FAQ, opinie, cennik…; obrazy jako pełne publiczne URL-e). Single → obiekt { pole: wartość }, list → tablica takich obiektów. Klucze w defaults = klucze pól.
3. Każda sekcja ma mieć ludzkie "name", "hint" (gdzie to jest na stronie) i dla list "item" (np. "usługę", "pytanie").
4. Wyślij: PUT ${p.api}/schema  body { "webhook": "<https adres endpointu revalidate, jeśli jest>", "collections": [ … z defaults … ] }.
5. Sprawdź odpowiedź: pole "warnings" musi być puste, a "collections[].seeded" > 0 dla sekcji z treścią. Potem GET ${p.api}/schema (z Bearer) — "entries" > 0 dla każdej sekcji. Jeśli nie — popraw klucze i wyślij ponownie.
6. Sprawdź GET ${p.api} — "content" ma zawierać tę samą treść co strona. Upewnij się, że strona renderuje dokładnie to (pusta lista = ukryta sekcja, treści awaryjne tylko przy błędzie API).
7. Wypisz, co zostało wysłane (sekcje i liczba elementów) i co przetestowałeś.`;
}
