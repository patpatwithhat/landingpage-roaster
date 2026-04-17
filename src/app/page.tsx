export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Landingpage Roaster
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Savage, useful landing page feedback in seconds.
            </p>
          </div>
          <a
            href="#analyze"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Go analyze
          </a>
        </header>

        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Goblin-grade website teardown
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Roast your landing page, then fix what actually matters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Paste in a URL and get a sharp audit of clarity, CTA strength,
              trust signals, and SEO basics. Less fluff, more &quot;oh damn,
              yeah, that is broken.&quot;
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                Clarity score
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                CTA analysis
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                SEO quick audit
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
                Goblin verdict
              </span>
            </div>
          </div>

          <div
            id="analyze"
            className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30"
          >
            <div className="mb-6">
              <p className="text-sm font-medium text-zinc-200">Analyze a page</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Start simple. Drop in a homepage URL and let the goblin do its
                work.
              </p>
            </div>
            <form className="flex flex-col gap-4">
              <label className="text-sm text-zinc-300" htmlFor="url">
                Website URL
              </label>
              <input
                id="url"
                type="url"
                placeholder="https://your-site.com"
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400"
              />
              <button
                type="submit"
                className="rounded-2xl bg-emerald-400 px-5 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Go analyze
              </button>
            </form>
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
              Example output: &quot;Your hero sounds expensive, vague, and mildly
              allergic to conversion. Fix the headline, focus the CTA, add proof.&quot;
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">See the problems fast</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Find out whether people understand what you do, who it is for,
              and why they should care in the first few seconds.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Get useful fixes</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Not just roast for the memes. Get practical suggestions for the
              hero copy, CTA, trust signals, and page structure.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Stay lightweight</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Fast homepage-first audits now, deeper crawls and pro features
              later if the thing has legs.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
