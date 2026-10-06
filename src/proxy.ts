import { NextResponse, type NextRequest } from "next/server";
import { isAdminToken, soonEnabled } from "@/lib/gate";

/*
 * 1) Panel i konto — przekierowania zanim cokolwiek się wyrenderuje (bez „pustej karty”):
 *    - bez sesji → /panel/* prowadzi do logowania,
 *    - zalogowany (podpowiedź roli afto_role) → /konto, logowanie i rejestracja prowadzą prosto do panelu,
 *    - admin na /panel → /panel/admin. ?sesja=0 (wygasła sesja) wyłącza skrót, żeby nie było pętli.
 * 2) Tryb zapowiedzi: gdy włączony w panelu, wszyscy (także admin) widzą /wkrotce — adres w pasku zostaje ten sam.
 *    Pełną stronę widzi tylko admin z ważną sesją, który włączył „Podgląd pełnej strony” w panelu (ciasteczko afto_preview).
 */

// zawsze dostępne, także w trybie zapowiedzi
const OPEN = /^\/(konto|panel|api|media|platnosc|wkrotce|_next|brand|prace|favicon|icon|apple-icon|apple-touch-icon|manifest|robots|opengraph-image)/;

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const session = request.cookies.get("afto_session")?.value;
  const role = request.cookies.get("afto_role")?.value;
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

  if (/^\/konto(\/logowanie|\/rejestracja)?$/.test(pathname)) {
    if (session && role && !searchParams.has("sesja")) return go(role === "admin" ? "/panel/admin" : "/panel");
    return;
  }

  if (OPEN.test(pathname) || /\.[a-z0-9]+$/i.test(pathname)) return;
  if (!(await soonEnabled())) return;
  if (role === "admin" && request.cookies.get("afto_preview")?.value === "1" && (await isAdminToken(session))) {
    const res = NextResponse.next();
    res.headers.set("x-afto-preview", "1");
    return res;
  }
  const res = NextResponse.rewrite(new URL("/wkrotce", request.url));
  res.headers.set("x-robots-tag", "noindex");
  res.headers.set("cache-control", "no-store");
  return res;
}

export const config = {
  // wszystko poza plikami Next.js i statycznymi
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm|woff2?|txt|xml|json)$).*)"],
};
