"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";

import Link from "next/link";

import { analysisProfiles } from "@/lib/analysis/profiles/analysisProfiles";
import { toneProfiles } from "@/lib/analysis/profiles/toneProfiles";
import type { ProjectSummary } from "@/lib/analysis/projects";
import type { SavedReportSummary } from "@/lib/analysis/saved-reports";
import type { AuditResult, CriterionAssessment, OutputTone, ScoreBucketResult } from "@/lib/analysis/schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionPayload = {
  session: {
    ownerType: "anonymous" | "user";
    isAuthenticated: boolean;
    displayName: string;
  };
  auth: {
    github: {
      available: boolean;
      reason: string | null;
    };
  };
};

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

function statusTone(status: CriterionAssessment["status"]) {
  switch (status) {
    case "strong":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "okay":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "weak":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    default:
      return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  }
}

function HelpTooltip({ text }: { text: string }) {
  const tooltipId = useId();

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={tooltipId}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 text-[11px] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 focus:border-emerald-400 focus:text-zinc-100 focus:outline-none"
      >
        ?
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs leading-5 text-zinc-300 shadow-2xl shadow-black/40 group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

function ScoreCard({ bucket }: { bucket: ScoreBucketResult }) {
  const tone = scoreTone(bucket.score);
  const barTone = scoreBarTone(bucket.score);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-200">{bucket.label}</p>
          <HelpTooltip text={bucket.helpText} />
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{bucket.score}/100</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${bucket.score}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bucket.criteria.map((criterion) => (
          <span
            key={criterion.key}
            title={criterion.helpText}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300"
          >
            {criterion.label}
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${statusTone(criterion.status)}`}>
              {criterion.status}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const defaultAnalysisProfile = analysisProfiles.neutral;
const defaultOutputProfile = toneProfiles.audit;

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("project") ?? "";
  });
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [session, setSession] = useState<SessionPayload["session"] | null>(null);
  const [githubAuth, setGithubAuth] = useState<SessionPayload["auth"]["github"] | null>(null);
  const [returnTo] = useState(() => {
    if (typeof window === "undefined") return "/";
    return `${window.location.pathname}${window.location.search}` || "/";
  });

  async function handleLogout() {
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ ownerType: "anonymous", isAuthenticated: false, displayName: "Guest" });
      setSavedReportId(null);
      window.location.reload();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not log out.";
      setError(message);
    }
  }

  async function saveReportRecord(nextReport: AuditResult, nextProjectName?: string) {
    const response = await fetch("/api/reports/save", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        report: nextReport,
        projectName: nextProjectName?.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as { report?: SavedReportSummary; error?: string };

    if (!response.ok || !payload.report) {
      throw new Error(payload.error ?? "Could not save report.");
    }

    setSavedReportId(payload.report.id);
    if (payload.report.projectName) {
      setProjectName(payload.report.projectName);
    }

    return payload.report;
  }

  const runAnalysis = useCallback(
    async (nextUrl: string, nextOutputTone: OutputTone) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            url: nextUrl.trim(),
            mode: "neutral",
            outputTone: nextOutputTone,
          }),
        });

        const payload = (await response.json()) as { result?: AuditResult; error?: string };

        if (!response.ok || !payload.result) {
          throw new Error(payload.error ?? "Analysis failed.");
        }

        setResult(payload.result);
        setUrl(nextUrl.trim());
        setSavedReportId(null);

        try {
          await saveReportRecord(payload.result, projectName);
        } catch (saveError) {
          const saveMessage = saveError instanceof Error ? saveError.message : "Could not save report.";
          setError(saveMessage);
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Analysis failed.";
        setError(message);
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [projectName],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || isLoading) return;

    await runAnalysis(url, defaultOutputProfile.key);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefilledUrl = params.get("url")?.trim();
    const prefilledTone = params.get("tone");
    const safeTone = prefilledTone && prefilledTone in toneProfiles ? (prefilledTone as OutputTone) : defaultOutputProfile.key;

    if (!prefilledUrl) return;
    if (isLoading) return;
    if (result?.analyzedUrl === prefilledUrl && result.outputTone === safeTone) return;

    const timer = window.setTimeout(() => {
      void runAnalysis(prefilledUrl, safeTone);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [result, isLoading, runAnalysis]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        const payload = (await response.json()) as SessionPayload;
        if (!response.ok || cancelled) return;
        setSession(payload.session);
        setGithubAuth(payload.auth.github);
      } catch {
        if (!cancelled) {
          setSession(null);
          setGithubAuth(null);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        const payload = (await response.json()) as { projects?: ProjectSummary[] };
        if (!response.ok || !payload.projects || cancelled) return;
        setProjects(payload.projects);
      } catch {
        if (!cancelled) setProjects([]);
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [savedReportId]);

  async function handleSaveReport() {
    if (!result || isSaving) return;

    setIsSaving(true);

    try {
      await saveReportRecord(result, projectName);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not save report.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  const buckets = result?.structuredAnalysis.buckets ?? [];
  const scores = result?.structuredAnalysis.scores;
  const resultOutputProfile = result ? toneProfiles[result.outputTone] : defaultOutputProfile;

  return (
    <main
      aria-busy={isLoading}
      className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] text-zinc-50 sm:px-6 sm:py-10 sm:pb-[calc(env(safe-area-inset-bottom)+2.5rem)] lg:px-8 lg:py-12 lg:pb-[calc(env(safe-area-inset-bottom)+3rem)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:gap-12 lg:gap-16">
        <header className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Landingpage Roaster</p>
            <p className="mt-2 text-sm text-zinc-400">Analyze once, then explain it for the right person.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-start lg:justify-end">
            {session?.isAuthenticated ? (
              <>
                <div className="inline-flex w-full items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 sm:w-auto">
                  Signed in as {session.displayName}
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="w-full rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                >
                  Log out
                </button>
              </>
            ) : githubAuth?.available ? (
              <Link
                href={`/login?next=${encodeURIComponent(returnTo)}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
              >
                Login
              </Link>
            ) : (
              <div className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 sm:w-auto">
                Guest mode
              </div>
            )}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {defaultAnalysisProfile.badge}
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
              Get a real landing page analysis, then shape it for the person reading it.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:mt-6 sm:text-lg sm:leading-8">
              {defaultAnalysisProfile.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-zinc-300 sm:mt-8 sm:gap-3">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">{defaultAnalysisProfile.label}</span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Criteria-based scoring</span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Try first, login later</span>
            </div>
          </div>

          <div
            id="analyze"
            className="rounded-[1.75rem] border border-zinc-800/80 bg-zinc-900/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:rounded-3xl sm:p-6"
          >
            <div className="mb-6">
              <p className="text-sm font-medium text-zinc-200">Analyze a page</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Paste a URL, let the app inspect the page, and get a clear landing-page review with actionable fixes.
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
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-emerald-400 px-5 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Analyzing..." : "Analyze"}
              </button>
            </form>
            <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-400 backdrop-blur-sm">
              Analyze the page, score clear criteria, and turn the findings into an audience-appropriate report.
            </div>
            <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-400 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-200">Ownership mode</p>
                  <p className="mt-1 leading-6">
                    {session?.isAuthenticated
                      ? `Signed in as ${session.displayName}. Reports and projects belong to your account.`
                      : githubAuth?.available
                        ? "Guest mode is active. Analyze freely first, then connect GitHub later when you want to keep reports and projects across sessions."
                        : "Guest mode is active. Analyze freely first. Cross-session ownership is not configured in this deployment yet."}
                  </p>
                </div>
              </div>
              {!githubAuth?.available && githubAuth?.reason ? <p className="mt-3 text-xs text-amber-300">{githubAuth.reason}</p> : null}
            </div>
            {error ? <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
          </div>
        </section>

        {result ? (
          <section className="grid gap-5 rounded-[1.75rem] border border-zinc-800/80 bg-zinc-900/55 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:gap-6 sm:rounded-[2rem] sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/75 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                <div className="border-b border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 px-4 py-5 sm:px-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{resultOutputProfile.verdictLabel}</p>
                  <h2 className="mt-3 break-words text-xl font-semibold text-white sm:text-2xl">{result.domain}</h2>
                  <p className="mt-2 break-all text-sm text-zinc-500">{result.analyzedUrl}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Version {result.analysisVersion} • hash {result.contentHash.slice(0, 12)} • {result.reportSource === "cache" ? "loaded from cache" : "fresh analysis"}
                  </p>
                </div>
                <div className="px-4 py-5 sm:px-6">
                  <p className="text-sm leading-7 text-zinc-300">{result.structuredAnalysis.verdict}</p>
                  <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{resultOutputProfile.summaryLabel}</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{result.structuredAnalysis.summary}</p>
                  </div>
                </div>
              </div>

              {scores ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {buckets.map((bucket) => (
                    <ScoreCard key={bucket.key} bucket={bucket} />
                  ))}
                </div>
              ) : null}

              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{resultOutputProfile.signalsLabel}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{resultOutputProfile.description}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {result.structuredAnalysis.rawPageSignals.map((signal) => (
                    <li key={signal} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3 backdrop-blur-sm">
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6">
                  <h3 className="text-lg font-semibold text-white">{resultOutputProfile.problemsLabel}</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                    {result.structuredAnalysis.problems.map((problem) => (
                      <li key={problem} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3 backdrop-blur-sm">
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6">
                  <h3 className="text-lg font-semibold text-white">{resultOutputProfile.fixesLabel}</h3>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                    {result.structuredAnalysis.fixes.map((fix, index) => (
                      <li key={fix} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3 backdrop-blur-sm">
                        <span className="mr-2 text-zinc-500">{index + 1}.</span>
                        {fix}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6">
                <h3 className="text-lg font-semibold text-white">Saved report</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Save this analysis so you can reopen it later, keep a history of changes, and compare important iterations side by side.
                </p>
                {!session?.isAuthenticated ? (
                  <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
                    <p className="font-medium">Guest save mode</p>
                    <p className="mt-2 leading-6 text-amber-200/80">
                      Saves now live inside your current browser scope. GitHub login is the next step for true account ownership and cross-device access.
                    </p>
                  </div>
                ) : null}
                <div className="mt-5 space-y-3">
                  <label className="block text-sm text-zinc-300" htmlFor="projectName">
                    Project name (optional)
                  </label>
                  <input
                    id="projectName"
                    list="project-suggestions"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="e.g. laddr blog growth"
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400"
                  />
                  <datalist id="project-suggestions">
                    {projects.map((project) => (
                      <option key={project.id} value={project.name} />
                    ))}
                  </datalist>
                  <p className="text-xs leading-5 text-zinc-500">
                    Use a project to keep related URLs, page histories, and compare flows together.
                  </p>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveReport}
                    disabled={!result || isSaving || Boolean(savedReportId)}
                    className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {savedReportId ? "Run saved" : isSaving ? "Saving..." : "Save manually"}
                  </button>
                  {savedReportId ? (
                    <Link
                      href={`/reports/${savedReportId}`}
                      className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                    >
                      Open saved report
                    </Link>
                  ) : null}
                  {savedReportId && projectName ? (
                    <Link
                      href="/projects"
                      className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                    >
                      Open projects
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6">
                <h3 className="text-lg font-semibold text-white">Detailed scoring breakdown</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Open the full bucket-by-bucket and criterion-by-criterion breakdown when you want the detailed scoring view.
                </p>
                <Link
                  href={`/breakdown?url=${encodeURIComponent(result.analyzedUrl)}&tone=${result.outputTone}&mode=${result.mode}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                >
                  View scoring breakdown
                </Link>
              </div>

              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6">
                <h3 className="text-lg font-semibold text-white">{resultOutputProfile.rewriteLabel}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hero line</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{result.structuredAnalysis.rewrites.hero}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CTA</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{result.structuredAnalysis.rewrites.cta}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {isLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-6 backdrop-blur-sm">
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-md rounded-3xl border border-zinc-800/80 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black/40"
          >
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-400" />
            <h2 className="mt-6 text-2xl font-semibold text-white">Analyzing your page…</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              This can take a little while depending on the page size and extraction steps.
            </p>
            <p className="mt-2 text-xs text-zinc-500">Please wait while we finish the review.</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
