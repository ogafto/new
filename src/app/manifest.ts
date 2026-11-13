import type { MetadataRoute } from "next";
import { copy, site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.domain} | strony internetowe premium`,
    short_name: site.brand,
    description: copy.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#07070a",
    theme_color: "#07070a",
    lang: "pl",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
    ],
  };
}
