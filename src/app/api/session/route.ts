import { NextResponse } from "next/server";

import { getOwnerContext } from "@/lib/auth/session";
import { isGitHubAuthAvailable } from "@/lib/supabase/server";

export async function GET() {
  const owner = await getOwnerContext();
  const githubAuth = await isGitHubAuthAvailable();

  return NextResponse.json(
    {
      session: {
        ownerType: owner.ownerType,
        isAuthenticated: owner.isAuthenticated,
        displayName: owner.displayName,
      },
      auth: {
        github: githubAuth,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
