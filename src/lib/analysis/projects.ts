import { randomUUID } from "node:crypto";

import { getScopedPath, type OwnerContext } from "@/lib/auth/session";
import { getSupabaseConfig, supabaseServiceRequest } from "@/lib/supabase/server";

const PROJECTS_BUCKET = "landingpage-roaster-projects";
let bucketEnsured = false;

export type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  reportCount: number;
  pageCount: number;
  latestReportAt?: string;
  ownerType: OwnerContext["ownerType"];
};

export type ProjectPageStatus = "none" | "follow_up" | "in_review" | "resolved";

export type ProjectPageState = {
  url: string;
  status: ProjectPageStatus;
  updatedAt: string;
};

export type ProjectActivityEvent = {
  id: string;
  type: "report_saved" | "page_status_changed";
  url: string;
  createdAt: string;
  detail: string;
};

export type ProjectRecord = ProjectSummary & {
  reportIds: string[];
  urls: string[];
  pageStates?: Record<string, ProjectPageState>;
  activity?: ProjectActivityEvent[];
};

async function ensureBucket() {
  if (bucketEnsured) return;

  const listResponse = await supabaseServiceRequest("/storage/v1/bucket");
  if (!listResponse) return;

  if (!listResponse.ok) {
    const text = await listResponse.text();
    throw new Error(`Could not inspect projects bucket (${listResponse.status}): ${text.slice(0, 200)}`);
  }

  const buckets = (await listResponse.json()) as Array<{ id: string }>;
  if (!buckets.some((bucket) => bucket.id === PROJECTS_BUCKET)) {
    const createResponse = await supabaseServiceRequest("/storage/v1/bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: PROJECTS_BUCKET, name: PROJECTS_BUCKET, public: false }),
    });

    if (!createResponse?.ok && createResponse?.status !== 409) {
      const text = await createResponse?.text();
      throw new Error(`Could not create projects bucket (${createResponse?.status}): ${text?.slice(0, 200)}`);
    }
  }

  bucketEnsured = true;
}

async function readObject<T>(path: string) {
  const response = await supabaseServiceRequest(`/storage/v1/object/${PROJECTS_BUCKET}/${path}`);
  if (!response) return null;

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404 || text.includes("Object not found") || text.includes("not_found")) {
      return null;
    }
    throw new Error(`Could not load project object (${response.status}): ${text.slice(0, 200)}`);
  }

  return (await response.json()) as T;
}

