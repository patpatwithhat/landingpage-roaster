import { randomUUID } from "node:crypto";

import { type OwnerContext } from "@/lib/auth/session";
import { getSupabaseConfig, supabaseServiceRequest } from "@/lib/supabase/server";

import type { AuditResult, OutputTone } from "./schema";

const SAVED_REPORTS_BUCKET = "landingpage-roaster-saved-reports";
const STORAGE_ROOT = "global/report-history-v2";
let bucketEnsured = false;

export type SavedReportSummary = {
  id: string;
  pageId: string;
  title: string;
  domain: string;
  analyzedUrl: string;
  normalizedUrl: string;
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
  ownerType: OwnerContext["ownerType"];
  ownerId: string;
};

export type SavedReportGroup = {
  domain: string;
  reports: SavedReportSummary[];
};

export type SavedPageSummary = {
  id: string;
  title: string;
  domain: string;
  analyzedUrl: string;
  normalizedUrl: string;
  createdAt: string;
  updatedAt: string;
  latestRunId: string;
  latestScores: AuditResult["structuredAnalysis"]["scores"];
  latestOutputTone: OutputTone;
  runCount: number;
  ownerRunCount: number;
};

export type SavedPageRecord = SavedPageSummary & {
  runIds: string[];
};

export type SavedReportRecord = SavedReportSummary & {
  report: AuditResult;
};

