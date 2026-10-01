import type { Metadata, Viewport } from "next";
import { Archivo, Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
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
    default: `${site.domain} — grafika komputerowa & web design`,
    template: `%s — ${site.domain}`,
  },
  description:
    "Projektuję i koduję strony internetowe, identyfikacje wizualne i grafikę. Strony, których nie da się przewinąć obojętnie — projekt w Figmie, kod w Next.js.",
  keywords: ["web design", "projektowanie stron", "strona internetowa", "grafik komputerowy", "identyfikacja wizualna", "projekt UI/UX", "Figma", "Next.js"],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.domain} — strony, których nie da się przewinąć obojętnie`,
    description: "Grafika komputerowa & web design. Projekt w Figmie, kod w Next.js.",
    url: site.url,
    siteName: site.domain,
    locale: "pl_PL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e6e6e3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${archivo.variable} ${inter.variable} ${jetbrains.variable} ${instrument.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
