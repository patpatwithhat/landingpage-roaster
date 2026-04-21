import { NextResponse } from "next/server";

import { attachReportToProject, resolveProject } from "@/lib/analysis/projects";
import { saveReport } from "@/lib/analysis/saved-reports";
import type { AuditResult } from "@/lib/analysis/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { report?: AuditResult; projectId?: string; projectName?: string };

    if (!body.report) {
      return NextResponse.json({ error: "Missing report." }, { status: 400 });
    }

    const project = await resolveProject({ projectId: body.projectId, projectName: body.projectName });
    const saved = await saveReport(body.report, {
      projectId: project?.id,
      projectName: project?.name,
    });

    if (project) {
      await attachReportToProject({
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
