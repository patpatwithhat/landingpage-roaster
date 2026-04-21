import Link from "next/link";

import { getAnalysisReport } from "@/lib/analysis/get-report";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";
import type { AnalysisMode, CriterionAssessment, OutputTone, ScoreBucketResult } from "@/lib/analysis/schema";

function scoreTone(score: number) {
  return score >= 75
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : score >= 55
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-300";
}

function scoreBarTone(score: number) {
  return score >= 75 ? "bg-emerald-300" : score >= 55 ? "bg-amber-300" : "bg-rose-300";
}

function statusTone(status: CriterionAssessment["status"]) {
  switch (status) {
    case "strong":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "okay":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "weak":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    default:
      return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  }
}

function CriteriaTable({ bucket }: { bucket: ScoreBucketResult }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-sm">
      <div className="grid grid-cols-[minmax(0,1.1fr)_120px_minmax(0,1.2fr)] gap-4 border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        <p>Criterion</p>
        <p>Status</p>
        <p>Assessment</p>
      </div>
      {bucket.criteria.map((criterion, index) => (
        <div
          key={criterion.key}
          className="grid grid-cols-1 gap-3 border-b border-zinc-800/70 px-4 py-4 last:border-b-0 odd:bg-zinc-950/30 md:grid-cols-[minmax(0,1.1fr)_120px_minmax(0,1.2fr)] md:gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
              <p className="text-sm font-medium text-zinc-100">{criterion.label}</p>
            </div>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{criterion.helpText}</p>
          </div>
          <div>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${statusTone(criterion.status)}`}>
              {criterion.status}
            </span>
          </div>
          <div>
            <p className="text-sm leading-6 text-zinc-300">{criterion.note}</p>
            {criterion.evidence.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {criterion.evidence.map((item) => (
                  <span key={item} className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs leading-5 text-zinc-400">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function BucketSection({ bucket }: { bucket: ScoreBucketResult }) {
  const tone = scoreTone(bucket.score);
  const barTone = scoreBarTone(bucket.score);
  const strongCount = bucket.criteria.filter((criterion) => criterion.status === "strong").length;
  const weakCount = bucket.criteria.filter((criterion) => criterion.status === "weak" || criterion.status === "missing").length;

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{bucket.label}</h2>
              <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {bucket.criteria.length} criteria
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{bucket.helpText}</p>
          </div>
          <div className="min-w-[110px] text-right">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{bucket.score}/100</span>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className={`h-full rounded-full ${barTone}`} style={{ width: `${bucket.score}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1">Strong: {strongCount}</span>
          <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1">Needs work: {weakCount}</span>
        </div>
      </div>
      <div className="p-4">
        <CriteriaTable bucket={bucket} />
      </div>
    </section>
  );
}

export default async function BreakdownPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; tone?: OutputTone; mode?: AnalysisMode }>;
}) {
  const params = await searchParams;
  const url = params.url ?? "";
  const outputTone = params.tone && params.tone in toneProfiles ? params.tone : "audit";
  const mode = params.mode ?? "neutral";

  if (!url) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
        <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Landingpage Roaster</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Scoring breakdown</h1>
          <p className="mt-4 text-zinc-300">Missing report URL. Go back, run an analysis, then open the breakdown from the report view.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
            Back to analyzer
          </Link>
        </div>
      </main>
    );
  }

  const result = await getAnalysisReport({ url, outputTone, mode });
  const resultOutputProfile = toneProfiles[result.outputTone];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-10 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <div className="border-b border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Scoring breakdown</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{result.domain}</h1>
                <p className="mt-2 text-sm text-zinc-400">{result.analyzedUrl}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1 text-sm text-zinc-300">{resultOutputProfile.label}</span>
                <Link
                  href={`/?url=${encodeURIComponent(result.analyzedUrl)}&tone=${result.outputTone}`}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
                >
                  Back to summary
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{resultOutputProfile.explanationLabel}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Full detailed audit view with bucket scores, criterion status, notes, and supporting evidence for deeper review.
              </p>
              <p className="mt-4 text-xs text-zinc-500">
                Version {result.analysisVersion} • hash {result.contentHash.slice(0, 12)} • {result.reportSource === "cache" ? "loaded from cache" : "fresh analysis"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {result.structuredAnalysis.buckets.map((bucket) => (
                <div key={bucket.key} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{bucket.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {bucket.score}
                    <span className="text-lg text-zinc-500">/100</span>
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className={`h-full rounded-full ${scoreBarTone(bucket.score)}`} style={{ width: `${bucket.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3 text-xs leading-6 text-zinc-500 backdrop-blur-sm">
          Read this like an audit sheet: score at the top, then each criterion with status, explanation, and evidence.
        </div>

        <section className="grid gap-4">
          {result.structuredAnalysis.buckets.map((bucket) => (
            <BucketSection key={bucket.key} bucket={bucket} />
          ))}
        </section>
      </div>
    </main>
  );
}
