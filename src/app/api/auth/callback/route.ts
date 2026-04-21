import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const redirectUrl = new URL(returnTo, url.origin);

  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (error) {
    redirectUrl.searchParams.set("auth", "github_failed");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("auth", "github_callback_pending");
  return NextResponse.redirect(redirectUrl);
}
