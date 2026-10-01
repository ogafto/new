import type { Metadata } from "next";
import AuthShell from "@/components/account/AuthShell";

export const metadata: Metadata = { title: "Konto", robots: { index: false } };

export default function AccountLayout({ children }: LayoutProps<"/konto">) {
  return <AuthShell>{children}</AuthShell>;
}
