import Link from "next/link";

import { getSavedReportById } from "@/lib/analysis/saved-reports";

function scoreDelta(current: number, previous: number) {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}`;
}

function deltaTone(delta: number) {
  return delta > 0
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : delta < 0
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : "border-zinc-700 bg-zinc-900 text-zinc-400";
}

function uniqueDiff(current: string[], previous: string[]) {
  return current.filter((item) => !previous.includes(item));
}

function sharedItems(left: string[], right: string[]) {
  return left.filter((item) => right.includes(item));
}

function CompareList({ title, items, emptyText, tone = "default" }: { title: string; items: string[]; emptyText: string; tone?: "default" | "good" | "bad" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : tone === "bad"
        ? "border-rose-500/20 bg-rose-500/5"
        : "border-zinc-800/80 bg-zinc-950/70";

  return (
    <div className={`rounded-3xl border p-6 ${toneClass}`}>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
          {items.map((item) => (
            <li key={item} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-zinc-500">{emptyText}</p>
      )}
    </div>
  );
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
  const scoreItems = [
    { key: "clarity", label: "Clarity", previous: leftScores.clarity, current: rightScores.clarity },
    { key: "cta", label: "CTA", previous: leftScores.cta, current: rightScores.cta },
    { key: "trust", label: "Trust", previous: leftScores.trust, current: rightScores.trust },
    { key: "seo", label: "SEO", previous: leftScores.seo, current: rightScores.seo },
  ];

  const improvedFixes = uniqueDiff(right.report.structuredAnalysis.fixes, left.report.structuredAnalysis.fixes);
  const newlyIntroducedProblems = uniqueDiff(right.report.structuredAnalysis.problems, left.report.structuredAnalysis.problems);
  const resolvedProblems = uniqueDiff(left.report.structuredAnalysis.problems, right.report.structuredAnalysis.problems);
  const unchangedProblems = sharedItems(left.report.structuredAnalysis.problems, right.report.structuredAnalysis.problems);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Compare reports</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{right.domain}</h1>
            <p className="mt-2 text-sm text-zinc-400">Before vs after snapshot view with score deltas, changed findings, and rewrite shifts.</p>
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
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Score delta</p>
            <div className="mt-4 grid gap-2">
              {scoreItems.map((item) => {
                const delta = item.current - item.previous;
                return (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-sm">
                    <span className="text-zinc-300">{item.label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${deltaTone(delta)}`}>{scoreDelta(item.current, item.previous)}</span>
                  </div>
                );
              })}
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
            <h2 className="text-lg font-semibold text-white">Verdict shift</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">Before</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{left.report.structuredAnalysis.verdict}</p>
            <div className="my-4 h-px bg-zinc-800" />
            <p className="text-sm leading-7 text-zinc-500">After</p>
            <p className="mt-2 text-sm leading-7 text-zinc-200">{right.report.structuredAnalysis.verdict}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Rewrite shift</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hero before</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{left.report.structuredAnalysis.rewrites.hero}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hero after</p>
                <p className="mt-3 text-sm leading-6 text-zinc-200">{right.report.structuredAnalysis.rewrites.hero}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CTA before</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{left.report.structuredAnalysis.rewrites.cta}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CTA after</p>
                <p className="mt-3 text-sm leading-6 text-zinc-200">{right.report.structuredAnalysis.rewrites.cta}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <CompareList
            title="Resolved problems"
            items={resolvedProblems}
            emptyText="No clearly resolved problem lines yet between these two snapshots."
            tone="good"
          />
          <CompareList
            title="Newly introduced problems"
            items={newlyIntroducedProblems}
            emptyText="No new problem lines showed up in the current snapshot."
            tone="bad"
          />
          <CompareList
            title="Still unresolved"
            items={unchangedProblems}
            emptyText="No unchanged problem lines remained identical across both snapshots."
          />
          <CompareList
            title="Current next fixes"
            items={improvedFixes}
            emptyText="No distinctly new fix lines appeared in the current snapshot."
          />
        </section>
      </div>
    </main>
  );
}
