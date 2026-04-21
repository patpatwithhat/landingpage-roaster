import { NextResponse } from "next/server";

import { USER_ID_COOKIE, USER_NAME_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: USER_ID_COOKIE, value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: USER_NAME_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
