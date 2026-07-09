import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = process.env.COOKIE_NAME ?? "pgcms_token";

// This only gates the UX (redirect to /admin/login when no session cookie is present).
// The Express API independently verifies the JWT and enforces roles on every request -
// that's the real security boundary, not this proxy.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME);
  if (!token) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
