import { BUILTIN_SERVICES, services, site, steps, type ServiceId } from "./site";
import { offers } from "./offer";

/*
 * Treści strony edytowane w panelu (Panel → Treści strony).
 * Domyślne wartości pochodzą z site.ts; zapisane w panelu nadpisują je w całej aplikacji.
 * applyContent() podmienia wartości w obiektach `site` / `services` / `offers`, więc komponenty
 * czytające te obiekty nie wymagają zmian. Plik jest wspólny dla serwera i przeglądarki.
 */

export type ServiceContent = { name: string; price: number; time: string; description: string; icon: string };
export type StepContent = { title: string; lead: string; text: string; points: string[] };
export type Announcement = { enabled: boolean; text: string; label: string; link: string };
export type Availability = { open: boolean; text: string };
export type CustomService = { id: string; name: string; price: number; time: string; description: string; icon?: string };

export type Soon = { enabled: boolean; kicker: string; title: string; accent: string; text: string; button: string; link: string; date: string };

export type Content = {
  email: string;
  phone: string;
  socials: { label: string; href: string }[];
  legal: { owner: string; form: string; street: string; city: string; updated: string };
  hero: { line1: string; line2: string; accent: string; text: string };
  services: Record<ServiceId, ServiceContent>;
  customServices: CustomService[];
  hiddenServices: string[];
  seo: { title: string; description: string };
  announcement: Announcement;
  availability: Availability;
  steps: StepContent[];
  soon: Soon;
  texts: Texts;
  forms: Forms;
};

/* Teksty sekcji strony (nagłówki, opisy, przyciski) — wszystko, co nie jest danymi powyżej */
export const DEFAULT_TEXTS = {
  hero: { cta: "Wyceń projekt", ctaSecondary: "Portfolio", recent: "Ostatnie projekty" },
  work: { label: "Portfolio", text: "Strony, sklepy, identyfikacje i projekty UI/UX — każdy zaprojektowany od zera, pod konkretny cel.", more: "Całe portfolio", view: "Zobacz projekt" },
  process: {
    kicker: "Proces",
    title: "Od pierwszej rozmowy",
    accent: "do premiery.",
    text: "Cztery etapy, jasne zasady. Na każdym wiesz, co się dzieje i co będzie dalej — a postęp widzisz w swoim panelu.",
    ctaText: "Pierwszy krok to",
    ctaAccent: "krótka rozmowa.",
    ctaButton: "Umów rozmowę",
  },
  contact: {
    kicker: "Kontakt",
    title: "Porozmawiajmy",
    accent: "o Twoim projekcie",
    text: "Cztery krótkie pytania — zajmie to mniej niż minutę. Odezwę się z pytaniami i wyceną.",
    direct: "Wolisz bezpośrednio?",
    q1: "Czego potrzebujesz?",
    q2: "Jaki masz budżet?",
    q3: "Opowiedz o projekcie",
    q4: "Gdzie mam odpisać?",
    example: "np. „Piekarnia we Wrocławiu, chcemy przyjmować zamówienia online”",
    when: "Kiedy chcesz zacząć? (opcjonalnie)",
    send: "Wyślij zapytanie",
    successTitle: "Dziękuję",
    successText: "Wiadomość dotarła — odezwę się najszybciej, jak to możliwe.",
  },
  footer: { marquee: "Zacznijmy projekt", tagline: "Projektuję i koduję strony, które wyglądają drogo i sprzedają." },
};
export type Texts = { [K in keyof typeof DEFAULT_TEXTS]: { [F in keyof (typeof DEFAULT_TEXTS)[K]]: string } };

/* Opcje formularzy (strona: kontakt, panel: „Zamów usługę”) */
export type Forms = { budgets: { v: string; hint: string }[]; timelines: string[] };
export const DEFAULT_FORMS: Forms = {
  budgets: [
    { v: "50–200 zł", hint: "Drobne zmiany, prosta wizytówka" },
    { v: "200–500 zł", hint: "Strona-wizytówka, landing" },
    { v: "500–1 000 zł", hint: "Strona firmowa, logo" },
    { v: "1 000–3 000 zł", hint: "Sklep, rozbudowana strona" },
    { v: "powyżej 3 000 zł", hint: "Duży projekt, marka od zera" },
    { v: "Jeszcze nie wiem", hint: "Doradzę, co ma sens" },
  ],
  timelines: ["Jak najszybciej", "W ciągu miesiąca", "1–3 miesiące", "Bez pośpiechu"],
};

