import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // zdjęcia wgrane do Vercel Blob (gdy ustawiony BLOB_READ_WRITE_TOKEN)
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    qualities: [75, 90], // 90: podgląd prac na pełnym ekranie
  },
  experimental: {
    serverActions: { bodySizeLimit: "100mb" }, // wgrywanie zdjęć do portfolio (w przeglądarce zmniejszane przed wysłaniem)
    proxyClientMaxBodySize: "100mb",
    // panel: powrót na odwiedzoną podstronę bez czekania na serwer (akcje i tak odświeżają dane)
    staleTimes: { dynamic: 30, static: 300 },
  },
  // stare adresy (usługi, regulamin, panel klienta, „Realizacje”) → portfolio; zachowuje pozycje w Google
  async redirects() {
    return [
      { source: "/realizacje", destination: "/#portfolio", permanent: true },
      { source: "/realizacje/:slug", destination: "/portfolio/:slug", permanent: true },
      { source: "/portfolio", destination: "/#portfolio", permanent: true },
      { source: "/uslugi", destination: "/#portfolio", permanent: true },
      { source: "/uslugi/:slug*", destination: "/#portfolio", permanent: true },
      { source: "/regulamin", destination: "/", permanent: true },
      { source: "/wkrotce", destination: "/", permanent: true },
      { source: "/platnosc", destination: "/", permanent: true },
      { source: "/konto/rejestracja", destination: "/", permanent: true },
      { source: "/konto/weryfikacja", destination: "/konto/logowanie", permanent: false },
      { source: "/brand", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
