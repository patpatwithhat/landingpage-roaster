"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./shared";

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicEnv();

  if (!config) {
    throw new Error("Missing Supabase browser config.");
  }

  return createBrowserClient(config.url, config.publishableKey);
}
