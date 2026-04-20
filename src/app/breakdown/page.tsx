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

function ScoreCard({ bucket }: { bucket: ScoreBucketResult }) {
  const tone = scoreTone(bucket.score);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{bucket.label}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{bucket.helpText}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{bucket.score}/100</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-zinc-100" style={{ width: `${bucket.score}%` }} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {bucket.criteria.map((criterion) => (
          <div key={criterion.key} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-zinc-100">{criterion.label}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${statusTone(criterion.status)}`}>
                {criterion.status}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{criterion.helpText}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{criterion.note}</p>
            {criterion.evidence.length ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-400">
                {criterion.evidence.map((item) => (
                  <li key={item} className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
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
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Scoring breakdown</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{result.domain}</h1>
            <p className="mt-2 text-sm text-zinc-400">{result.analyzedUrl}</p>
          </div>
          <Link
            href={`/?url=${encodeURIComponent(result.analyzedUrl)}&tone=${result.outputTone}`}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Back to summary
          </Link>
        </div>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{resultOutputProfile.explanationLabel}</p>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                This page is the detailed scoring view. It keeps the main report lighter and puts the full bucket + criterion evidence here.
              </p>
              <p className="mt-4 text-xs text-zinc-500">
                Version {result.analysisVersion} • hash {result.contentHash.slice(0, 12)} • {result.reportSource === "cache" ? "loaded from cache" : "fresh analysis"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.structuredAnalysis.buckets.map((bucket) => (
                <div key={bucket.key} className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                  <p className="text-sm text-zinc-300">{bucket.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{bucket.score}<span className="text-lg text-zinc-500">/100</span></p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{bucket.helpText}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {result.structuredAnalysis.buckets.map((bucket) => (
            <ScoreCard key={bucket.key} bucket={bucket} />
          ))}
        </section>
      </div>
    </main>
  );
}
