import Link from "next/link";
import { notFound } from "next/navigation";

import { getOwnerContext } from "@/lib/auth/session";
import { getProjectById } from "@/lib/analysis/projects";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";
import { listSavedReports } from "@/lib/analysis/saved-reports";

import { ProjectPageStatusActions } from "./project-actions";

function priorityTone(priority: number) {
  if (priority >= 5) return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  if (priority >= 3) return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
}

type FilterKey = "all" | "follow_up" | "in_review" | "resolved" | "regressions";
type ActivityFilterKey = "all" | "reports" | "workflow";

function filterLabel(filter: FilterKey) {
  switch (filter) {
    case "follow_up":
      return "Follow-up";
    case "in_review":
      return "In review";
    case "resolved":
      return "Resolved";
    case "regressions":
      return "Regressions";
    default:
      return "All";
  }
}

function activityFilterLabel(filter: ActivityFilterKey) {
  switch (filter) {
    case "reports":
      return "Reports";
    case "workflow":
      return "Workflow";
    default:
      return "All activity";
  }
}

function activityTone(type: "report_saved" | "page_status_changed") {
  return type === "report_saved"
    ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
    : "border-violet-500/20 bg-violet-500/10 text-violet-300";
}

function activityTypeLabel(type: "report_saved" | "page_status_changed") {
  return type === "report_saved" ? "Report" : "Workflow";
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; activity?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const activeFilter = (["all", "follow_up", "in_review", "resolved", "regressions"].includes(query.filter ?? "")
    ? query.filter
    : "all") as FilterKey;
  const activeActivityFilter = (["all", "reports", "workflow"].includes(query.activity ?? "") ? query.activity : "all") as ActivityFilterKey;
  const owner = await getOwnerContext();

  const project = await getProjectById(owner, id);

  if (!project) notFound();

  const reports = await listSavedReports(owner, { projectId: project.id });
  const grouped = new Map<string, typeof reports>();

  for (const report of reports) {
    const existing = grouped.get(report.analyzedUrl) ?? [];
    existing.push(report);
    grouped.set(report.analyzedUrl, existing);
  }

  const pages = Array.from(grouped.entries())
    .map(([url, urlReports]) => {
      const latest = urlReports[0];
      const previous = latest.compareHintPreviousId ? urlReports.find((report) => report.id === latest.compareHintPreviousId) : undefined;
      const totalScore = latest.scores.clarity + latest.scores.cta + latest.scores.trust + latest.scores.seo;
      const previousTotal = previous ? previous.scores.clarity + previous.scores.cta + previous.scores.trust + previous.scores.seo : null;
      const delta = previousTotal === null ? null : totalScore - previousTotal;
      const needsReview = latest.scores.cta < 55 || latest.scores.trust < 55 || latest.scores.clarity < 55;
      const weakAreas = [latest.scores.cta < 55, latest.scores.trust < 55, latest.scores.clarity < 55].filter(Boolean).length;
      const priority = weakAreas + (delta !== null && delta < 0 ? 2 : 0) + (latest.scores.cta < 40 ? 1 : 0);
      const quickWin = latest.scores.cta < 55 ? "Clarify and strengthen the primary CTA" : latest.scores.trust < 55 ? "Add stronger proof and credibility signals" : latest.scores.clarity < 55 ? "Tighten messaging and audience clarity" : "Keep iterating from the current strongest snapshot";
      const workflowState = project.pageStates?.[url]?.status ?? "none";

      return {
        url,
        reports: urlReports,
        latest,
        totalScore,
        delta,
        needsReview,
        priority,
        quickWin,
        workflowState,
      };
    })
    .sort((a, b) => b.priority - a.priority || (b.delta ?? 0) - (a.delta ?? 0));

  const filteredPages = pages.filter((page) => {
    switch (activeFilter) {
      case "follow_up":
        return page.workflowState === "follow_up";
      case "in_review":
        return page.workflowState === "in_review";
      case "resolved":
        return page.workflowState === "resolved";
      case "regressions":
        return (page.delta ?? 0) < 0;
      default:
        return true;
    }
  });

  const needsReviewCount = pages.filter((page) => page.needsReview).length;
  const improvedCount = pages.filter((page) => (page.delta ?? 0) > 0).length;
  const regressedCount = pages.filter((page) => (page.delta ?? 0) < 0).length;
  const triageQueue = pages.filter((page) => page.priority > 0).slice(0, 5);
  const quickWins = pages
    .filter((page) => page.latest.scores.cta < 55 || page.latest.scores.trust < 55 || page.latest.scores.clarity < 55)
    .slice(0, 3);
  const activity = (project.activity ?? [])
    .filter((event) => {
      switch (activeActivityFilter) {
        case "reports":
          return event.type === "report_saved";
        case "workflow":
          return event.type === "page_status_changed";
        default:
          return true;
      }
    })
    .slice(0, 12);
  const filterCounts: Record<FilterKey, number> = {
    all: pages.length,
    follow_up: pages.filter((page) => page.workflowState === "follow_up").length,
    in_review: pages.filter((page) => page.workflowState === "in_review").length,
    resolved: pages.filter((page) => page.workflowState === "resolved").length,
    regressions: pages.filter((page) => (page.delta ?? 0) < 0).length,
  };

  const filters: FilterKey[] = ["all", "follow_up", "in_review", "resolved", "regressions"];
  const activityFilters: ActivityFilterKey[] = ["all", "reports", "workflow"];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Project</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{project.name}</h1>
            <p className="mt-2 text-sm text-zinc-400">Keep the related pages, report history, and compare entry points for this project in one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/projects/${project.id}#triage`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15">
              Open triage
            </Link>
            <Link href={`/projects/${project.id}#quick-wins`} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
              Open quick wins
            </Link>
            <Link href="/projects" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
              All projects
            </Link>
            <Link href={`/?project=${encodeURIComponent(project.name)}`} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
              Analyze into project
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 xl:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Reports</p>
            <p className="mt-2 text-3xl font-semibold text-white">{project.reportCount}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 xl:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Needs review</p>
            <p className="mt-2 text-3xl font-semibold text-white">{needsReviewCount}</p>
          </div>
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Improved</p>
            <p className="mt-2 text-3xl font-semibold text-white">{improvedCount}</p>
          </div>
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-rose-300">Regressed</p>
            <p className="mt-2 text-3xl font-semibold text-white">{regressedCount}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div id="triage" className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Triage queue</h2>
                <p className="mt-2 text-sm text-zinc-400">Pages that deserve attention first, based on regressions and weak core areas.</p>
              </div>
              <p className="text-sm text-zinc-500">Last activity {project.latestReportAt ? new Date(project.latestReportAt).toLocaleString("de-DE") : "No reports yet"}</p>
            </div>
            <div className="mt-6 grid gap-3">
              {triageQueue.length ? (
                triageQueue.map((page, index) => (
                  <div key={page.url} className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">#{index + 1}</span>
                          <h3 className="text-sm font-semibold text-white">{page.url}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-xs ${priorityTone(page.priority)}`}>priority {page.priority}</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">{page.quickWin}</p>
                        <div className="mt-3">
                          <ProjectPageStatusActions projectId={project.id} url={page.url} status={page.workflowState} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/?url=${encodeURIComponent(page.url)}&tone=audit&project=${encodeURIComponent(project.name)}`} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                          Re-run audit
                        </Link>
                        <Link href={`/reports/${page.latest.id}`} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                          Open
                        </Link>
                        {page.latest.compareHintPreviousId ? (
                          <Link href={`/reports/compare?left=${page.latest.compareHintPreviousId}&right=${page.latest.id}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15">
                            Compare
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400">
                  No active triage items right now.
                </div>
              )}
            </div>
          </div>

          <div id="quick-wins" className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-white">Quick wins</h2>
            <p className="mt-2 text-sm text-zinc-400">The easiest high-value next moves across this project.</p>
            <div className="mt-6 grid gap-3">
              {quickWins.length ? (
                quickWins.map((page) => (
                  <div key={page.url} className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4">
                    <p className="text-sm font-semibold text-white">{page.url}</p>
                    <p className="mt-2 text-sm text-zinc-400">{page.quickWin}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">CTA {page.latest.scores.cta}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Trust {page.latest.scores.trust}</span>
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Clarity {page.latest.scores.clarity}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/?url=${encodeURIComponent(page.url)}&tone=developer&project=${encodeURIComponent(project.name)}`} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                        Re-run for developer
                      </Link>
                      <Link href={`/reports/${page.latest.id}`} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                        Open latest
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400">
                  No obvious quick wins yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Activity</h2>
              <p className="mt-2 text-sm text-zinc-400">Recent workflow and reporting events across this project.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activityFilters.map((filter) => {
                const isActive = filter === activeActivityFilter;
                return (
                  <Link
                    key={filter}
                    href={`/projects/${project.id}?filter=${activeFilter}&activity=${filter}`}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"}`}
                  >
                    {activityFilterLabel(filter)}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {activity.length ? (
              activity.map((event) => (
                <div key={event.id} className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${activityTone(event.type)}`}>{activityTypeLabel(event.type)}</span>
                        <p className="text-sm font-medium text-white">{event.detail}</p>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{event.url}</p>
                    </div>
                    <p className="text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString("de-DE")}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400">
                No activity yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Project overview</h2>
              <p className="mt-2 text-sm text-zinc-400">See which pages improved, which still need work, and where to jump into report history or compare.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const isActive = filter === activeFilter;
                return (
                  <Link
                    key={filter}
                    href={`/projects/${project.id}?filter=${filter}`}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"}`}
                  >
                    {filterLabel(filter)} {filterCounts[filter]}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {filteredPages.map((page) => (
              <div key={page.url} className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{page.url}</h3>
                      {page.needsReview ? (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">needs review</span>
                      ) : (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">healthy snapshot</span>
                      )}
                      {page.delta !== null ? (
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${page.delta > 0 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : page.delta < 0 ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}>
                          {page.delta > 0 ? `+${page.delta}` : page.delta}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">{page.reports.length} saved snapshots in this project</p>
                    <div className="mt-3">
                      <ProjectPageStatusActions projectId={project.id} url={page.url} status={page.workflowState} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/?url=${encodeURIComponent(page.url)}&tone=audit&project=${encodeURIComponent(project.name)}`} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                      Re-run analysis
                    </Link>
                    <Link href={`/reports/${page.latest.id}`} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                      Open latest report
                    </Link>
                    {page.latest.compareHintPreviousId ? (
                      <Link href={`/reports/compare?left=${page.latest.compareHintPreviousId}&right=${page.latest.id}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15">
                        Compare latest
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2 xl:grid-cols-4">
                  <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Clarity {page.latest.scores.clarity}</span>
                  <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">CTA {page.latest.scores.cta}</span>
                  <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Trust {page.latest.scores.trust}</span>
                  <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">SEO {page.latest.scores.seo}</span>
                </div>

                <div className="mt-4 grid gap-3">
                  {page.reports.slice(0, 4).map((report) => (
                    <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3">
                      <div>
                        <p className="text-sm text-zinc-200">{new Date(report.updatedAt).toLocaleString("de-DE")}</p>
                        <p className="mt-1 text-xs text-zinc-500">{toneProfiles[report.outputTone].label} • v{report.analysisVersion.replace(/^v/, "")}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/reports/${report.id}`} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                          Open
                        </Link>
                        {report.compareHintPreviousId ? (
                          <Link href={`/reports/compare?left=${report.compareHintPreviousId}&right=${report.id}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15">
                            Compare
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!filteredPages.length ? (
              <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center text-zinc-400">
                No pages match the current filter.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
