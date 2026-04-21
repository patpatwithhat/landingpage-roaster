import { NextResponse } from "next/server";

import { getOwnerContext } from "@/lib/auth/session";
import { listProjects, resolveProject } from "@/lib/analysis/projects";

export async function GET() {
  try {
    const owner = await getOwnerContext();
    const projects = await listProjects(owner);
    return NextResponse.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await getOwnerContext();
    const body = (await request.json()) as { name?: string };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Missing project name." }, { status: 400 });
    }

    const project = await resolveProject(owner, { projectName: body.name });
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
