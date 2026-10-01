import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import PanelShell from "@/components/panel/PanelShell";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const user = await requireUser();
  return (
    <PanelShell user={{ name: user.name, email: user.email, role: user.role }}>
      {children}
    </PanelShell>
  );
}
