import { NextResponse } from "next/server";

import { getOwnerContext } from "@/lib/auth/session";
import { listSavedReports } from "@/lib/analysis/saved-reports";

export async function GET(request: Request) {
  try {
    const owner = await getOwnerContext();
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const domain = searchParams.get("domain") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;
    const limit = limitParam ? Number(limitParam) : undefined;

    const reports = await listSavedReports(owner, {
      domain,
      projectId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
