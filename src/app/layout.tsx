import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "latin-ext"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.domain} — strony, sklepy i identyfikacje, które sprzedają wyglądem`,
    template: `%s — ${site.domain}`,
  },
  description:
    "Klienci kupują oczami. Projektuję i koduję strony internetowe, sklepy, identyfikacje wizualne i projekty UI/UX, które sprzedają od pierwszego spojrzenia.",
  keywords: ["strona internetowa", "sklep internetowy", "identyfikacja wizualna", "projekt UI/UX", "web design", "grafik komputerowy", "projektowanie stron"],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.domain} — Klienci kupują oczami.`,
    description: "Strony, sklepy i identyfikacje wizualne, które sprzedają wyglądem.",
    url: site.url,
    siteName: site.domain,
    locale: "pl_PL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${archivo.variable} ${jetbrains.variable} ${instrument.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
