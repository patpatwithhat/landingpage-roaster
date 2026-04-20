import { Pool } from "pg";

import type { AuditResult } from "./schema";

const REPORT_TABLE = "analysis_reports";
let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getPool() {
  const connectionString = process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString });
  }

  return pool;
}

async function ensureTable() {
  if (initPromise) return initPromise;

  const activePool = getPool();
  if (!activePool) return;

  initPromise = activePool
    .query(`
      create table if not exists ${REPORT_TABLE} (
        id bigserial primary key,
        normalized_url text not null,
        analysis_version text not null,
        content_hash text not null,
        report jsonb not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (normalized_url, analysis_version, content_hash)
      );
      create index if not exists ${REPORT_TABLE}_lookup_idx
      on ${REPORT_TABLE} (normalized_url, analysis_version, content_hash);
    `)
    .then(() => undefined);

  return initPromise;
}

export async function loadStoredReport(input: {
  normalizedUrl: string;
  analysisVersion: string;
  contentHash: string;
}) {
  const activePool = getPool();
  if (!activePool) return null;

  await ensureTable();

  const result = await activePool.query<{ report: AuditResult }>(
    `
      select report
      from ${REPORT_TABLE}
      where normalized_url = $1 and analysis_version = $2 and content_hash = $3
      limit 1
    `,
    [input.normalizedUrl, input.analysisVersion, input.contentHash],
  );

  return result.rows[0]?.report ?? null;
}

export async function storeReport(report: AuditResult) {
  const activePool = getPool();
  if (!activePool) return;

  await ensureTable();

  await activePool.query(
    `
      insert into ${REPORT_TABLE} (normalized_url, analysis_version, content_hash, report)
      values ($1, $2, $3, $4::jsonb)
      on conflict (normalized_url, analysis_version, content_hash)
      do update set report = excluded.report, updated_at = now()
    `,
    [report.analyzedUrl, report.analysisVersion, report.contentHash, JSON.stringify(report)],
  );
}
