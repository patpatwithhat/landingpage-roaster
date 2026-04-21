import { NextResponse } from "next/server";

import { updateProjectPageState, type ProjectPageStatus } from "@/lib/analysis/projects";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { url?: string; status?: ProjectPageStatus };

    if (!body.url?.trim()) {
      return NextResponse.json({ error: "Missing page url." }, { status: 400 });
    }

    if (!body.status || !["none", "follow_up", "in_review", "resolved"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const project = await updateProjectPageState({
      projectId: id,
      url: body.url.trim(),
      status: body.status,
    });

    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
