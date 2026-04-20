import { createHash } from "node:crypto";

import type { AuditResult } from "./schema";

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

function buildObjectPath(normalizedUrl: string, analysisVersion: string, contentHash: string, outputTone: AuditResult["outputTone"]) {
  const urlHash = createHash("sha256").update(normalizedUrl).digest("hex");
  return `${analysisVersion}/${outputTone}/${urlHash}/${contentHash}.json`;
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.secret,
      Authorization: `Bearer ${config.secret}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return response;
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

export async function loadStoredReport(input: {
  normalizedUrl: string;
  analysisVersion: string;
  contentHash: string;
  outputTone: AuditResult["outputTone"];
}) {
  const config = getSupabaseConfig();
  if (!config) return null;

  await ensureBucket();

  const objectPath = buildObjectPath(input.normalizedUrl, input.analysisVersion, input.contentHash, input.outputTone);
  const response = await supabaseRequest(`/storage/v1/object/${REPORT_BUCKET}/${objectPath}`);

  if (!response) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404 || text.includes('Object not found') || text.includes('not_found')) {
      return null;
    }
    throw new Error(`Could not load cached report (${response.status}): ${text.slice(0, 200)}`);
  }

  return (await response.json()) as AuditResult;
}

export async function storeReport(report: AuditResult) {
  const config = getSupabaseConfig();
  if (!config) return;

  await ensureBucket();

  const objectPath = buildObjectPath(report.analyzedUrl, report.analysisVersion, report.contentHash, report.outputTone);
  const response = await supabaseRequest(`/storage/v1/object/${REPORT_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    body: JSON.stringify(report),
  });

  if (!response?.ok) {
    const text = await response?.text();
    throw new Error(`Could not store report (${response?.status}): ${text?.slice(0, 200)}`);
  }
}
