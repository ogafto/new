import type { Metadata } from "next";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/brand/Logo";
import AuthVisual from "@/components/account/AuthVisual";

export const metadata: Metadata = { title: "Konto", robots: { index: false } };

export default function AccountLayout({ children }: LayoutProps<"/konto">) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.05fr_1fr]">
      <AuthVisual />
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3 lg:invisible" aria-label="afto.works — strona główna">
            <Mark className="size-8" />
            <Wordmark className="h-[19px] w-auto" />
          </Link>
          <Link href="/" className="group flex items-center gap-2 text-[14px] text-muted transition-colors hover:text-ink">
            <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">←</span>
            <span className="link-u">Strona główna</span>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-14">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
