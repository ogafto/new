import type { Metadata } from "next";
import Capture from "./Capture";

// Pomocnicza strona do renderowania klatek GIF (npm run logo:gif). Nie jest indeksowana.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  return <Capture variant={variant} />;
}
