import { NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE,
  USER_ID_COOKIE,
  USER_NAME_COOKIE,
  createAnonymousSessionId,
  type OwnerContext,
} from "@/lib/auth/session";
import { claimProjects } from "@/lib/analysis/projects";
import { claimSavedReports } from "@/lib/analysis/saved-reports";
import { getSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    if (!body.accessToken) {
      return NextResponse.json({ error: "Missing access token." }, { status: 400 });
    }

    const config = getSupabaseConfig();
    if (!config?.anonKey) {
      return NextResponse.json({ error: "Missing Supabase publishable key." }, { status: 400 });
    }

    const userResponse = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${body.accessToken}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      const message = await userResponse.text();
      return NextResponse.json({ error: `Could not resolve authenticated user: ${message.slice(0, 160)}` }, { status: 400 });
    }

    const user = (await userResponse.json()) as {
      id: string;
      user_metadata?: { user_name?: string; preferred_username?: string; full_name?: string; name?: string };
      email?: string;
    };

    const cookieHeader = request.headers.get("cookie") ?? "";
    const anonymousSessionId = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ANONYMOUS_SESSION_COOKIE}=`))
      ?.split("=", 2)[1];

    const guestOwner: OwnerContext = {
      ownerType: "anonymous",
      ownerId: anonymousSessionId || createAnonymousSessionId(),
      isAuthenticated: false,
      displayName: "Guest",
    };

    const userOwner: OwnerContext = {
      ownerType: "user",
      ownerId: user.id,
      isAuthenticated: true,
      displayName: user.user_metadata?.user_name ?? user.user_metadata?.preferred_username ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "GitHub user",
    };

    const [claimedReports, claimedProjects] = await Promise.all([claimSavedReports(guestOwner, userOwner), claimProjects(guestOwner, userOwner)]);

    const response = NextResponse.json({
      user: {
        id: userOwner.ownerId,
        displayName: userOwner.displayName,
      },
      claimed: {
        reports: claimedReports.claimed,
        projects: claimedProjects.claimed,
      },
    });

    response.cookies.set({
      name: USER_ID_COOKIE,
      value: userOwner.ownerId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set({
      name: USER_NAME_COOKIE,
      value: userOwner.displayName,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
