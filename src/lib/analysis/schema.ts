export type AnalysisMode = "neutral";
export type OutputTone = "neutral" | "goblin";

export type AuditResult = {
  domain: string;
  analyzedUrl: string;
  mode: AnalysisMode;
  outputTone: OutputTone;
  verdict: string;
  summary: string;
  clarity: number;
  cta: number;
  trust: number;
  seo: number;
  problems: string[];
  fixes: string[];
  heroRewrite: string;
  ctaRewrite: string;
  rawPageSignals: string[];
};

export type RawAuditPayload = {
  verdict?: unknown;
  summary?: unknown;
  clarity?: unknown;
  cta?: unknown;
  trust?: unknown;
  seo?: unknown;
  problems?: unknown;
  fixes?: unknown;
  heroRewrite?: unknown;
  ctaRewrite?: unknown;
  rawPageSignals?: unknown;
};

const LIST_LIMIT = 3;
const SIGNAL_LIMIT = 6;

function clampScore(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function sanitizeList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];

  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, limit);
}

function ensureLength(items: string[], length: number) {
  return [...items, ...Array.from({ length }, () => "")].slice(0, length);
}

export function sanitizeAuditResult(payload: RawAuditPayload, url: URL, mode: AnalysisMode, outputTone: OutputTone): AuditResult {
  return {
    domain: url.hostname,
    analyzedUrl: url.toString(),
    mode,
    outputTone,
    verdict: String(payload.verdict ?? "No verdict returned.").trim(),
    summary: String(payload.summary ?? "").trim(),
    clarity: clampScore(payload.clarity),
    cta: clampScore(payload.cta),
    trust: clampScore(payload.trust),
    seo: clampScore(payload.seo),
    problems: ensureLength(sanitizeList(payload.problems, LIST_LIMIT), LIST_LIMIT),
    fixes: ensureLength(sanitizeList(payload.fixes, LIST_LIMIT), LIST_LIMIT),
    heroRewrite: String(payload.heroRewrite ?? "").trim(),
    ctaRewrite: String(payload.ctaRewrite ?? "").trim(),
    rawPageSignals: sanitizeList(payload.rawPageSignals, SIGNAL_LIMIT),
  };
}
