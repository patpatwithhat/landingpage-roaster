import Link from "next/link";
import { notFound } from "next/navigation";

import { getSavedReportById, listSavedReports } from "@/lib/analysis/saved-reports";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";

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

export default async function SavedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saved = await getSavedReportById(id);

  if (!saved) notFound();

  const result = saved.report;
  const profile = toneProfiles[result.outputTone];
  const buckets = result.structuredAnalysis.buckets;
  const relatedReports = (await listSavedReports({ domain: saved.domain }))
    .filter((report) => report.analyzedUrl === saved.analyzedUrl && report.id !== saved.id)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Saved report</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{result.domain}</h1>
            <p className="mt-2 text-sm text-zinc-400">{result.analyzedUrl}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/reports" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
              All saved reports
            </Link>
            {saved.compareHintPreviousId ? (
              <Link
                href={`/reports/compare?left=${saved.compareHintPreviousId}&right=${saved.id}`}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
              >
                Compare with previous
              </Link>
            ) : null}
            <Link
              href={`/breakdown?url=${encodeURIComponent(result.analyzedUrl)}&tone=${result.outputTone}&mode=${result.mode}`}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              View breakdown
            </Link>
          </div>
        </div>

        <section className="grid gap-6 rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/75 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm">
              <div className="border-b border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{profile.verdictLabel}</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{result.domain}</h2>
                <p className="mt-2 text-sm text-zinc-500">{result.analyzedUrl}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Saved {new Date(saved.updatedAt).toLocaleString("de-DE")} • {profile.label} • version {result.analysisVersion}
                </p>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm leading-7 text-zinc-300">{result.structuredAnalysis.verdict}</p>
                <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{profile.summaryLabel}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{result.structuredAnalysis.summary}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {buckets.map((bucket) => (
                <div key={bucket.key} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-200">{bucket.label}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreTone(bucket.score)}`}>{bucket.score}/100</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className={`h-full rounded-full ${scoreBarTone(bucket.score)}`} style={{ width: `${bucket.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {relatedReports.length ? (
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white">Timeline</h3>
                <p className="mt-2 text-sm text-zinc-400">Earlier and nearby snapshots for this exact page, so you can review and compare key iterations.</p>
                <div className="mt-4 grid gap-3">
                  {relatedReports.map((report) => (
                    <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3">
                      <div>
                        <p className="text-sm text-zinc-200">{new Date(report.updatedAt).toLocaleString("de-DE")}</p>
                        <p className="mt-1 text-xs text-zinc-500">{toneProfiles[report.outputTone].label} • {report.contentHash.slice(0, 8)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/reports/${report.id}`} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                          Open
                        </Link>
                        <Link href={`/reports/compare?left=${report.id}&right=${saved.id}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15">
                          Compare
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white">{profile.problemsLabel}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {result.structuredAnalysis.problems.map((problem) => (
                    <li key={problem} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3">{problem}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white">{profile.fixesLabel}</h3>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {result.structuredAnalysis.fixes.map((fix, index) => (
                    <li key={fix} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3">
                      <span className="mr-2 text-zinc-500">{index + 1}.</span>
                      {fix}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white">{profile.rewriteLabel}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hero line</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">{result.structuredAnalysis.rewrites.hero}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CTA</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">{result.structuredAnalysis.rewrites.cta}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
