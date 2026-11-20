import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, LOCALE_COOKIE, LOCALE_HEADER, negotiateLocale } from "@/lib/i18n/negotiate";

/**
 * Serves every page from app/[lang] without showing the language in the URL:
 * /profile is rewritten to /es/profile (or /en/profile) from the saved choice
 * or the browser's Accept-Language.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefixed = LOCALES.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

  const locale =
    prefixed ??
    negotiateLocale({
      cookie: request.cookies.get(LOCALE_COOKIE)?.value,
      acceptLanguage: request.headers.get("accept-language"),
    });

  // Server Actions can't read next/root-params, so they get the locale as a header.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);

  if (prefixed) return NextResponse.next({ request: { headers } });

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Everything but the auth API, Next internals and files with an extension (favicon, images).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
