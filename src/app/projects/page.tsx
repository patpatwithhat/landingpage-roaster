import Link from "next/link";

import { listProjects } from "@/lib/analysis/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();

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
          {projects.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition hover:border-zinc-700 hover:bg-zinc-950/85"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">{project.reportCount} reports</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Pages {project.pageCount}</span>
                    <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">Slug {project.slug}</span>
                  </div>
                  <p className="mt-4 text-xs text-zinc-500">
                    {project.latestReportAt ? `Last report ${new Date(project.latestReportAt).toLocaleString("de-DE")}` : "No saved reports yet"}
                  </p>
                </Link>
              ))}
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
