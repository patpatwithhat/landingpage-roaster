import Link from "next/link";

import { getOwnerContext } from "@/lib/auth/session";
import { listRunsForPage, listSavedPages } from "@/lib/analysis/saved-reports";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";

function trendTone(delta: number) {
  if (delta > 0) return "text-emerald-300";
  if (delta < 0) return "text-rose-300";
  return "text-zinc-400";
}

function trendLabel(delta: number) {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
}

export default async function ReportsPage() {
  const owner = await getOwnerContext();
  const pages = await listSavedPages(owner);
  const pageSnapshots = await Promise.all(
    pages.map(async (page) => {
      const runs = await listRunsForPage(owner, page.id, { limit: 2, scope: "all" });
      const [latest, previous] = runs;

      return {
        page,
        latest,
        previous,
      };
    }),
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Reviewed pages</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Page history</h1>
            <p className="mt-2 text-sm text-zinc-400">See every page you reviewed, open the latest run, and compare where the page improved or dropped over time.</p>
          </div>
          <Link href="/" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
            Back to analyzer
          </Link>
        </div>

        <section className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          {pageSnapshots.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pageSnapshots.map(({ page, latest, previous }) => {
                const clarityDelta = latest && previous ? latest.scores.clarity - previous.scores.clarity : 0;
                const ctaDelta = latest && previous ? latest.scores.cta - previous.scores.cta : 0;
                const trustDelta = latest && previous ? latest.scores.trust - previous.scores.trust : 0;

                return (
                  <div key={page.id} className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{page.domain}</h2>
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{page.analyzedUrl}</p>
                      </div>
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">{page.runCount} runs</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Clarity {page.latestScores.clarity}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">CTA {page.latestScores.cta}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Trust {page.latestScores.trust}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">SEO {page.latestScores.seo}</span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3 text-xs">
                      <p className="uppercase tracking-[0.18em] text-zinc-500">Trend vs previous run</p>
                      {latest && previous ? (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <span className={`rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 ${trendTone(clarityDelta)}`}>Clarity {trendLabel(clarityDelta)}</span>
                          <span className={`rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 ${trendTone(ctaDelta)}`}>CTA {trendLabel(ctaDelta)}</span>
                          <span className={`rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 ${trendTone(trustDelta)}`}>Trust {trendLabel(trustDelta)}</span>
                        </div>
                      ) : (
                        <p className="mt-3 text-zinc-500">First run so far. No older comparison yet.</p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {latest ? (
                        <Link href={`/reports/${latest.id}`} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                          Open latest run
                        </Link>
                      ) : null}
                      {latest && previous ? (
                        <Link href={`/reports/compare?left=${previous.id}&right=${latest.id}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15">
                          Compare latest
                        </Link>
                      ) : null}
                    </div>

                    <p className="mt-4 text-xs text-zinc-500">
                      Latest run {latest ? new Date(latest.updatedAt).toLocaleString("de-DE") : new Date(page.updatedAt).toLocaleString("de-DE")} • {toneProfiles[page.latestOutputTone].label}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center text-zinc-400">
              No reviewed pages yet. Run an analysis and it will create the first record automatically.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
