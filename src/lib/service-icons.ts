/*
 * Ikony usług — jeden katalog dla strony (formularz kontaktowy, /uslugi, stopka) i panelu (CMS, „Zamów usługę”).
 * Klucz zapisuje się w treściach (usługa.icon); dla nowej usługi bez wyboru — zgadujemy po nazwie.
 */

export const SERVICE_ICONS: Record<string, { label: string; d: string }> = {
  web: { label: "Strona", d: "M3.5 5.5h17v13h-17zM3.5 9h17M7 7.2h.01M9.5 7.2h.01M7 12.5h6M7 15h4" },
  shop: { label: "Sklep", d: "M6 8h12l-1 12H7zM9 8V6.5a3 3 0 016 0V8" },
  brand: { label: "Marka", d: "M12 3l2.6 5.6L20.5 9l-4.4 4 1.1 6L12 16.2 6.8 19l1.1-6-4.4-4 5.9-.4z" },
  ui: { label: "UI/UX", d: "M3.5 3.5h7.5v7.5H3.5zM13 3.5h7.5v4H13zM13 10h7.5v10.5H13zM3.5 13.5h7.5v7H3.5z" },
  anim: { label: "Animacja", d: "M12 21a9 9 0 100-18 9 9 0 000 18zM10 8.5v7l5.5-3.5z" },
  video: { label: "Wideo", d: "M4 6h12v12H4zM16 10l4-2v8l-4-2" },
  photo: { label: "Zdjęcia", d: "M4 7h3l1.5-2h7L17 7h3v12H4zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" },
  seo: { label: "SEO", d: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4M8 11l2 2 4-4" },
  ads: { label: "Reklamy", d: "M4 10v4h3l6 4V6L7 10zM17 9a4 4 0 010 6M19.5 6.5a7.5 7.5 0 010 11" },
  social: { label: "Social media", d: "M7 10a3 3 0 100-6 3 3 0 000 6zM17 20a3 3 0 100-6 3 3 0 000 6zM17 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM9.5 8.5l5.5 7M9.8 6.2l4.9-1.5" },
  print: { label: "Druk", d: "M7 8V3h10v5M5 8h14a1 1 0 011 1v7h-3M7 16H4V9M7 13h10v8H7z" },
  code: { label: "Programowanie", d: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" },
  mobile: { label: "Aplikacja", d: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2" },
  server: { label: "Hosting / serwer", d: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01" },
  game: { label: "Gry / serwer gry", d: "M6 9h12a3 3 0 013 3v2a3 3 0 01-5.2 2L14 14h-4l-1.8 2A3 3 0 013 14v-2a3 3 0 013-3zM8 11v2M7 12h2M15.5 11.5h.01M17.5 12.5h.01" },
  mail: { label: "Newsletter", d: "M3 6.5h18v11H3zM3 7l9 6 9-6" },
  write: { label: "Teksty", d: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" },
  support: { label: "Opieka / wsparcie", d: "M4 13a8 8 0 0116 0M4 13v4h3v-5H4zM20 13v4h-3v-5h3zM17 17a5 5 0 01-5 4" },
  other: { label: "Inne", d: "M12 5v14M5 12h14" },
};

const RULES: [RegExp, string][] = [
  [/anim|motion|intro|gif|lottie/i, "anim"],
  [/wideo|video|film|montaż|montaz|youtube|reel/i, "video"],
  [/zdj|foto|photo|sesj/i, "photo"],
  [/seo|pozycjon|google/i, "seo"],
  [/reklam|ads|kampani|marketing/i, "ads"],
  [/social|instagram|tiktok|facebook|media/i, "social"],
  [/druk|ulotk|wizytówk|wizytowk|plakat|baner|banner/i, "print"],
  [/minecraft|serwer gry|gaming|discord bot|gra\b|gry\b/i, "game"],
  [/hosting|serwer|domen|vps/i, "server"],
  [/aplikac|mobile|android|ios/i, "mobile"],
  [/sklep|e-?commerce|shop/i, "shop"],
  [/logo|identyfik|brand|marka/i, "brand"],
  [/ui|ux|figma|makiet|prototyp/i, "ui"],
  [/kod|program|bot|api|integrac|wtyczk/i, "code"],
  [/newsletter|mailing|e-?mail/i, "mail"],
  [/tekst|copy|treści|tresci|artyku/i, "write"],
  [/opiek|wsparc|serwis|abonament|utrzyman/i, "support"],
  [/stron|www|landing|witryn/i, "web"],
];

export function guessIcon(name: string) {
  return RULES.find(([re]) => re.test(name))?.[1] ?? "other";
}

const BUILTIN: Record<string, string> = { www: "web", shop: "shop", brand: "brand", ui: "ui" };

/** Klucz ikony dla usługi: wybrana w CMS → domyślna wbudowanej → zgadnięta z nazwy */
export function iconOf(s: { id: string; name: string; icon?: string | null }) {
  return (s.icon && SERVICE_ICONS[s.icon] ? s.icon : null) ?? BUILTIN[s.id] ?? guessIcon(s.name);
}

export const iconPath = (key: string) => (SERVICE_ICONS[key] ?? SERVICE_ICONS.other).d;
