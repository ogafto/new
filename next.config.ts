import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // stare adresy sekcji „Realizacje” → „Portfolio” (zachowuje pozycje w Google)
  async redirects() {
    return [
      { source: "/realizacje", destination: "/portfolio", permanent: true },
      { source: "/realizacje/:slug", destination: "/portfolio/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
