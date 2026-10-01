import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getProjects } from "@/lib/projects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const projects = await getProjects();
  return [
    { url: site.url, lastModified: now, changeFrequency: "monthly", priority: 1, images: [`${site.url}/opengraph-image`] },
    { url: `${site.url}/portfolio`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((p) => ({
      url: `${site.url}/portfolio/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: [p.image, ...(p.gallery ?? [])].map((g) => (g.startsWith("http") ? g : `${site.url}${g}`)),
    })),
    { url: `${site.url}/regulamin`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/polityka-prywatnosci`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
