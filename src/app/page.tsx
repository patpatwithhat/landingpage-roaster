"use client";

import { FormEvent, useMemo, useState } from "react";

type AuditResult = {
  domain: string;
  verdict: string;
  clarity: number;
  cta: number;
  trust: number;
  seo: number;
  problems: string[];
  fixes: string[];
  heroRewrite: string;
  ctaRewrite: string;
};

function buildMockResult(input: string): AuditResult {
  const normalized = input.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const domain = normalized || "your-site.com";

  return {
    domain,
    verdict:
      "This page probably knows what it wants to be, but it is making visitors work too hard to get there.",
    clarity: 58,
    cta: 64,
    trust: 49,
    seo: 61,
    problems: [
      "The headline sounds polished, but still vague about the actual outcome.",
      "The primary CTA exists, but it does not feel urgent or specific enough.",
      "There are not enough trust signals near the top of the page.",
    ],
    fixes: [
      "Rewrite the hero around one specific promise for one specific type of user.",
      "Tighten the CTA to a single clear next step with less generic wording.",
      "Add proof above the fold, like customer logos, a result, or a product screenshot.",
    ],
    heroRewrite: "Turn confused visitors into qualified demos with a landing page audit that tells you exactly what to fix.",
    ctaRewrite: "Analyze my page",
  };
}

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

export default function Home() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!submittedUrl) return null;
    return buildMockResult(submittedUrl);
  }, [submittedUrl]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) return;
    setSubmittedUrl(url.trim());
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
              Savage, useful landing page feedback in seconds.
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
              Goblin-grade website teardown
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Roast your landing page, then fix what actually matters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Paste in a URL and get a sharp audit of clarity, CTA strength,
              trust signals, and SEO basics. Less fluff, more &quot;oh damn,
              yeah, that is broken.&quot;
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                Clarity score
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                CTA analysis
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                SEO quick audit
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                Goblin verdict
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
                Start simple. Drop in a homepage URL and let the goblin do its
                work.
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
              <button
                type="submit"
                className="rounded-2xl bg-emerald-400 px-5 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Go analyze
              </button>
            </form>
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
              Example output: &quot;Your hero sounds expensive, vague, and mildly
              allergic to conversion. Fix the headline, focus the CTA, add proof.&quot;
            </div>
          </div>
        </section>

        {result ? (
          <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                  Goblin verdict
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {result.domain}
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {result.verdict}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ScoreCard label="Clarity" score={result.clarity} />
                <ScoreCard label="CTA" score={result.cta} />
                <ScoreCard label="Trust" score={result.trust} />
                <ScoreCard label="SEO" score={result.seo} />
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
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Hero line
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">
                      {result.heroRewrite}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      CTA
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">
                      {result.ctaRewrite}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">See the problems fast</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Find out whether people understand what you do, who it is for,
              and why they should care in the first few seconds.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Get useful fixes</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Not just roast for the memes. Get practical suggestions for the
              hero copy, CTA, trust signals, and page structure.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Stay lightweight</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Fast homepage-first audits now, deeper crawls and pro features
              later if the thing has legs.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
