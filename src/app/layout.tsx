import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import "./globals.css";

// Satoshi (Fontshare, ITF Free Font License — patrz src/fonts/Satoshi-LICENSE.txt)
const satoshi = localFont({ src: "../fonts/Satoshi-Variable.woff2", variable: "--font-satoshi", weight: "300 900", display: "swap" });

const title = `Web designer & web developer — strony internetowe i sklepy | ${site.domain}`;
const description =
  "Web designer & web developer. Projektuję i koduję strony internetowe, sklepy i identyfikacje wizualne dla firm z całej Polski. Strona od 200 zł.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s — ${site.domain}` },
  description,
  applicationName: site.domain,
  keywords: [
    "web designer",
    "web developer",
    "projektant stron internetowych",
    "projektowanie stron internetowych",
    "tworzenie stron www",
    "strona internetowa dla firmy",
    "sklep internetowy",
    "identyfikacja wizualna",
    "projekt logo",
    "projekt UI/UX",
    "grafik",
    "designer",
    "landing page",
    "strona w Next.js",
    "animacja logo",
    "strony internetowe Warszawa",
    "strony internetowe Kraków",
    "strony internetowe Wrocław",
    "strony internetowe Poznań",
    "strony internetowe Gdańsk",
  ],
  creator: site.legal.owner,
  authors: [{ name: site.legal.owner, url: site.url }],
  publisher: site.domain,
  category: "design",
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: site.url,
    siteName: site.domain,
    locale: "pl_PL",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false },
  // Google Search Console → Ustawienia → Weryfikacja własności → tag HTML (sama wartość content)
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
  viewportFit: "cover", // treść pod notchem/paskiem statusu (iOS) — pasek nawigacji dopełnia to tłem
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={satoshi.variable}>
      <body>
        <Providers>{children}</Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
