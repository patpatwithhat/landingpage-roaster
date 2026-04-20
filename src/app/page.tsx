"use client";

import { FormEvent, useState } from "react";

import { analysisProfiles } from "@/lib/analysis/profiles/analysisProfiles";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";
import type { AuditResult, OutputTone } from "@/lib/analysis/schema";

function ScoreCard({ label, score }: { label: string; score: number }) {
  const tone =
    score >= 75
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : score >= 55
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-rose-500/30 bg-rose-500/10 text-rose-300";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-zinc-100" style={{ width: `${score}%` }} />
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
          {score}/100
        </span>
      </div>
    </div>
  );
}

const defaultAnalysisProfile = analysisProfiles.neutral;
const availableTones = Object.values(toneProfiles);

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outputTone, setOutputTone] = useState<OutputTone>("neutral");

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

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Landingpage Roaster
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Analyze first, style the voice second.
            </p>
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
              Get a real landing page analysis, then decide how spicy it should sound.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {defaultAnalysisProfile.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                {defaultAnalysisProfile.label}
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                Tone can be swapped later
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                OpenAI-backed analysis
              </span>
            </div>
          </div>

          <div
            id="analyze"
            className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30"
          >
            <div className="mb-6">
              <p className="text-sm font-medium text-zinc-200">Analyze a page</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Right now the app fetches the page, extracts signals, sends them to OpenAI, and renders the
                result below.
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
                UI tone
              </label>
              <select
                id="tone"
                value={outputTone}
                onChange={(event) => setOutputTone(event.target.value as OutputTone)}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-base text-white outline-none transition focus:border-emerald-400"
              >
                {availableTones.map((tone) => (
                  <option key={tone.key} value={tone.key}>
                    {tone.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl bg-emerald-400 px-5 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Analyzing..." : "Go analyze"}
              </button>
            </form>
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
              Current architecture: fetch page → neutral analysis → tone-specific presentation.
            </div>
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        {result ? (
          <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Analysis verdict</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{result.domain}</h2>
                <p className="mt-2 text-sm text-zinc-500">{result.analyzedUrl}</p>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{result.verdict}</p>
                <p className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm leading-6 text-zinc-300">
                  {result.summary}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ScoreCard label="Clarity" score={result.clarity} />
                <ScoreCard label="CTA" score={result.cta} />
                <ScoreCard label="Trust" score={result.trust} />
                <ScoreCard label="SEO" score={result.seo} />
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-lg font-semibold text-white">Observed page signals</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {result.rawPageSignals.map((signal) => (
                    <li key={signal} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-lg font-semibold text-white">Top 3 biggest problems</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {result.problems.map((problem) => (
                    <li key={problem} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                      {problem}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-lg font-semibold text-white">Quick fixes</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {result.fixes.map((fix) => (
                    <li key={fix} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                      {fix}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white">Suggested rewrite</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hero line</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{result.heroRewrite}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CTA</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{result.ctaRewrite}</p>
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