async function writeObject(path: string, value: unknown) {
  const response = await supabaseServiceRequest(`/storage/v1/object/${PROJECTS_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    body: JSON.stringify(value),
  });

  if (!response) {
    throw new Error("Missing Supabase config for projects.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not write project object (${response.status}): ${text.slice(0, 200)}`);
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getProjectIndexPath(owner: OwnerContext) {
  return `${getScopedPath(owner, "projects")}/index/projects.json`;
}

function getProjectRecordPath(owner: OwnerContext, id: string) {
  return `${getScopedPath(owner, "projects")}/records/${id}.json`;
}

async function loadIndex(owner: OwnerContext) {
  await ensureBucket();
  return (await readObject<ProjectSummary[]>(getProjectIndexPath(owner))) ?? [];
}

async function saveIndex(owner: OwnerContext, index: ProjectSummary[]) {
  await ensureBucket();
  await writeObject(getProjectIndexPath(owner), index);
}

function sortNewest(items: ProjectSummary[]) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function listProjects(owner: OwnerContext) {
  return sortNewest(await loadIndex(owner));
}

export async function getProjectById(owner: OwnerContext, id: string) {
  await ensureBucket();
  return readObject<ProjectRecord>(getProjectRecordPath(owner, id));
}

export async function resolveProject(owner: OwnerContext, input: { projectId?: string; projectName?: string | null }) {
  if (!getSupabaseConfig()) {
    throw new Error("Missing Supabase config for projects.");
  }

  const explicitId = input.projectId?.trim();
  if (explicitId) {
    const existing = await getProjectById(owner, explicitId);
    if (!existing) {
      throw new Error("Project not found.");
    }
    return existing;
  }

  const name = input.projectName?.trim();
  if (!name) return null;

  const index = await loadIndex(owner);
  const slugBase = slugify(name);
  const existingSummary = index.find((project) => project.slug === slugBase || project.name.toLowerCase() === name.toLowerCase());
  if (existingSummary) {
    return getProjectById(owner, existingSummary.id);
  }

  const now = new Date().toISOString();
  const summary: ProjectSummary = {
    id: randomUUID(),
    name,
    slug: slugBase || `project-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    reportCount: 0,
    pageCount: 0,
    ownerType: owner.ownerType,
  };

  const record: ProjectRecord = {
    ...summary,
    reportIds: [],
    urls: [],
    pageStates: {},
    activity: [],
  };

  await writeObject(getProjectRecordPath(owner, record.id), record);
  await saveIndex(owner, sortNewest([summary, ...index.filter((project) => project.id !== record.id)]));

  return record;
}

export async function attachReportToProject(
  owner: OwnerContext,
  input: {
    projectId: string;
    reportId: string;
    analyzedUrl: string;
    reportedAt: string;
  },
) {
  const project = await getProjectById(owner, input.projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  const reportIds = project.reportIds.includes(input.reportId) ? project.reportIds : [input.reportId, ...project.reportIds];
  const urls = project.urls.includes(input.analyzedUrl) ? project.urls : [input.analyzedUrl, ...project.urls];
  const nextActivity: ProjectActivityEvent = {
    id: randomUUID(),
    type: "report_saved",
    url: input.analyzedUrl,
    createdAt: input.reportedAt,
    detail: "Saved a new report snapshot",
  };

  const updated: ProjectRecord = {
    ...project,
    reportIds,
    urls,
    reportCount: reportIds.length,
    pageCount: urls.length,
    latestReportAt: input.reportedAt,
    updatedAt: input.reportedAt,
    pageStates: project.pageStates ?? {},
    activity: [nextActivity, ...(project.activity ?? [])].slice(0, 40),
  };

  await writeObject(getProjectRecordPath(owner, updated.id), updated);

  const index = await loadIndex(owner);
  const summary: ProjectSummary = {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    reportCount: updated.reportCount,
    pageCount: updated.pageCount,
    latestReportAt: updated.latestReportAt,
    ownerType: updated.ownerType,
  };

  await saveIndex(owner, sortNewest([summary, ...index.filter((projectItem) => projectItem.id !== updated.id)]));

  return updated;
}

export async function updateProjectPageState(
  owner: OwnerContext,
  input: {
    projectId: string;
    url: string;
    status: ProjectPageStatus;
  },
) {
  const project = await getProjectById(owner, input.projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  const now = new Date().toISOString();
  const pageStates = { ...(project.pageStates ?? {}) };
  pageStates[input.url] = {
    url: input.url,
    status: input.status,
    updatedAt: now,
  };

  const nextActivity: ProjectActivityEvent = {
    id: randomUUID(),
    type: "page_status_changed",
    url: input.url,
    createdAt: now,
    detail:
      input.status === "none"
        ? "Cleared workflow state"
        : input.status === "follow_up"
          ? "Marked page for follow-up"
          : input.status === "in_review"
            ? "Moved page into review"
            : "Marked page as resolved",
  };

  const updated: ProjectRecord = {
    ...project,
    pageStates,
    updatedAt: now,
    activity: [nextActivity, ...(project.activity ?? [])].slice(0, 40),
  };

  await writeObject(getProjectRecordPath(owner, updated.id), updated);

  const index = await loadIndex(owner);
  const summary: ProjectSummary = {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    reportCount: updated.reportCount,
    pageCount: updated.pageCount,
    latestReportAt: updated.latestReportAt,
    ownerType: updated.ownerType,
  };

  await saveIndex(owner, sortNewest([summary, ...index.filter((projectItem) => projectItem.id !== updated.id)]));

  return updated;
}

export async function claimProjects(fromOwner: OwnerContext, toOwner: OwnerContext) {
  const sourceIndex = await loadIndex(fromOwner);
  if (!sourceIndex.length) {
    return { claimed: 0 };
  }

  const targetIndex = await loadIndex(toOwner);
  const claimedProjects: ProjectSummary[] = [];

  for (const summary of sourceIndex) {
    const sourceRecord = await readObject<ProjectRecord>(getProjectRecordPath(fromOwner, summary.id));
    if (!sourceRecord) continue;

    const nextSummary: ProjectSummary = {
      ...summary,
      ownerType: toOwner.ownerType,
    };
    const nextRecord: ProjectRecord = {
      ...sourceRecord,
      ownerType: toOwner.ownerType,
    };

    await writeObject(getProjectRecordPath(toOwner, summary.id), nextRecord);
    claimedProjects.push(nextSummary);
  }

  const merged = sortNewest([...claimedProjects, ...targetIndex.filter((item) => !claimedProjects.some((claimed) => claimed.id === item.id))]);
  await saveIndex(toOwner, merged);

  return { claimed: claimedProjects.length };
}
