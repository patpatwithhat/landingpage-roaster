import { scoreBuckets, type CriterionStatus, type ScoreBucketKey } from "./profiles/criteria";
import type { CriterionAssessment, ScoreBucketResult, StructuredAnalysis } from "./schema";

const STATUS_TO_SCORE: Record<CriterionStatus, number> = {
  strong: 100,
  okay: 70,
  weak: 35,
  missing: 10,
};

function clampConfidence(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0.5;
  return Math.max(0, Math.min(1, parsed));
}

function sanitizeEvidence(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 3);
}

function sanitizeStatus(value: unknown): CriterionStatus {
  return value === "strong" || value === "okay" || value === "weak" || value === "missing"
    ? value
    : "missing";
}

function scoreAssessments(assessments: CriterionAssessment[]) {
  if (!assessments.length) return 0;
  const total = assessments.reduce((sum, item) => sum + STATUS_TO_SCORE[item.status], 0);
  return Math.round(total / assessments.length);
}

export function buildBucketResults(rawBuckets: Record<string, unknown> | undefined): ScoreBucketResult[] {
  return scoreBuckets.map((bucketDef) => {
    const rawBucket = rawBuckets && typeof rawBuckets[bucketDef.key] === "object" && rawBuckets[bucketDef.key] !== null
      ? (rawBuckets[bucketDef.key] as Record<string, unknown>)
      : {};

    const criteria = bucketDef.criteria.map((criterionDef) => {
      const rawCriterion =
        rawBucket && typeof rawBucket[criterionDef.key] === "object" && rawBucket[criterionDef.key] !== null
          ? (rawBucket[criterionDef.key] as Record<string, unknown>)
          : {};

      return {
        key: criterionDef.key,
        label: criterionDef.label,
        helpText: criterionDef.helpText,
        status: sanitizeStatus(rawCriterion.status),
        confidence: clampConfidence(rawCriterion.confidence),
        evidence: sanitizeEvidence(rawCriterion.evidence),
        note: String(rawCriterion.note ?? "").trim(),
      } satisfies CriterionAssessment;
    });

    return {
      key: bucketDef.key,
      label: bucketDef.label,
      helpText: bucketDef.helpText,
      score: scoreAssessments(criteria),
      criteria,
    } satisfies ScoreBucketResult;
  });
}

export function getTopLevelScores(buckets: ScoreBucketResult[]) {
  const scoreMap = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket.score])) as Record<ScoreBucketKey, number>;

  return {
    clarity: scoreMap.clarity,
    cta: scoreMap.cta,
    trust: scoreMap.trust,
    seo: scoreMap.seo,
  };
}

export function addScoresToAnalysis(analysis: Omit<StructuredAnalysis, "buckets" | "scores"> & { buckets: ScoreBucketResult[] }): StructuredAnalysis {
  return {
    ...analysis,
    buckets: analysis.buckets,
    scores: getTopLevelScores(analysis.buckets),
  };
}
