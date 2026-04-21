"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthCallbackClient({
  code,
  next,
  authError,
}: {
  code?: string;
  next: string;
  authError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Connecting GitHub…");

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      let supabase;

      try {
        supabase = createSupabaseBrowserClient();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Missing Supabase browser config.");
        return;
      }

      if (authError) {
        setError(authError);
        return;
      }

      if (!code) {
        setError("Missing GitHub authorization code.");
        return;
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError || !data.session?.access_token) {
        setError(exchangeError?.message ?? "Could not exchange GitHub code for a session.");
        return;
      }

      setStatus("Claiming your guest work…");

      const response = await fetch("/api/auth/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken: data.session.access_token }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not finish account setup.");
        return;
      }

      if (!cancelled) {
        router.replace(next);
        router.refresh();
      }
    }

    void finishLogin();

    return () => {
      cancelled = true;
    };
  }, [authError, code, next, router]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0a0a0a_45%,#050505_100%)] px-6 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-[2rem] border border-zinc-800/80 bg-zinc-900/55 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">GitHub sign-in</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Finishing your session</h1>
          <p className="mt-3 text-sm text-zinc-400">{error ?? status}</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-300">Please wait a second while we connect your GitHub identity and pull your guest work into the account scope.</div>
        )}

        <Link href="/" className="inline-flex w-fit rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
          Back home
        </Link>
      </div>
    </main>
  );
}
