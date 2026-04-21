import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ANONYMOUS_SESSION_COOKIE, createAnonymousSessionId } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(ANONYMOUS_SESSION_COOKIE)?.value) {
    response.cookies.set({
      name: ANONYMOUS_SESSION_COOKIE,
      value: createAnonymousSessionId(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
