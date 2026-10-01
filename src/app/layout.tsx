import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.domain} — Strony internetowe od 200 zł | Figma + Next.js`,
    template: `%s — ${site.domain}`,
  },
  description:
    "Premium strony internetowe, które sprzedają. Projekt w Figmie, kod w Next.js, animacje 3D i pełna responsywność. Ceny od 200 zł.",
  keywords: [
    "strona internetowa",
    "tania strona internetowa",
    "strona internetowa od 200 zł",
    "projektowanie stron",
    "web design",
    "landing page",
    "Next.js",
    "Figma",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.domain} — ${site.tagline}`,
    description: "Premium strony internetowe, które sprzedają. Od 200 zł.",
    url: site.url,
    siteName: site.domain,
    locale: "pl_PL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060607",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${geist.variable} ${geistMono.variable} ${instrument.variable} antialiased`}>
      <body>
        <Providers>{children}</Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
