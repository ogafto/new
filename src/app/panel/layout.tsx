import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import PanelShell from "@/components/panel/PanelShell";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const user = await requireAdmin();
  return <PanelShell user={{ name: user.name, email: user.email }}>{children}</PanelShell>;
}