export const DEFAULT_HERO = {
  line1: "Strony, które",
  line2: "wyglądają drogo.",
  accent: "I sprzedają.",
  text: "Projektuję i koduję strony internetowe, sklepy i identyfikacje wizualne dla marek, które chcą być zapamiętane.",
};

export const DEFAULT_SEO = {
  title: `Web designer & web developer — strony internetowe i sklepy | ${site.domain}`,
  description: "Web designer & web developer. Projektuję i koduję strony internetowe, sklepy i identyfikacje wizualne dla firm z całej Polski. Strona od 200 zł.",
};

const base = {
  email: site.email,
  phone: site.phone,
  socials: site.socials.map((s) => ({ ...s })),
  legal: { ...site.legal },
};
const baseSteps: StepContent[] = steps.map((x) => ({ title: x.title, lead: x.lead, text: x.text, points: [...x.points] }));
export const DEFAULT_ANNOUNCEMENT: Announcement = { enabled: false, text: "Nowa odsłona afto.works już online.", label: "Zobacz portfolio", link: "/portfolio" };
export const DEFAULT_AVAILABILITY: Availability = { open: true, text: "Przyjmuję nowe projekty" };
export const DEFAULT_SOON: Soon = {
  enabled: false,
  kicker: "afto.works",
  title: "Coś nowego",
  accent: "nadchodzi.",
  text: "Pracuję nad nową odsłoną. Dołącz na Discordzie, żeby dowiedzieć się pierwszy — i zobaczyć więcej wcześniej.",
  button: "Dołącz na Discordzie",
  link: "",
  date: "",
};

const BUILTIN_ICON: Record<string, string> = { www: "web", shop: "shop", brand: "brand", ui: "ui" };
const baseServices = Object.fromEntries(BUILTIN_SERVICES.map((s) => [s.id, { name: s.name, price: s.price, time: s.time, description: s.description, icon: BUILTIN_ICON[s.id] ?? "other" }])) as Record<ServiceId, ServiceContent>;

export const defaultContent = (): Content => ({
  ...structuredClone(base),
  hero: { ...DEFAULT_HERO },
  services: structuredClone(baseServices),
  customServices: [],
  hiddenServices: [],
  seo: { ...DEFAULT_SEO },
  announcement: { ...DEFAULT_ANNOUNCEMENT },
  availability: { ...DEFAULT_AVAILABILITY },
  steps: structuredClone(baseSteps),
  soon: { ...DEFAULT_SOON },
  texts: structuredClone(DEFAULT_TEXTS),
  forms: structuredClone(DEFAULT_FORMS),
});

