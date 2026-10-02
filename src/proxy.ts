import { NextResponse, type NextRequest } from "next/server";

/*
 * Przekierowania zanim cokolwiek się wyrenderuje (bez „pustej karty” logowania czy pustego panelu):
 * - bez ciasteczka sesji → /panel/* prowadzi do logowania,
 * - zalogowany (podpowiedź roli w ciasteczku afto_role) → /konto, logowanie i rejestracja prowadzą prosto do panelu,
 * - admin wchodzący na /panel → od razu /panel/admin.
 * Pełna weryfikacja sesji i tak jest w layoutach; ?sesja=0 (wygasła sesja) wyłącza skrót, żeby nie było pętli.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const session = request.cookies.has("afto_session");
  const role = request.cookies.get("afto_role")?.value;
  const home = role === "admin" ? "/panel/admin" : "/panel";
  const go = (to: string) => NextResponse.redirect(new URL(to, request.url));

  if (pathname.startsWith("/panel")) {
    if (!session) {
      const url = new URL("/konto/logowanie", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname === "/panel" && role === "admin") return go("/panel/admin");
    return;
  }

  if (session && role && !searchParams.has("sesja")) return go(home);
}

export const config = {
  matcher: ["/panel/:path*", "/konto", "/konto/logowanie", "/konto/rejestracja"],
};
