import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.domain} — strony internetowe premium`,
    short_name: site.brand,
    description: "Strony internetowe, sklepy i identyfikacje wizualne, które wyglądają drogo i sprzedają.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070a",
    theme_color: "#07070a",
    lang: "pl",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/afto-icon-dark.png", type: "image/png", sizes: "1024x1024" },
    ],
  };
}
