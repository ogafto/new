import type { MetadataRoute } from "next";
import { projects, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/realizacje`, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((p) => ({ url: `${site.url}/realizacje/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
    { url: `${site.url}/regulamin`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/polityka-prywatnosci`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
