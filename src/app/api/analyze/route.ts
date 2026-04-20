import { NextResponse } from "next/server";

import { getAnalysisReport } from "@/lib/analysis/get-report";
import type { AnalysisMode, OutputTone } from "@/lib/analysis/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; mode?: AnalysisMode; outputTone?: OutputTone };

    const result = await getAnalysisReport({
      url: body.url ?? "",
      mode: body.mode,
      outputTone: body.outputTone,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
