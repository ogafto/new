import { serviceName, site, type Project } from "./site";
import { cities, offers } from "./offer";

const id = (frag: string) => `${site.url}/#${frag}`;
// do „sameAs” tylko konkretne profile (nie same strony główne serwisów)
const profiles = () => site.socials.map((s) => s.href).filter((h) => new URL(h).pathname.replace(/\/$/, "").length > 1);

// Firma / usługodawca + strona — na stronie głównej
export function homeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": id("business"),
        name: site.domain,
        alternateName: site.brand,
        description: "Web designer & web developer — projektowanie stron internetowych, sklepów internetowych, identyfikacji wizualnych, projektów UI/UX i animacji dla firm z całej Polski.",
        url: site.url,
        logo: `${site.url}/brand/afto-icon-dark.png`,
        image: `${site.url}/opengraph-image`,
        email: site.email,
        telephone: site.phone.replace(/\s/g, ""),
        priceRange: "od 200 zł",
        currenciesAccepted: "PLN",
        areaServed: [{ "@type": "Country", name: "Polska" }, ...cities.map((c) => ({ "@type": "City", name: c }))],
        availableLanguage: "pl",
        sameAs: profiles(),
        founder: { "@id": id("person") },
        address: { "@type": "PostalAddress", addressLocality: "Wrocław", addressRegion: "dolnośląskie", addressCountry: "PL" },
        knowsAbout: ["projektowanie stron internetowych", "sklepy internetowe", "identyfikacja wizualna", "UI/UX", "Next.js", "SEO"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Usługi",
          itemListElement: offers.map((o) => ({
            "@type": "Offer",
            url: `${site.url}/uslugi/${o.slug}`,
            itemOffered: { "@type": "Service", name: o.h1, description: o.description, url: `${site.url}/uslugi/${o.slug}` },
            ...(o.price ? { priceSpecification: { "@type": "PriceSpecification", minPrice: o.price, priceCurrency: "PLN" } } : {}),
          })),
        },
      },
      {
        "@type": "Person",
        "@id": id("person"),
        name: site.legal.owner,
        jobTitle: "Web designer & web developer",
        url: site.url,
        email: site.email,
        worksFor: { "@id": id("business") },
        address: { "@type": "PostalAddress", addressLocality: "Wrocław", addressCountry: "PL" },
        knowsAbout: ["Web design", "UI/UX", "Identyfikacja wizualna", "Next.js", "React"],
      },
      {
        "@type": "WebSite",
        "@id": id("website"),
        url: site.url,
        name: site.domain,
        inLanguage: "pl-PL",
        publisher: { "@id": id("business") },
      },
    ],
  };
}

export function portfolioSchema(projects: Project[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Strona główna", item: site.url },
        { "@type": "ListItem", position: 2, name: "Portfolio", item: `${site.url}/portfolio` },
      ],
    },
    name: "Portfolio",
    url: `${site.url}/portfolio`,
    inLanguage: "pl-PL",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${site.url}/portfolio/${p.slug}`, name: p.name })),
    },
  };
}

export function projectSchema(p: Project) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: p.name,
        url: `${site.url}/portfolio/${p.slug}`,
        image: `${site.url}${p.image}`,
        description: p.description,
        genre: serviceName(p.category),
        dateCreated: p.year,
        keywords: p.scope.join(", "),
        inLanguage: "pl-PL",
        creator: { "@type": "Organization", name: site.domain, url: site.url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: site.url },
          { "@type": "ListItem", position: 2, name: "Portfolio", item: `${site.url}/portfolio` },
          { "@type": "ListItem", position: 3, name: p.name, item: `${site.url}/portfolio/${p.slug}` },
        ],
      },
    ],
  };
}
