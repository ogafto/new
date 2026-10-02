import type { Metadata } from "next";
import { loadContent } from "@/lib/content-server";
import { site } from "@/lib/site";
import ComingSoon from "@/components/soon/ComingSoon";

export const metadata: Metadata = { title: "Coś nowego nadchodzi", robots: { index: false, follow: false } };

// Ekran trybu zapowiedzi — proxy pokazuje go zamiast publicznych stron, gdy tryb jest włączony w panelu
export default async function SoonPage() {
  const c = await loadContent();
  const discord = c.soon.link || site.socials.find((s) => s.label === "Discord")?.href || "https://discord.com";
  return <ComingSoon soon={{ ...c.soon, link: discord }} email={site.email} />;
}
