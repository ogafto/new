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
 *   - samo wybrało z kodu, co ma być edytowalne (teksty, zdjęcia, oferta, ceny, linki, ustawienia),
 *   - zgłosiło to do panelu jednym PUT /schema (sekcje i pola pojawią się u klienta same),
 *   - pobierało treści z API (publicznie na froncie albo z sekretami tylko na serwerze),
 *   - trzymało klucze klienta (płatności, API, hasła) w polach „sekret” — nigdy w przeglądarce,
 *   - miało treści awaryjne, gdy API nie odpowiada, i odświeżało się po zmianie (webhook).
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
  → { site, updatedAt, private: false, content: { [sekcja]: obiekt (pojedyncza) | tablica z polem id (lista) } }
  Publiczne, cache 30 s, CORS włączony. NIE zawiera pól typu "secret".
- GET  ${p.api}?private=1   z nagłówkiem  Authorization: Bearer $AFTO_CMS_SECRET
  → to samo + pola "secret". Wołaj WYŁĄCZNIE po stronie serwera (API route, server component, backend, plugin) — nigdy z przeglądarki.
- GET  ${p.api}/{sekcja}  (i ?private=1) — jedna sekcja.
- PUT  ${p.api}/schema   z Authorization: Bearer $AFTO_CMS_SECRET
  body: { "collections": [ { "key": "hero", "name": "Baner główny", "kind": "single" | "list", "fields": [ { "key": "title", "label": "Nagłówek", "type": "text", "required": true, "help": "krótka podpowiedź" } ] } ] }
  Dopisuje/aktualizuje sekcje po kluczu (nic nie usuwa, treści zostają). Po tym klient od razu widzi formularze w panelu.
- GET  ${p.api}/schema   z Bearer — aktualny schemat.
Typy pól: text, textarea, image (URL obrazka), url, number, toggle (bool), color (#hex), date (RRRR-MM-DD), secret (klucz API / hasło — tylko z ?private=1).

## Obecny schemat w panelu
${current}

## Zadanie krok po kroku
1. Przejrzyj kod strony i wypisz wszystko, co właściciel może chcieć zmieniać: teksty i nagłówki, zdjęcia, oferta/produkty/cennik, FAQ, opinie, dane kontaktowe, godziny, linki do social mediów, SEO (title/description), kolory akcentu, przełączniki sekcji (toggle), ogłoszenia.
2. Zaprojektuj schemat: rzeczy występujące raz → kind "single"; powtarzalne (produkty, rangi, pakiety, usługi, galeria, FAQ, opinie) → kind "list". Klucze snake_case po angielsku, etykiety i "help" po polsku, prosto dla laika. Ceny jako number (w złotych), obrazy jako image.
3. Integracje i płatności klienta: wszystko, co jest kluczem, tokenem, hasłem lub ID konta (np. klucz Stripe/PayPal/Przelewy24 klienta, webhook Discorda, hasło RCON, IP i port serwera gry, klucze API dostawców) → osobna sekcja "integrations" (single) z polami type "secret" (i "text"/"url" dla rzeczy niewrażliwych). Czytaj je tylko na serwerze przez ?private=1.
4. Napisz skrypt (np. scripts/afto-schema.(ts|js|php)), który wysyła ten schemat przez PUT /schema, i uruchom go raz. Schemat trzymaj w repo jako jedno źródło prawdy.
5. Napisz małego klienta CMS (jedna funkcja/moduł): pobiera treści, waliduje typy, ma WBUDOWANE treści awaryjne (obecne teksty ze strony) na wypadek, gdy API nie odpowiada albo pole jest puste. Strona nigdy nie może się wysypać przez CMS.
6. Podmień zahardkodowane treści na dane z CMS-a (z fallbackiem). Listy renderuj w kolejności z API.
7. Cache: na serwerze odświeżaj co 60 s (np. Next.js fetch { next: { revalidate: 60 } } / ISR / cache w pamięci z TTL). Opcjonalnie wystaw endpoint revalidate (np. POST /api/revalidate?token=…) i podaj mi jego adres — wkleję go w panelu jako webhook „po zmianie treści”, żeby strona odświeżała się od razu po zapisie.
8. Obrazy z CMS-a to pełne adresy URL — dodaj domenę ${p.origin.replace(/^https?:\/\//, "")} do dozwolonych hostów obrazków (np. next.config images.remotePatterns).
9. Bezpieczeństwo: AFTO_CMS_SECRET i pola "secret" nigdy nie trafiają do kodu klienckiego, logów ani odpowiedzi API strony. Waliduj/sanityzuj wartości z CMS-a (np. URL-e, liczby) zanim ich użyjesz, a tekstu nie wstawiaj jako surowego HTML.
10. Na koniec wypisz: listę sekcji i pól (co klient może edytować), jakie zmienne środowiskowe ustawić na produkcji, adres webhooka do odświeżania (jeśli jest) oraz co przetestowałeś.

Pisz czysty, produkcyjny kod w stylu istniejącego projektu. Nie zmieniaj wyglądu strony — zmienia się tylko źródło treści.`;
}
