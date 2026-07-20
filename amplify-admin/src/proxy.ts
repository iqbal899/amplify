import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

/**
 * Redirects signed-out visitors to the login screen.
 *
 * Next 16 renamed Middleware to Proxy; the behaviour is unchanged.
 *
 * This is a routing convenience, NOT the security boundary — it only checks
 * that a cookie exists, never that the token in it is valid, which is exactly
 * the "optimistic check" the Next docs describe. Every request is authorised by
 * the Worker, which verifies the signature against a key derived from the admin
 * password. A forged cookie gets past this and then 401s.
 */
export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has(SESSION_COOKIE);
  const onLoginPage = request.nextUrl.pathname === "/login";

  if (!signedIn && !onLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (signedIn && onLoginPage) {
    return NextResponse.redirect(new URL("/campaigns", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