async function ensureBucket() {
  if (bucketEnsured) return;

  const listResponse = await supabaseServiceRequest("/storage/v1/bucket");
  if (!listResponse) return;

  if (!listResponse.ok) {
    const text = await listResponse.text();
    throw new Error(`Could not inspect saved reports bucket (${listResponse.status}): ${text.slice(0, 200)}`);
  }

  const buckets = (await listResponse.json()) as Array<{ id: string }>;
  if (!buckets.some((bucket) => bucket.id === SAVED_REPORTS_BUCKET)) {
    const createResponse = await supabaseServiceRequest("/storage/v1/bucket", {
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
  const response = await supabaseServiceRequest(`/storage/v1/object/${SAVED_REPORTS_BUCKET}/${path}`);
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
  const response = await supabaseServiceRequest(`/storage/v1/object/${SAVED_REPORTS_BUCKET}/${path}`, {
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

function getOwnerKey(owner: OwnerContext) {
  return `${owner.ownerType}:${owner.ownerId}`;
}

function getOwnerKeyFromFields(ownerType: OwnerContext["ownerType"], ownerId: string) {
  return `${ownerType}:${ownerId}`;
}

function getPageIndexPath() {
  return `${STORAGE_ROOT}/pages/index.json`;
}

function getPageRecordPath(id: string) {
  return `${STORAGE_ROOT}/pages/records/${id}.json`;
}

function getRunIndexPath() {
  return `${STORAGE_ROOT}/runs/index.json`;
}

function getRunRecordPath(id: string) {
  return `${STORAGE_ROOT}/runs/records/${id}.json`;
}

async function loadPageIndex() {
  await ensureBucket();
  return (await readObject<SavedPageSummary[]>(getPageIndexPath())) ?? [];
}

async function savePageIndex(index: SavedPageSummary[]) {
  await ensureBucket();
  await writeObject(getPageIndexPath(), index);
}

async function loadRunIndex() {
  await ensureBucket();
  return (await readObject<SavedReportSummary[]>(getRunIndexPath())) ?? [];
}

async function saveRunIndex(index: SavedReportSummary[]) {
  await ensureBucket();
  await writeObject(getRunIndexPath(), index);
}

function sortNewestFirst<T extends { updatedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function sortOldestFirst<T extends { updatedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
}

function buildPageSummary(input: {
  existing?: SavedPageSummary;
  report: AuditResult;
  pageId?: string;
  createdAt?: string;
  updatedAt: string;
  latestRunId: string;
  runCount: number;
  ownerRunCount: number;
}) {
  return {
    id: input.existing?.id ?? input.pageId ?? randomUUID(),
    title: input.report.domain,
    domain: input.report.domain,
    analyzedUrl: input.report.analyzedUrl,
    normalizedUrl: input.report.analyzedUrl,
    createdAt: input.existing?.createdAt ?? input.createdAt ?? input.updatedAt,
    updatedAt: input.updatedAt,
    latestRunId: input.latestRunId,
    latestScores: input.report.structuredAnalysis.scores,
    latestOutputTone: input.report.outputTone,
    runCount: input.runCount,
    ownerRunCount: input.ownerRunCount,
  } satisfies SavedPageSummary;
}

function buildRunSummary(owner: OwnerContext, report: AuditResult, input: { pageId: string; createdAt: string; projectId?: string; projectName?: string }) {
  return {
    id: randomUUID(),
    pageId: input.pageId,
    title: report.domain,
    domain: report.domain,
    analyzedUrl: report.analyzedUrl,
    normalizedUrl: report.analyzedUrl,
    projectId: input.projectId,
    projectName: input.projectName,
    outputTone: report.outputTone,
    mode: report.mode,
    analysisVersion: report.analysisVersion,
    contentHash: report.contentHash,
    reportSource: report.reportSource,
    scores: report.structuredAnalysis.scores,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
  } satisfies SavedReportSummary;
}

function withCompareHints(items: SavedReportSummary[]) {
  const sorted = sortNewestFirst(items);

  return sorted.map((item) => {
    const previous = sorted
      .filter((candidate) => candidate.pageId === item.pageId && candidate.id !== item.id && Date.parse(candidate.updatedAt) < Date.parse(item.updatedAt))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];

    return {
      ...item,
      compareHintPreviousId: previous?.id,
    };
  });
}

function pageMatchesOwner(page: SavedPageSummary, ownerRuns: SavedReportSummary[]) {
  return ownerRuns.some((run) => run.pageId === page.id);
}

export async function saveReport(owner: OwnerContext, report: AuditResult, input?: { projectId?: string; projectName?: string }) {
  if (!getSupabaseConfig()) {
    throw new Error("Missing Supabase config for saved reports.");
  }

  const [pageIndex, runIndex] = await Promise.all([loadPageIndex(), loadRunIndex()]);
  const existingPage = pageIndex.find((page) => page.normalizedUrl === report.analyzedUrl);
  const now = new Date().toISOString();
  const pageId = existingPage?.id ?? randomUUID();
  const summary = buildRunSummary(owner, report, {
    pageId,
    createdAt: now,
    projectId: input?.projectId,
    projectName: input?.projectName,
  });

  const record: SavedReportRecord = {
    ...summary,
    report,
  };

  await writeObject(getRunRecordPath(summary.id), record);

  const nextRunIndex = sortNewestFirst([summary, ...runIndex]);
  await saveRunIndex(nextRunIndex);

  const pageRuns = nextRunIndex.filter((run) => run.pageId === pageId);
  const ownerRuns = pageRuns.filter((run) => getOwnerKeyFromFields(run.ownerType, run.ownerId) === getOwnerKey(owner));
  const nextPageSummary = buildPageSummary({
    existing: existingPage,
    report,
    pageId,
    createdAt: now,
    updatedAt: now,
    latestRunId: summary.id,
    runCount: pageRuns.length,
    ownerRunCount: ownerRuns.length,
  });

  const existingRecord = existingPage ? await readObject<SavedPageRecord>(getPageRecordPath(existingPage.id)) : null;
  const nextPageRecord: SavedPageRecord = {
    ...nextPageSummary,
    runIds: [summary.id, ...(existingRecord?.runIds ?? []).filter((runId) => runId !== summary.id)],
  };

  await writeObject(getPageRecordPath(pageId), nextPageRecord);

  const nextPageIndex = sortNewestFirst([nextPageSummary, ...pageIndex.filter((page) => page.id !== pageId)]);
  await savePageIndex(nextPageIndex);

  return record;
}

export async function listSavedReports(
  owner: OwnerContext,
  input?: { limit?: number; domain?: string; projectId?: string; pageId?: string; scope?: "owner" | "all" },
) {
  const allRuns = withCompareHints(await loadRunIndex());
  const ownerKey = getOwnerKey(owner);
  const scope = input?.scope ?? "owner";
  const scoped =
    scope === "all"
      ? allRuns
      : allRuns.filter((run) => `${run.ownerType}:${run.ownerId}` === ownerKey);
  const byDomain = input?.domain ? scoped.filter((item) => item.domain === input.domain) : scoped;
  const byProject = input?.projectId ? byDomain.filter((item) => item.projectId === input.projectId) : byDomain;
  const byPage = input?.pageId ? byProject.filter((item) => item.pageId === input.pageId) : byProject;
  return typeof input?.limit === "number" ? byPage.slice(0, input.limit) : byPage;
}

export async function listSavedReportGroups(owner: OwnerContext) {
  const reports = await listSavedReports(owner);
  const groups = new Map<string, SavedReportSummary[]>();

  for (const report of reports) {
    const existing = groups.get(report.domain) ?? [];
    existing.push(report);
    groups.set(report.domain, existing);
  }

  return Array.from(groups.entries()).map(([domain, reports]) => ({ domain, reports })) satisfies SavedReportGroup[];
}

export async function listSavedPages(owner: OwnerContext, input?: { limit?: number; domain?: string; scope?: "owner" | "all" }) {
  const [pageIndex, runIndex] = await Promise.all([loadPageIndex(), loadRunIndex()]);
  const ownerKey = getOwnerKey(owner);
  const scope = input?.scope ?? "owner";
  const filteredPages = sortNewestFirst(pageIndex)
    .filter((page) => (input?.domain ? page.domain === input.domain : true))
    .filter((page) => {
      if (scope === "all") return true;
      const ownerRuns = runIndex.filter((run) => run.pageId === page.id && `${run.ownerType}:${run.ownerId}` === ownerKey);
      return ownerRuns.length > 0;
    })
    .map((page) => {
      const ownerRunCount = runIndex.filter((run) => run.pageId === page.id && `${run.ownerType}:${run.ownerId}` === ownerKey).length;
      return {
        ...page,
        ownerRunCount,
      } satisfies SavedPageSummary;
    });

  return typeof input?.limit === "number" ? filteredPages.slice(0, input.limit) : filteredPages;
}

export async function getSavedPageById(owner: OwnerContext, id: string, input?: { scope?: "owner" | "all" }) {
  await ensureBucket();
  const page = await readObject<SavedPageRecord>(getPageRecordPath(id));
  if (!page) return null;
  if ((input?.scope ?? "owner") === "all") return page;

  const ownerRuns = await listSavedReports(owner, { pageId: id, scope: "owner", limit: 1 });
  return ownerRuns.length ? page : null;
}

export async function listRunsForPage(owner: OwnerContext, pageId: string, input?: { limit?: number; scope?: "owner" | "all" }) {
  return listSavedReports(owner, { pageId, scope: input?.scope, limit: input?.limit });
}

export async function getSavedReportById(owner: OwnerContext, id: string, input?: { scope?: "owner" | "all" }) {
  await ensureBucket();
  const report = await readObject<SavedReportRecord>(getRunRecordPath(id));
  if (!report) return null;
  if ((input?.scope ?? "owner") === "all") return report;
  return `${report.ownerType}:${report.ownerId}` === getOwnerKey(owner) ? report : null;
}

export async function claimSavedReports(fromOwner: OwnerContext, toOwner: OwnerContext) {
  const runIndex = await loadRunIndex();
  const fromKey = getOwnerKey(fromOwner);
  const matching = runIndex.filter((run) => `${run.ownerType}:${run.ownerId}` === fromKey);

  if (!matching.length) {
    return { claimed: 0 };
  }

  const rewritten = await Promise.all(
    matching.map(async (summary) => {
      const record = await readObject<SavedReportRecord>(getRunRecordPath(summary.id));
      if (!record) return null;

      const nextSummary: SavedReportSummary = {
        ...summary,
        ownerType: toOwner.ownerType,
        ownerId: toOwner.ownerId,
      };
      const nextRecord: SavedReportRecord = {
        ...record,
        ownerType: toOwner.ownerType,
        ownerId: toOwner.ownerId,
      };

      await writeObject(getRunRecordPath(summary.id), nextRecord);
      return nextSummary;
    }),
  );

  const nextRunIndex = sortNewestFirst([
    ...runIndex.filter((item) => `${item.ownerType}:${item.ownerId}` !== fromKey),
    ...rewritten.filter((item): item is SavedReportSummary => Boolean(item)),
  ]);
  await saveRunIndex(nextRunIndex);

  const pageIndex = await loadPageIndex();
  for (const page of pageIndex) {
    const pageRuns = nextRunIndex.filter((run) => run.pageId === page.id);
    const ownerRunCount = pageRuns.filter((run) => `${run.ownerType}:${run.ownerId}` === getOwnerKey(toOwner)).length;
    const latestRun = pageRuns[0];
    if (!latestRun) continue;

    const pageRecord = await readObject<SavedPageRecord>(getPageRecordPath(page.id));
    const nextPage: SavedPageSummary = {
      ...page,
      analyzedUrl: latestRun.analyzedUrl,
      normalizedUrl: latestRun.normalizedUrl,
      domain: latestRun.domain,
      title: latestRun.title,
      updatedAt: latestRun.updatedAt,
      latestRunId: latestRun.id,
      latestScores: latestRun.scores,
      latestOutputTone: latestRun.outputTone,
      runCount: pageRuns.length,
      ownerRunCount,
    };

    await writeObject(getPageRecordPath(page.id), {
      ...(pageRecord ?? { ...nextPage, runIds: [] }),
      ...nextPage,
      runIds: pageRuns.map((run) => run.id),
    } satisfies SavedPageRecord);
  }

  await savePageIndex(
    sortNewestFirst(
      pageIndex.map((page) => {
        const pageRuns = nextRunIndex.filter((run) => run.pageId === page.id);
        const latestRun = pageRuns[0];
        if (!latestRun) return page;
        return {
          ...page,
          analyzedUrl: latestRun.analyzedUrl,
          normalizedUrl: latestRun.normalizedUrl,
          domain: latestRun.domain,
          title: latestRun.title,
          updatedAt: latestRun.updatedAt,
          latestRunId: latestRun.id,
          latestScores: latestRun.scores,
          latestOutputTone: latestRun.outputTone,
          runCount: pageRuns.length,
          ownerRunCount: pageRuns.filter((run) => `${run.ownerType}:${run.ownerId}` === getOwnerKey(toOwner)).length,
        } satisfies SavedPageSummary;
      }),
    ),
  );

  return { claimed: matching.length };
}
