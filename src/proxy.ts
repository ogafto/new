import { NextResponse, type NextRequest } from "next/server";

/*
 * Panel admina i logowanie — przekierowania, zanim cokolwiek się wyrenderuje:
 *  - bez sesji /panel/* prowadzi do logowania,
 *  - zalogowany admin (podpowiedź roli afto_role) z logowania trafia prosto do panelu.
 * ?sesja=0 (wygasła sesja) wyłącza skrót, żeby nie było pętli.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const session = request.cookies.get("afto_session")?.value;
  const admin = request.cookies.get("afto_role")?.value === "admin";

  if (pathname.startsWith("/panel")) {
    if (session) return;
    const url = new URL("/konto/logowanie", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (/^\/konto(\/logowanie)?$/.test(pathname) && session && admin && !searchParams.has("sesja")) return NextResponse.redirect(new URL("/panel/admin", request.url));
}

export const config = {
  matcher: ["/panel/:path*", "/konto/:path*", "/konto"],
};
