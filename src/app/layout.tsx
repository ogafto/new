import type { Metadata, Viewport } from "next";
import { Funnel_Display, Funnel_Sans, Instrument_Serif } from "next/font/google";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import "./globals.css";

const funnelDisplay = Funnel_Display({ variable: "--font-funnel-display", subsets: ["latin", "latin-ext"] });
const funnelSans = Funnel_Sans({ variable: "--font-funnel-sans", subsets: ["latin", "latin-ext"] });
// używany tylko w makietach realizacji
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.domain} — strony, które wyglądają drogo i sprzedają`,
    template: `%s — ${site.domain}`,
  },
  description:
    "Web designer & developer. Projektuję i koduję strony internetowe, sklepy, identyfikacje wizualne i projekty UI/UX dla firm, które chcą wyróżnić się od pierwszego spojrzenia.",
  keywords: ["strona internetowa", "sklep internetowy", "identyfikacja wizualna", "projekt UI/UX", "web designer", "web developer", "projektowanie stron"],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.domain} — strony, które wyglądają drogo i sprzedają`,
    description: "Strony internetowe, sklepy i identyfikacje wizualne premium.",
    url: site.url,
    siteName: site.domain,
    locale: "pl_PL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${funnelDisplay.variable} ${funnelSans.variable} ${instrument.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
