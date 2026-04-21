import { NextResponse } from "next/server";

import { getOwnerContext } from "@/lib/auth/session";
import { attachReportToProject, resolveProject } from "@/lib/analysis/projects";
import { saveReport } from "@/lib/analysis/saved-reports";
import type { AuditResult } from "@/lib/analysis/schema";

export async function POST(request: Request) {
  try {
    const owner = await getOwnerContext();
    const body = (await request.json()) as { report?: AuditResult; projectId?: string; projectName?: string };

    if (!body.report) {
      return NextResponse.json({ error: "Missing report." }, { status: 400 });
    }

    const project = await resolveProject(owner, { projectId: body.projectId, projectName: body.projectName });
    const saved = await saveReport(owner, body.report, {
      projectId: project?.id,
      projectName: project?.name,
    });

    if (project) {
      await attachReportToProject(owner, {
        projectId: project.id,
        reportId: saved.id,
        analyzedUrl: saved.analyzedUrl,
        reportedAt: saved.updatedAt,
      });
    }

    return NextResponse.json({ report: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
