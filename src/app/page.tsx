"use client";

import { FormEvent, useId, useState } from "react";

import { analysisProfiles } from "@/lib/analysis/profiles/analysisProfiles";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";
import type { AuditResult, CriterionAssessment, OutputTone, ScoreBucketResult } from "@/lib/analysis/schema";

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

function HelpTooltip({ text }: { text: string }) {
  const tooltipId = useId();

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={tooltipId}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 text-[11px] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 focus:border-emerald-400 focus:text-zinc-100 focus:outline-none"
      >
        ?
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs leading-5 text-zinc-300 shadow-2xl shadow-black/40 group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

function ScoreCard({ bucket }: { bucket: ScoreBucketResult }) {
  const tone = scoreTone(bucket.score);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-200">{bucket.label}</p>
          <HelpTooltip text={bucket.helpText} />
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{bucket.score}/100</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-zinc-100" style={{ width: `${bucket.score}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bucket.criteria.map((criterion) => (
          <span
            key={criterion.key}
            title={criterion.helpText}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
          >
            {criterion.label}
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${statusTone(criterion.status)}`}>
              {criterion.status}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function CriterionRow({ criterion }: { criterion: CriterionAssessment }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-zinc-100">{criterion.label}</p>
        <HelpTooltip text={criterion.helpText} />
        <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${statusTone(criterion.status)}`}>
          {criterion.status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{criterion.note}</p>
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
  );
}

const defaultAnalysisProfile = analysisProfiles.neutral;
const availableTones = Object.values(toneProfiles);
const defaultOutputProfile = toneProfiles.audit;

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outputTone, setOutputTone] = useState<OutputTone>(defaultOutputProfile.key);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          mode: "neutral",
          outputTone,
        }),
      });

      const payload = (await response.json()) as { result?: AuditResult; error?: string };

      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      setResult(payload.result);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Analysis failed.";
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  const buckets = result?.structuredAnalysis.buckets ?? [];
  const scores = result?.structuredAnalysis.scores;
  const selectedOutputProfile = toneProfiles[outputTone];
  const resultOutputProfile = result ? toneProfiles[result.outputTone] : selectedOutputProfile;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Landingpage Roaster</p>
            <p className="mt-2 text-sm text-zinc-400">Analyze once, then explain it for the right person.</p>
          </div>
          <a
            href="#analyze"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Go analyze
          </a>
        </header>

        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {defaultAnalysisProfile.badge}
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Get a real landing page analysis, then shape it for the person reading it.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">{defaultAnalysisProfile.description}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">{defaultAnalysisProfile.label}</span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Criteria-based scoring</span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Audience-specific output modes</span>
            </div>
          </div>

          <div id="analyze" className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <p className="text-sm font-medium text-zinc-200">Analyze a page</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The app extracts page signals, scores explicit criteria, and then explains the result differently for newbies, developers, or audit-style reviews.
              </p>
            </div>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="text-sm text-zinc-300" htmlFor="url">
                Website URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://your-site.com"
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400"
              />
              <label className="text-sm text-zinc-300" htmlFor="tone">
                Report mode
              </label>
              <select
                id="tone"
                value={outputTone}
                onChange={(event) => setOutputTone(event.target.value as OutputTone)}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-base text-white outline-none transition focus:border-emerald-400"
              >
                {availableTones.map((tone) => (
                  <option key={tone.key} value={tone.key}>
                    {tone.selectorLabel}
                  </option>
                ))}
              </select>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
                <p className="font-medium text-zinc-200">{selectedOutputProfile.label}</p>
                <p className="mt-2 leading-6">{selectedOutputProfile.description}</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-500">
                  {selectedOutputProfile.emphasisPoints.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl bg-emerald-400 px-5 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Analyzing..." : "Go analyze"}
              </button>
            </form>
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
              Current architecture: fetch page → structured criteria assessment → deterministic score calculation → audience-specific explanation layer.
            </div>
            {error ? <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
          </div>
        </section>

        {result ? (
          <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{resultOutputProfile.verdictLabel}</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{result.domain}</h2>
                <p className="mt-2 text-sm text-zinc-500">{result.analyzedUrl}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Version {result.analysisVersion} • hash {result.contentHash.slice(0, 12)} • {result.reportSource === "cache" ? "loaded from cache" : "fresh analysis"}
                </p>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{result.structuredAnalysis.verdict}</p>
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{resultOutputProfile.summaryLabel}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{result.structuredAnalysis.summary}</p>
                </div>
              </div>

              {scores ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {buckets.map((bucket) => (
                    <ScoreCard key={bucket.key} bucket={bucket} />
                  ))}
                </div>
              ) : null}

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{resultOutputProfile.signalsLabel}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{resultOutputProfile.description}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {result.structuredAnalysis.rawPageSignals.map((signal) => (
                    <li key={signal} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                  <h3 className="text-lg font-semibold text-white">{resultOutputProfile.problemsLabel}</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                    {result.structuredAnalysis.problems.map((problem) => (
                      <li key={problem} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                  <h3 className="text-lg font-semibold text-white">{resultOutputProfile.fixesLabel}</h3>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                    {result.structuredAnalysis.fixes.map((fix, index) => (
                      <li key={fix} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                        <span className="mr-2 text-zinc-500">{index + 1}.</span>{fix}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-lg font-semibold text-white">{resultOutputProfile.explanationLabel}</h3>
                <div className="mt-4 grid gap-4">
                  {buckets.map((bucket) => (
                    <div key={bucket.key} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{bucket.label}</h4>
                        <HelpTooltip text={bucket.helpText} />
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${scoreTone(bucket.score)}`}>{bucket.score}/100</span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {bucket.criteria.map((criterion) => (
                          <CriterionRow key={criterion.key} criterion={criterion} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-lg font-semibold text-white">{resultOutputProfile.rewriteLabel}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hero line</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{result.structuredAnalysis.rewrites.hero}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CTA</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{result.structuredAnalysis.rewrites.cta}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
