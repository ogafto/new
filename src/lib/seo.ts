import { site } from "./site";
import type { CategoryFull } from "./projects";

const id = (frag: string) => `${site.url}/#${frag}`;
const abs = (u: string) => (u.startsWith("http") ? u : `${site.url}${u}`);
// do „sameAs” tylko konkretne profile (nie same strony główne serwisów)
const profiles = () => site.socials.map((s) => s.href).filter((h) => new URL(h).pathname.replace(/\/$/, "").length > 1);

const person = () => ({
  "@type": "Person",
  "@id": id("person"),
  name: site.legal.owner,
  givenName: site.legal.owner.split(" ")[0],
  familyName: site.legal.owner.split(" ").slice(1).join(" "),
  alternateName: [site.legal.owner.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l"), site.brand],
  jobTitle: site.role,
  url: site.url,
  sameAs: profiles(),
  address: { "@type": "PostalAddress", addressLocality: "Wrocław", addressCountry: "PL" },
  knowsAbout: ["Projektowanie logo", "Identyfikacja wizualna", "Grafika", "Web design", "UI/UX", "Next.js"],
});

// Strona główna: portfolio jednej osoby (ProfilePage) + lista kategorii
export function homeSchema(categories: CategoryFull[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(),
      { "@type": "WebSite", "@id": id("website"), url: site.url, name: site.domain, inLanguage: "pl-PL", publisher: { "@id": id("person") } },
      {
        "@type": "ProfilePage",
        "@id": id("profile"),
        url: site.url,
        name: `${site.domain}: portfolio`,
        inLanguage: "pl-PL",
        mainEntity: { "@id": id("person") },
        hasPart: categories.map((c) => ({ "@type": "CollectionPage", name: c.name, url: `${site.url}/portfolio/${c.slug}` })),
      },
    ],
  };
}

// Kategoria: galeria prac + okruszki
export function categorySchema(c: CategoryFull) {
  const url = `${site.url}/portfolio/${c.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: c.name,
        url,
        description: c.description || undefined,
        inLanguage: "pl-PL",
        author: { "@id": id("person") },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: c.works.map((w, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "CreativeWork",
              name: w.name,
              url: `${url}#praca-${w.slug}`,
              ...(w.image.match(/\.(mp4|webm|mov)$/i) ? { video: abs(w.image) } : { image: abs(w.image) }),
              description: w.description || undefined,
              dateCreated: w.year || undefined,
              creator: { "@id": id("person") },
            },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: site.url },
          { "@type": "ListItem", position: 2, name: "Portfolio", item: `${site.url}/#portfolio` },
          { "@type": "ListItem", position: 3, name: c.name, item: url },
        ],
      },
      person(),
    ],
  };
}
