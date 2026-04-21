import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("returnTo") || "/";
  const redirectUrl = new URL(`/auth/callback?next=${encodeURIComponent(next)}`, url.origin);

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (code) {
    redirectUrl.searchParams.set("code", code);
  }
  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  return NextResponse.redirect(redirectUrl);
}
