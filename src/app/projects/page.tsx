import Link from "next/link";

import { getProjectById, listProjects } from "@/lib/analysis/projects";
import { listSavedReports } from "@/lib/analysis/saved-reports";

function healthTone(count: number) {
  return count > 0 ? "text-amber-300" : "text-emerald-300";
}

export default async function ProjectsPage() {
  const [projects, reports] = await Promise.all([listProjects(), listSavedReports()]);
  const projectRecords = await Promise.all(projects.map((project) => getProjectById(project.id)));
  const existingProjectRecords = projectRecords.filter((project): project is NonNullable<typeof project> => Boolean(project));
  const projectRecordMap = new Map(existingProjectRecords.map((project) => [project.id, project]));

  const projectInsights = new Map(
    projects.map((project) => {
      const projectReports = reports.filter((report) => report.projectId === project.id);
      const projectRecord = projectRecordMap.get(project.id);
      const pageStates = Object.values(projectRecord?.pageStates ?? {});
      const followUps = pageStates.filter((state) => state.status === "follow_up").length;
      const inReview = pageStates.filter((state) => state.status === "in_review").length;
      const resolved = pageStates.filter((state) => state.status === "resolved").length;
      const lowCta = projectReports.filter((report) => report.scores.cta < 55).length;
      const lowTrust = projectReports.filter((report) => report.scores.trust < 55).length;
      const regressions = projectReports.filter((report) => report.compareHintPreviousId && (report.scores.clarity < 55 || report.scores.cta < 55 || report.scores.trust < 55)).length;
      const strongest = projectReports
        .slice()
        .sort((a, b) => (b.scores.clarity + b.scores.cta + b.scores.trust + b.scores.seo) - (a.scores.clarity + a.scores.cta + a.scores.trust + a.scores.seo))[0];
      const quickWins = projectReports.filter((report) => report.scores.cta < 55 || report.scores.trust < 55 || report.scores.clarity < 55).slice(0, 2);
      const recentActivity = (projectRecord?.activity ?? []).slice(0, 2);
      const priority = regressions * 2 + lowCta + lowTrust + followUps;

      return [project.id, { lowCta, lowTrust, regressions, strongest, quickWins, priority, followUps, inReview, resolved, recentActivity }];
    }),
  );

  const sortedProjects = [...projects].sort((a, b) => (projectInsights.get(b.id)?.priority ?? 0) - (projectInsights.get(a.id)?.priority ?? 0));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Projects</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Project workspaces</h1>
            <p className="mt-2 text-sm text-zinc-400">Group related URLs and reports so history, compare, and review work like one coherent project flow.</p>
          </div>
          <Link href="/" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
            Back to analyzer
          </Link>
        </div>

        <section className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          {sortedProjects.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedProjects.map((project) => {
                const insight = projectInsights.get(project.id);

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition hover:border-zinc-700 hover:bg-zinc-950/85"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">{project.reportCount} reports</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <span className={`rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 ${healthTone(insight?.priority ?? 0)}`}>
                        {(insight?.priority ?? 0) > 0 ? `priority ${insight?.priority}` : "stable"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Pages {project.pageCount}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Weak CTA {insight?.lowCta ?? 0}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Trust gaps {insight?.lowTrust ?? 0}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Needs review {insight?.regressions ?? 0}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-zinc-400">
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Follow-up {insight?.followUps ?? 0}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">In review {insight?.inReview ?? 0}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Resolved {insight?.resolved ?? 0}</span>
                    </div>
                    {insight?.recentActivity?.length ? (
                      <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent activity</p>
                        <div className="mt-2 grid gap-2">
                          {insight.recentActivity.map((event) => (
                            <div key={event.id} className="flex items-start justify-between gap-3 text-xs text-zinc-400">
                              <div>
                                <p className="text-zinc-200">{event.detail}</p>
                                <p className="mt-1 line-clamp-1">{event.url}</p>
                              </div>
                              <span className="shrink-0 text-zinc-500">{new Date(event.createdAt).toLocaleDateString("de-DE")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {insight?.quickWins?.length ? (
                      <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-amber-300">Top quick wins</p>
                        <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                          {insight.quickWins.map((report) => (
                            <li key={report.id}>{report.analyzedUrl}</li>
                          ))}
                        </ul>
                      </div>
                    ) : insight?.strongest ? (
                      <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Strongest snapshot</p>
                        <p className="mt-2 text-sm text-zinc-200">{insight.strongest.domain}</p>
                        <p className="mt-1 text-xs text-zinc-500">Clarity {insight.strongest.scores.clarity} • CTA {insight.strongest.scores.cta} • Trust {insight.strongest.scores.trust}</p>
                      </div>
                    ) : null}
                    <p className="mt-4 text-xs text-zinc-500">
                      {project.latestReportAt ? `Last report ${new Date(project.latestReportAt).toLocaleString("de-DE")}` : "No saved reports yet"}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center text-zinc-400">
              No projects yet. Save a report into a named project from the analyzer to start building one.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
