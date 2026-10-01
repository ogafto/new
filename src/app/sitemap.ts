import type { MetadataRoute } from "next";
import { projects, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "monthly", priority: 1, images: [`${site.url}/opengraph-image`] },
    { url: `${site.url}/portfolio`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((p) => ({
      url: `${site.url}/portfolio/${p.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: [`${site.url}${p.image}`, ...(p.gallery ?? []).map((g) => `${site.url}${g}`)],
    })),
    { url: `${site.url}/regulamin`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/polityka-prywatnosci`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
