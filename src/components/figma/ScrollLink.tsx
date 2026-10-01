"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = Omit<React.ComponentProps<"a">, "href"> & { to: string };

// Na stronie głównej płynne przewijanie (Lenis łapie kotwice), na podstronach nawigacja do sekcji.
export default function ScrollLink({ to, children, ...rest }: Props) {
  const pathname = usePathname();
  const href = `/#${to}`;
  if (pathname === "/") {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
