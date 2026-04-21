import { NextResponse } from "next/server";

import { getSupabaseConfig, isGitHubAuthAvailable } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const availability = await isGitHubAuthAvailable();

  if (!availability.available) {
    const redirectUrl = new URL(returnTo, url.origin);
    redirectUrl.searchParams.set("auth", "github_unavailable");
    return NextResponse.redirect(redirectUrl);
  }

  const config = getSupabaseConfig();
  if (!config?.anonKey) {
    const redirectUrl = new URL(returnTo, url.origin);
    redirectUrl.searchParams.set("auth", "github_unavailable");
    return NextResponse.redirect(redirectUrl);
  }

  const authorizeUrl = new URL(`${config.url}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "github");
  authorizeUrl.searchParams.set("redirect_to", new URL(`/auth/callback?next=${encodeURIComponent(returnTo)}`, url.origin).toString());

  return NextResponse.redirect(authorizeUrl);
}
