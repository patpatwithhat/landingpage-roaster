import Link from "next/link";

import { listSavedReportGroups } from "@/lib/analysis/saved-reports";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";

export default async function ReportsPage() {
  const groups = await listSavedReportGroups();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Saved reports</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Report history</h1>
            <p className="mt-2 text-sm text-zinc-400">Re-open older audits, track what was reviewed, and build toward compare mode.</p>
          </div>
          <Link href="/" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
            Back to analyzer
          </Link>
        </div>

        <section className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          {groups.length ? (
            <div className="grid gap-6">
              {groups.map((group) => (
                <div key={group.domain} className="rounded-3xl border border-zinc-800/80 bg-zinc-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{group.domain}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{group.reports.length} saved snapshots</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4">
                    {group.reports.map((report, index) => (
                      <Link
                        key={report.id}
                        href={`/reports/${report.id}`}
                        className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 transition hover:border-zinc-700 hover:bg-zinc-950/85"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-500">#{index + 1}</span>
                              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">
                                {toneProfiles[report.outputTone].label}
                              </span>
                              {report.compareHintPreviousId ? (
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                                  compare-ready
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm text-zinc-300">{report.analyzedUrl}</p>
                            <p className="mt-2 text-xs text-zinc-500">
                              Saved {new Date(report.updatedAt).toLocaleString("de-DE")} • version {report.analysisVersion}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4">
                            <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Clarity {report.scores.clarity}</span>
                            <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">CTA {report.scores.cta}</span>
                            <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Trust {report.scores.trust}</span>
                            <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">SEO {report.scores.seo}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center text-zinc-400">
              No saved reports yet. Run an analysis first, then save it from the report view.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