/** Scala zapisane dane z domyślnymi (brakujące pola = domyślne) */
export function mergeContent(saved: Partial<Content> | null | undefined): Content {
  const d = defaultContent();
  if (!saved) return d;
  const pick = <T extends Record<string, unknown>>(def: T, v: unknown): T => {
    const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(def).map(([k, dv]) => [k, typeof o[k] === typeof dv && o[k] !== "" ? o[k] : dv])) as T;
  };
  return {
    email: typeof saved.email === "string" && saved.email ? saved.email : d.email,
    phone: typeof saved.phone === "string" && saved.phone ? saved.phone : d.phone,
    socials: d.socials.map((s) => ({ label: s.label, href: saved.socials?.find((x) => x.label === s.label)?.href || s.href })),
    legal: pick(d.legal, saved.legal),
    hero: pick(d.hero, saved.hero),
    services: Object.fromEntries(Object.entries(d.services).map(([id, s]) => [id, pick(s, saved.services?.[id as ServiceId])])) as Content["services"],
    customServices: (Array.isArray(saved.customServices) ? saved.customServices : [])
      .filter((x) => x && typeof x.id === "string" && typeof x.name === "string" && x.name.trim())
      .slice(0, 20)
      .map((x) => ({ id: x.id.slice(0, 40), name: x.name.slice(0, 60), price: Math.max(0, Number(x.price) || 0), time: String(x.time ?? "").slice(0, 40), description: String(x.description ?? "").slice(0, 300), icon: typeof x.icon === "string" ? x.icon.slice(0, 20) : "" })),
    hiddenServices: (Array.isArray(saved.hiddenServices) ? saved.hiddenServices : []).filter((x) => BUILTIN_SERVICES.some((b) => b.id === x)),
    seo: pick(d.seo, saved.seo),
    announcement: { ...pick(d.announcement, saved.announcement), enabled: typeof saved.announcement?.enabled === "boolean" ? saved.announcement.enabled : d.announcement.enabled },
    availability: { ...pick(d.availability, saved.availability), open: typeof saved.availability?.open === "boolean" ? saved.availability.open : d.availability.open },
    soon: { ...pick(d.soon, saved.soon), enabled: typeof saved.soon?.enabled === "boolean" ? saved.soon.enabled : false, link: typeof saved.soon?.link === "string" ? saved.soon.link : "", date: typeof saved.soon?.date === "string" ? saved.soon.date : "" },
    texts: Object.fromEntries(Object.entries(d.texts).map(([k, v]) => [k, pick(v, (saved.texts as Record<string, unknown> | undefined)?.[k])])) as Texts,
    forms: {
      budgets: Array.isArray(saved.forms?.budgets) && saved.forms.budgets.some((b) => b?.v) ? saved.forms.budgets.filter((b) => b && typeof b.v === "string" && b.v.trim()).slice(0, 10).map((b) => ({ v: b.v.slice(0, 40), hint: String(b.hint ?? "").slice(0, 80) })) : d.forms.budgets,
      timelines: Array.isArray(saved.forms?.timelines) && saved.forms.timelines.some(Boolean) ? saved.forms.timelines.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 8) : d.forms.timelines,
    },
    steps: d.steps.map((st, i) => {
      const v = saved.steps?.[i];
      return { ...pick({ title: st.title, lead: st.lead, text: st.text }, v), points: Array.isArray(v?.points) && v.points.length ? v.points.map(String).slice(0, 5) : st.points };
    }),
  };
}

// ostatnio zastosowane treści (do odczytu np. przez Hero)
let current: Content = defaultContent();
export const content = () => current;

export function applyContent(c: Content) {
  current = c;
  site.email = c.email;
  site.phone = c.phone;
  site.socials = c.socials.map((s) => ({ ...s }));
  Object.assign(site.legal, c.legal);
  for (const s of BUILTIN_SERVICES) Object.assign(s, c.services[s.id as ServiceId]);
  // widoczne wbudowane + własne (formularz kontaktowy, „Zamów usługę” w panelu)
  const next = [...BUILTIN_SERVICES.filter((s) => !c.hiddenServices.includes(s.id)), ...c.customServices.map((x) => ({ ...x, icon: x.icon || undefined, plural: x.name, custom: true }))];
  services.splice(0, services.length, ...next);
  c.steps.forEach((st, i) => steps[i] && Object.assign(steps[i], { ...st, points: [...st.points] }));
  // podstrony /uslugi: cena, czas i widoczność z CMS; podstrona bez wbudowanej usługi (np. „Animacje”)
  // przejmuje cenę własnej usługi o podobnej nazwie — wtedy obie są jednym wpisem na stronie
  const loose = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/[^a-z]/g, "");
  for (const o of offers) {
    const s = o.service && c.services[o.service];
    if (s) {
      o.price = s.price;
      o.time = s.time;
      o.hidden = c.hiddenServices.includes(o.service!);
    } else {
      const k = loose(o.name).slice(0, 5);
      const cs = c.customServices.find((x) => loose(x.name).startsWith(k));
      o.custom = cs?.id;
      o.price = cs?.price ?? o.price;
      o.time = cs?.time ?? o.time;
    }
  }
}

/** Własne usługi z CMS, które nie mają osobnej podstrony /uslugi (karty i stopka linkują do formularza) */
export const extraServices = () => services.filter((s) => s.custom && !offers.some((o) => o.custom === s.id));
