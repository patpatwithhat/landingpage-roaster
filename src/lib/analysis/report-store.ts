import { createHash } from "node:crypto";

import type { AuditResult, CoreAnalysis, OutputTone } from "./schema";

const REPORT_BUCKET = "landingpage-roaster-reports";
let bucketEnsured = false;

function getSupabaseConfig() {
  const url = process.env.LPR_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secret = process.env.LPR_SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return null;
  }

  return { url, secret };
}

function buildBasePath(normalizedUrl: string, analysisVersion: string, contentHash: string) {
  const urlHash = createHash("sha256").update(normalizedUrl).digest("hex");
  return `${analysisVersion}/${urlHash}/${contentHash}`;
}

function buildCoreObjectPath(normalizedUrl: string, analysisVersion: string, contentHash: string) {
  return `${buildBasePath(normalizedUrl, analysisVersion, contentHash)}/core.json`;
}

function buildPresentationObjectPath(normalizedUrl: string, analysisVersion: string, contentHash: string, outputTone: OutputTone) {
  return `${buildBasePath(normalizedUrl, analysisVersion, contentHash)}/presentation-${outputTone}.json`;
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
    throw new Error(`Could not inspect report bucket (${listResponse.status}): ${text.slice(0, 200)}`);
  }

  const buckets = (await listResponse.json()) as Array<{ id: string }>;
  if (!buckets.some((bucket) => bucket.id === REPORT_BUCKET)) {
    const createResponse = await supabaseRequest("/storage/v1/bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: REPORT_BUCKET,
        name: REPORT_BUCKET,
        public: false,
      }),
    });

    if (!createResponse?.ok && createResponse?.status !== 409) {
      const text = await createResponse?.text();
      throw new Error(`Could not create report bucket (${createResponse?.status}): ${text?.slice(0, 200)}`);
    }
  }

  bucketEnsured = true;
}

async function loadObject<T>(objectPath: string) {
  const response = await supabaseRequest(`/storage/v1/object/${REPORT_BUCKET}/${objectPath}`);

  if (!response) return null;
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404 || text.includes("Object not found") || text.includes("not_found")) {
      return null;
    }
    throw new Error(`Could not load cached report object (${response.status}): ${text.slice(0, 200)}`);
  }

  return (await response.json()) as T;
}

async function storeObject(objectPath: string, value: unknown) {
  const response = await supabaseRequest(`/storage/v1/object/${REPORT_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    body: JSON.stringify(value),
  });

  if (!response?.ok) {
    const text = await response?.text();
    throw new Error(`Could not store report object (${response?.status}): ${text?.slice(0, 200)}`);
  }
}

export async function loadStoredCoreAnalysis(input: {
  normalizedUrl: string;
  analysisVersion: string;
  contentHash: string;
}) {
  const config = getSupabaseConfig();
  if (!config) return null;

  await ensureBucket();
  return loadObject<CoreAnalysis>(buildCoreObjectPath(input.normalizedUrl, input.analysisVersion, input.contentHash));
}

export async function storeCoreAnalysis(input: {
  normalizedUrl: string;
  analysisVersion: string;
  contentHash: string;
  coreAnalysis: CoreAnalysis;
}) {
  const config = getSupabaseConfig();
  if (!config) return;

  await ensureBucket();
  await storeObject(buildCoreObjectPath(input.normalizedUrl, input.analysisVersion, input.contentHash), input.coreAnalysis);
}

export async function loadStoredPresentation(input: {
  normalizedUrl: string;
  analysisVersion: string;
  contentHash: string;
  outputTone: OutputTone;
}) {
  const config = getSupabaseConfig();
  if (!config) return null;

  await ensureBucket();
  return loadObject<AuditResult>(buildPresentationObjectPath(input.normalizedUrl, input.analysisVersion, input.contentHash, input.outputTone));
}

export async function storePresentation(report: AuditResult) {
  const config = getSupabaseConfig();
  if (!config) return;

  await ensureBucket();
  await storeObject(buildPresentationObjectPath(report.analyzedUrl, report.analysisVersion, report.contentHash, report.outputTone), report);
}
