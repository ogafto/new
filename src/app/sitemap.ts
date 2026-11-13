import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getPortfolio } from "@/lib/projects";
import { isVideo } from "@/lib/media";

// zawsze świeża: kategorie i prace dodane albo usunięte w panelu od razu trafiają do mapy strony
export const dynamic = "force-dynamic";

const abs = (u: string) => (u.startsWith("http") ? u : `${site.url}${u}`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const cats = await getPortfolio();
  return [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1, images: [`${site.url}/opengraph-image.jpg`] },
    ...cats.map((c) => ({
      url: `${site.url}/portfolio/${c.slug}`,
      lastModified: new Date(Math.max(...c.works.map((w) => w.createdAt), c.createdAt)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: c.works.filter((w) => !isVideo(w.image)).slice(0, 50).map((w) => abs(w.image)),
    })),
    { url: `${site.url}/polityka-prywatnosci`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
