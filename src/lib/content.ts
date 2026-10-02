import { services, site, steps, type ServiceId } from "./site";
import { offers } from "./offer";

/*
 * Treści strony edytowane w panelu (Panel → Treści strony).
 * Domyślne wartości pochodzą z site.ts; zapisane w panelu nadpisują je w całej aplikacji.
 * applyContent() podmienia wartości w obiektach `site` / `services` / `offers`, więc komponenty
 * czytające te obiekty nie wymagają zmian. Plik jest wspólny dla serwera i przeglądarki.
 */

export type ServiceContent = { price: number; time: string; description: string };
export type StepContent = { title: string; lead: string; text: string; points: string[] };
export type Announcement = { enabled: boolean; text: string; label: string; link: string };
export type Availability = { open: boolean; text: string };

export type Content = {
  email: string;
  phone: string;
  socials: { label: string; href: string }[];
  legal: { owner: string; form: string; street: string; city: string; updated: string };
  hero: { line1: string; line2: string; accent: string; text: string };
  services: Record<ServiceId, ServiceContent>;
  seo: { title: string; description: string };
  announcement: Announcement;
  availability: Availability;
  steps: StepContent[];
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

const baseServices = Object.fromEntries(services.map((s) => [s.id, { price: s.price, time: s.time, description: s.description }])) as Record<ServiceId, ServiceContent>;

export const defaultContent = (): Content => ({
  ...structuredClone(base),
  hero: { ...DEFAULT_HERO },
  services: structuredClone(baseServices),
  seo: { ...DEFAULT_SEO },
  announcement: { ...DEFAULT_ANNOUNCEMENT },
  availability: { ...DEFAULT_AVAILABILITY },
  steps: structuredClone(baseSteps),
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
    seo: pick(d.seo, saved.seo),
    announcement: { ...pick(d.announcement, saved.announcement), enabled: typeof saved.announcement?.enabled === "boolean" ? saved.announcement.enabled : d.announcement.enabled },
    availability: { ...pick(d.availability, saved.availability), open: typeof saved.availability?.open === "boolean" ? saved.availability.open : d.availability.open },
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
  for (const s of services) Object.assign(s, c.services[s.id]);
  c.steps.forEach((st, i) => steps[i] && Object.assign(steps[i], { ...st, points: [...st.points] }));
  for (const o of offers) {
    const s = o.service && c.services[o.service];
    if (s) {
      o.price = s.price;
      o.time = s.time;
    }
  }
}
