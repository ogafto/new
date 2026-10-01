import { serviceName, services, site, type Project } from "./site";

const id = (frag: string) => `${site.url}/#${frag}`;

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
        description: "Projektowanie stron internetowych, sklepów internetowych, identyfikacji wizualnych i projektów UI/UX.",
        url: site.url,
        logo: `${site.url}/brand/afto-icon-dark.png`,
        image: `${site.url}/opengraph-image`,
        email: site.email,
        telephone: site.phone.replace(/\s/g, ""),
        priceRange: "od 200 zł",
        currenciesAccepted: "PLN",
        areaServed: { "@type": "Country", name: "Polska" },
        availableLanguage: "pl",
        sameAs: site.socials.map((s) => s.href),
        knowsAbout: ["projektowanie stron internetowych", "sklepy internetowe", "identyfikacja wizualna", "UI/UX", "Next.js", "SEO"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Usługi",
          itemListElement: services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name, description: s.description },
            priceSpecification: { "@type": "PriceSpecification", minPrice: s.price, priceCurrency: "PLN" },
          })),
        },
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
