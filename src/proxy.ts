import { NextResponse, type NextRequest } from "next/server";

// Szybkie sprawdzenie: bez ciasteczka sesji nie ma wstępu do panelu (pełna weryfikacja w layoutach)
export function proxy(request: NextRequest) {
  if (!request.cookies.has("afto_session")) {
    const url = new URL("/konto/logowanie", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/panel/:path*"],
};
