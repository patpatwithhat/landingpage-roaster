import type { CriterionStatus, ScoreBucketKey } from "./profiles/criteria";

export type AnalysisMode = "neutral";
export type OutputTone = "neutral" | "goblin";

export type CriterionAssessment = {
  key: string;
  label: string;
  helpText: string;
  status: CriterionStatus;
  confidence: number;
  evidence: string[];
  note: string;
};

export type ScoreBucketResult = {
  key: ScoreBucketKey;
  label: string;
  helpText: string;
  score: number;
  criteria: CriterionAssessment[];
};

export type AuditScores = {
  clarity: number;
  cta: number;
  trust: number;
  seo: number;
};

export type StructuredAnalysis = {
  verdict: string;
  summary: string;
  rawPageSignals: string[];
  problems: string[];
  fixes: string[];
  rewrites: {
    hero: string;
    cta: string;
  };
  buckets: ScoreBucketResult[];
  scores: AuditScores;
};

export type AuditResult = {
  domain: string;
  analyzedUrl: string;
  mode: AnalysisMode;
  outputTone: OutputTone;
  analysisVersion: string;
  contentHash: string;
  reportSource: "fresh" | "cache";
  structuredAnalysis: StructuredAnalysis;
};

export type RawCriterionPayload = {
  status?: unknown;
  confidence?: unknown;
  evidence?: unknown;
  note?: unknown;
};

export type RawAuditPayload = {
  verdict?: unknown;
  summary?: unknown;
  rawPageSignals?: unknown;
  problems?: unknown;
  fixes?: unknown;
  rewrites?: {
    hero?: unknown;
    cta?: unknown;
  };
  buckets?: Record<string, Record<string, RawCriterionPayload>>;
};

const LIST_LIMIT = 3;
const SIGNAL_LIMIT = 6;

function sanitizeList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];

  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, limit);
}

function ensureLength(items: string[], length: number) {
  return [...items, ...Array.from({ length }, () => "")].slice(0, length);
}

export function sanitizeText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

export function sanitizeRawAnalysis(payload: RawAuditPayload) {
  return {
    verdict: sanitizeText(payload.verdict, "No verdict returned."),
    summary: sanitizeText(payload.summary),
    rawPageSignals: sanitizeList(payload.rawPageSignals, SIGNAL_LIMIT),
    problems: ensureLength(sanitizeList(payload.problems, LIST_LIMIT), LIST_LIMIT),
    fixes: ensureLength(sanitizeList(payload.fixes, LIST_LIMIT), LIST_LIMIT),
    rewrites: {
      hero: sanitizeText(payload.rewrites?.hero),
      cta: sanitizeText(payload.rewrites?.cta),
    },
    buckets: payload.buckets,
  };
}
