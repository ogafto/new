import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "latin-ext"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: `${site.brand} — Strony internetowe od 200 zł | Projekt w Figmie + Next.js`,
  description:
    "Nowoczesne, szybkie i responsywne strony internetowe z efektem wow. Projekt w Figmie, kod w Next.js, animacje 3D. Ceny od 200 zł.",
  keywords: ["strona internetowa", "tania strona internetowa", "strona od 200 zł", "web design", "Next.js", "Figma", "landing page"],
  openGraph: {
    title: `${site.brand} — ${site.tagline}`,
    description: "Strony internetowe, które sprzedają. Od 200 zł.",
    locale: "pl_PL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${inter.variable} ${interTight.variable} ${instrument.variable} ${jetbrains.variable} antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
