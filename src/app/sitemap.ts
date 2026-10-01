import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/regulamin`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/polityka-prywatnosci`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
