import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectById } from "@/lib/analysis/projects";
import { listSavedReports } from "@/lib/analysis/saved-reports";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) notFound();

  const reports = await listSavedReports({ projectId: project.id });
  const grouped = new Map<string, typeof reports>();

  for (const report of reports) {
    const existing = grouped.get(report.analyzedUrl) ?? [];
    existing.push(report);
    grouped.set(report.analyzedUrl, existing);
  }

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
            <Link href="/projects" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
              All projects
            </Link>
            <Link href="/" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
              Analyze another page
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Reports</p>
            <p className="mt-2 text-3xl font-semibold text-white">{project.reportCount}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Pages</p>
            <p className="mt-2 text-3xl font-semibold text-white">{project.pageCount}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Last activity</p>
            <p className="mt-2 text-sm text-zinc-200">{project.latestReportAt ? new Date(project.latestReportAt).toLocaleString("de-DE") : "No reports yet"}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white">Pages in this project</h2>
          <div className="mt-6 grid gap-4">
            {Array.from(grouped.entries()).map(([url, urlReports]) => (
              <div key={url} className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{url}</h3>
                    <p className="mt-2 text-sm text-zinc-500">{urlReports.length} saved snapshots in this project</p>
                  </div>
                  <Link href={`/reports/${urlReports[0].id}`} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                    Open latest report
                  </Link>
                </div>
                <div className="mt-4 grid gap-3">
                  {urlReports.slice(0, 4).map((report) => (
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
            {!grouped.size ? (
              <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center text-zinc-400">
                No reports in this project yet. Save an analysis into this project from the main analyzer.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
