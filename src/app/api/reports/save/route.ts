import { NextResponse } from "next/server";

import { saveReport } from "@/lib/analysis/saved-reports";
import type { AuditResult } from "@/lib/analysis/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { report?: AuditResult };

    if (!body.report) {
      return NextResponse.json({ error: "Missing report." }, { status: 400 });
    }

    const saved = await saveReport(body.report);
    return NextResponse.json({ report: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
