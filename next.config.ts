import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // zdjęcia wgrane do Vercel Blob (gdy ustawiony BLOB_READ_WRITE_TOKEN)
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "16mb" }, // wgrywanie zdjęć w panelu
    proxyClientMaxBodySize: "16mb",
  },
  // stare adresy sekcji „Realizacje” → „Portfolio” (zachowuje pozycje w Google)
  async redirects() {
    return [
      { source: "/realizacje", destination: "/portfolio", permanent: true },
      { source: "/realizacje/:slug", destination: "/portfolio/:slug", permanent: true },
      { source: "/brand", destination: "/panel/admin/marka", permanent: false },
    ];
  },
};

export default nextConfig;
