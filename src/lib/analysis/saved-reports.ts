import { randomUUID } from "node:crypto";

import type { AuditResult, OutputTone } from "./schema";

const SAVED_REPORTS_BUCKET = "landingpage-roaster-saved-reports";
const INDEX_PATH = "index/reports.json";
let bucketEnsured = false;

export type SavedReportSummary = {
  id: string;
  title: string;
  domain: string;
  analyzedUrl: string;
  projectId?: string;
  projectName?: string;
  outputTone: OutputTone;
  mode: AuditResult["mode"];
  analysisVersion: string;
  contentHash: string;
  reportSource: AuditResult["reportSource"];
  scores: AuditResult["structuredAnalysis"]["scores"];
  createdAt: string;
  updatedAt: string;
  compareHintPreviousId?: string;
};

export type SavedReportGroup = {
  domain: string;
  reports: SavedReportSummary[];
};

export type SavedReportRecord = SavedReportSummary & {
  report: AuditResult;
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
    throw new Error(`Could not inspect saved reports bucket (${listResponse.status}): ${text.slice(0, 200)}`);
  }

  const buckets = (await listResponse.json()) as Array<{ id: string }>;
  if (!buckets.some((bucket) => bucket.id === SAVED_REPORTS_BUCKET)) {
    const createResponse = await supabaseRequest("/storage/v1/bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: SAVED_REPORTS_BUCKET, name: SAVED_REPORTS_BUCKET, public: false }),
    });

    if (!createResponse?.ok && createResponse?.status !== 409) {
      const text = await createResponse?.text();
      throw new Error(`Could not create saved reports bucket (${createResponse?.status}): ${text?.slice(0, 200)}`);
    }
  }

  bucketEnsured = true;
}

async function readObject<T>(path: string) {
  const response = await supabaseRequest(`/storage/v1/object/${SAVED_REPORTS_BUCKET}/${path}`);
  if (!response) return null;

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404 || text.includes("Object not found") || text.includes("not_found")) {
      return null;
    }
    throw new Error(`Could not load saved report object (${response.status}): ${text.slice(0, 200)}`);
  }

  return (await response.json()) as T;
}

async function writeObject(path: string, value: unknown) {
  const response = await supabaseRequest(`/storage/v1/object/${SAVED_REPORTS_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    body: JSON.stringify(value),
  });

  if (!response) {
    throw new Error("Missing Supabase config for saved reports.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not write saved report object (${response.status}): ${text.slice(0, 200)}`);
  }
}

async function loadIndex() {
  await ensureBucket();
  return (await readObject<SavedReportSummary[]>(INDEX_PATH)) ?? [];
}

async function saveIndex(index: SavedReportSummary[]) {
  await ensureBucket();
  await writeObject(INDEX_PATH, index);
}

function buildSummary(report: AuditResult, existing?: SavedReportSummary): SavedReportSummary {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? randomUUID(),
    title: report.domain,
    domain: report.domain,
    analyzedUrl: report.analyzedUrl,
    projectId: existing?.projectId,
    projectName: existing?.projectName,
    outputTone: report.outputTone,
    mode: report.mode,
    analysisVersion: report.analysisVersion,
    contentHash: report.contentHash,
    reportSource: report.reportSource,
    scores: report.structuredAnalysis.scores,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function sortNewestFirst(items: SavedReportSummary[]) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function withCompareHints(items: SavedReportSummary[]) {
  return items.map((item) => {
    const previous = items.find(
      (candidate) =>
        candidate.id !== item.id &&
        candidate.domain === item.domain &&
        candidate.analyzedUrl === item.analyzedUrl &&
        Date.parse(candidate.updatedAt) < Date.parse(item.updatedAt),
    );

    return {
      ...item,
      compareHintPreviousId: previous?.id,
    };
  });
}

export async function saveReport(report: AuditResult, input?: { projectId?: string; projectName?: string }) {
  if (!getSupabaseConfig()) {
    throw new Error("Missing Supabase config for saved reports.");
  }

  const index = await loadIndex();
  const existing = index.find(
    (item) =>
      item.analyzedUrl === report.analyzedUrl &&
      item.outputTone === report.outputTone &&
      item.contentHash === report.contentHash &&
      item.analysisVersion === report.analysisVersion,
  );

  const summary = buildSummary(report, existing);
  if (input?.projectId) summary.projectId = input.projectId;
  if (input?.projectName) summary.projectName = input.projectName;
  if (existing?.projectId && !summary.projectId) summary.projectId = existing.projectId;
  if (existing?.projectName && !summary.projectName) summary.projectName = existing.projectName;
  const record: SavedReportRecord = {
    ...summary,
    report,
  };

  await writeObject(`reports/${summary.id}.json`, record);

  const nextIndex = sortNewestFirst([
    summary,
    ...index.filter((item) => item.id !== summary.id),
  ]);

  await saveIndex(nextIndex);

  return record;
}

export async function listSavedReports(input?: { limit?: number; domain?: string; projectId?: string }) {
  const index = withCompareHints(sortNewestFirst(await loadIndex()));
  const filteredByDomain = input?.domain ? index.filter((item) => item.domain === input.domain) : index;
  const filtered = input?.projectId ? filteredByDomain.filter((item) => item.projectId === input.projectId) : filteredByDomain;
  return typeof input?.limit === "number" ? filtered.slice(0, input.limit) : filtered;
}

export async function listSavedReportGroups() {
  const reports = await listSavedReports();
  const groups = new Map<string, SavedReportSummary[]>();

  for (const report of reports) {
    const existing = groups.get(report.domain) ?? [];
    existing.push(report);
    groups.set(report.domain, existing);
  }

  return Array.from(groups.entries()).map(([domain, reports]) => ({ domain, reports })) satisfies SavedReportGroup[];
}

export async function getSavedReportById(id: string) {
  await ensureBucket();
  return readObject<SavedReportRecord>(`reports/${id}.json`);
}
