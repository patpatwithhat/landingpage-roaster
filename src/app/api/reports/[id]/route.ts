import { NextResponse } from "next/server";

import { getSavedReportById } from "@/lib/analysis/saved-reports";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await getSavedReportById(id);

    if (!report) {
      return NextResponse.json({ error: "Saved report not found." }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
