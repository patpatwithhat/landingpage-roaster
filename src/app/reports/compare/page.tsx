import Link from "next/link";

import { getSavedReportById } from "@/lib/analysis/saved-reports";

function scoreDelta(current: number, previous: number) {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}`;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ left?: string; right?: string }>;
}) {
  const params = await searchParams;
  const leftId = params.left ?? "";
  const rightId = params.right ?? "";

  if (!leftId || !rightId) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
        <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-8">
          <h1 className="text-3xl font-semibold text-white">Compare reports</h1>
          <p className="mt-4 text-zinc-400">Missing compare ids. Open a saved report timeline and start compare from there.</p>
        </div>
      </main>
    );
  }

  const left = await getSavedReportById(leftId);
  const right = await getSavedReportById(rightId);

  if (!left || !right) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
        <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-8">
          <h1 className="text-3xl font-semibold text-white">Compare reports</h1>
          <p className="mt-4 text-zinc-400">One of the saved reports could not be loaded.</p>
        </div>
      </main>
    );
  }

  const leftScores = left.report.structuredAnalysis.scores;
  const rightScores = right.report.structuredAnalysis.scores;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Compare reports</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{right.domain}</h1>
            <p className="mt-2 text-sm text-zinc-400">Before vs after snapshot view, compare-ready foundation.</p>
          </div>
          <Link href={`/reports/${right.id}`} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
            Back to report
          </Link>
        </div>

        <section className="grid gap-6 rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm lg:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Previous</p>
            <p className="mt-3 text-sm text-zinc-200">{new Date(left.updatedAt).toLocaleString("de-DE")}</p>
            <p className="mt-2 text-xs text-zinc-500">{left.report.outputTone} • {left.report.contentHash.slice(0, 8)}</p>
          </div>
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Delta</p>
            <div className="mt-4 grid gap-2 text-sm text-zinc-200">
              <p>Clarity {scoreDelta(rightScores.clarity, leftScores.clarity)}</p>
              <p>CTA {scoreDelta(rightScores.cta, leftScores.cta)}</p>
              <p>Trust {scoreDelta(rightScores.trust, leftScores.trust)}</p>
              <p>SEO {scoreDelta(rightScores.seo, leftScores.seo)}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current</p>
            <p className="mt-3 text-sm text-zinc-200">{new Date(right.updatedAt).toLocaleString("de-DE")}</p>
            <p className="mt-2 text-xs text-zinc-500">{right.report.outputTone} • {right.report.contentHash.slice(0, 8)}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">What changed in the verdict</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">{left.report.structuredAnalysis.verdict}</p>
            <div className="my-4 h-px bg-zinc-800" />
            <p className="text-sm leading-7 text-zinc-200">{right.report.structuredAnalysis.verdict}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Next compare step</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              This is the first compare-ready view: score deltas, previous/current snapshots, and a direct path from history. Next we can deepen this into finding-level and rewrite-level diffs.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
