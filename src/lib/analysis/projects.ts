import { randomUUID } from "node:crypto";

const PROJECTS_BUCKET = "landingpage-roaster-projects";
const PROJECT_INDEX_PATH = "index/projects.json";
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
};

export type ProjectRecord = ProjectSummary & {
  reportIds: string[];
  urls: string[];
};

function getSupabaseConfig() {
  const url = process.env.LPR_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secret = process.env.LPR_SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return null;
  }

  return { url, secret };
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) return null;

  return fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.secret,
      Authorization: `Bearer ${config.secret}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function ensureBucket() {
  if (bucketEnsured) return;

  const listResponse = await supabaseRequest("/storage/v1/bucket");
  if (!listResponse) return;

  if (!listResponse.ok) {
    const text = await listResponse.text();
    throw new Error(`Could not inspect projects bucket (${listResponse.status}): ${text.slice(0, 200)}`);
  }

  const buckets = (await listResponse.json()) as Array<{ id: string }>;
  if (!buckets.some((bucket) => bucket.id === PROJECTS_BUCKET)) {
    const createResponse = await supabaseRequest("/storage/v1/bucket", {
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
  const response = await supabaseRequest(`/storage/v1/object/${PROJECTS_BUCKET}/${path}`);
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
  const response = await supabaseRequest(`/storage/v1/object/${PROJECTS_BUCKET}/${path}`, {
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

async function loadIndex() {
  await ensureBucket();
  return (await readObject<ProjectSummary[]>(PROJECT_INDEX_PATH)) ?? [];
}

async function saveIndex(index: ProjectSummary[]) {
  await ensureBucket();
  await writeObject(PROJECT_INDEX_PATH, index);
}

function sortNewest(items: ProjectSummary[]) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function listProjects() {
  return sortNewest(await loadIndex());
}

export async function getProjectById(id: string) {
  await ensureBucket();
  return readObject<ProjectRecord>(`projects/${id}.json`);
}

export async function resolveProject(input: { projectId?: string; projectName?: string | null }) {
  if (!getSupabaseConfig()) {
    throw new Error("Missing Supabase config for projects.");
  }

  const explicitId = input.projectId?.trim();
  if (explicitId) {
    const existing = await getProjectById(explicitId);
    if (!existing) {
      throw new Error("Project not found.");
    }
    return existing;
  }

  const name = input.projectName?.trim();
  if (!name) return null;

  const index = await loadIndex();
  const slugBase = slugify(name);
  const existingSummary = index.find((project) => project.slug === slugBase || project.name.toLowerCase() === name.toLowerCase());
  if (existingSummary) {
    return getProjectById(existingSummary.id);
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
  };

  const record: ProjectRecord = {
    ...summary,
    reportIds: [],
    urls: [],
  };

  await writeObject(`projects/${record.id}.json`, record);
  await saveIndex(sortNewest([summary, ...index.filter((project) => project.id !== record.id)]));

  return record;
}

export async function attachReportToProject(input: {
  projectId: string;
  reportId: string;
  analyzedUrl: string;
  reportedAt: string;
}) {
  const project = await getProjectById(input.projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  const reportIds = project.reportIds.includes(input.reportId) ? project.reportIds : [input.reportId, ...project.reportIds];
  const urls = project.urls.includes(input.analyzedUrl) ? project.urls : [input.analyzedUrl, ...project.urls];
  const updated: ProjectRecord = {
    ...project,
    reportIds,
    urls,
    reportCount: reportIds.length,
    pageCount: urls.length,
    latestReportAt: input.reportedAt,
    updatedAt: input.reportedAt,
  };

  await writeObject(`projects/${updated.id}.json`, updated);

  const index = await loadIndex();
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
  };

  await saveIndex(sortNewest([summary, ...index.filter((projectItem) => projectItem.id !== updated.id)]));

  return updated;
}
