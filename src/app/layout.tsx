import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import { loadContent } from "@/lib/content-server";
import { setting } from "@/lib/settings";
import "./globals.css";

// Satoshi (Fontshare, ITF Free Font License — patrz src/fonts/Satoshi-LICENSE.txt)
const satoshi = localFont({ src: "../fonts/Satoshi-Variable.woff2", variable: "--font-satoshi", weight: "300 900", display: "swap" });

const keywords = [
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
];

// tytuł i opis edytowalne w Panel → Treści strony; weryfikacja Google w Panel → Ustawienia
export async function generateMetadata(): Promise<Metadata> {
  const [{ seo }, google] = await Promise.all([loadContent(), setting("google_verification")]);
  const { title, description } = seo;
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s | ${site.domain}` },
    description,
    applicationName: site.domain,
    keywords,
    creator: site.legal.owner,
    authors: [{ name: site.legal.owner, url: site.url }],
    publisher: site.domain,
    category: "design",
    alternates: { canonical: "/" },
    openGraph: { title, description, url: site.url, siteName: site.domain, locale: "pl_PL", type: "website" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    formatDetection: { telephone: false },
    verification: google ? { google } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
  viewportFit: "cover", // treść pod notchem/paskiem statusu (iOS) — pasek nawigacji dopełnia to tłem
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [content, gaId] = await Promise.all([loadContent(), setting("ga_id")]);
  return (
    <html lang="pl" className={satoshi.variable}>
      <body>
        <Providers content={content} gaId={gaId}>
          {children}
        </Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
