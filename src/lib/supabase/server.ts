export type SupabaseConfig = {
  url: string;
  serviceKey: string;
  anonKey?: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.LPR_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.LPR_SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SECRET_KEY;
  const anonKey = process.env.LPR_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return { url, serviceKey, anonKey };
}

export async function supabaseServiceRequest(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) return null;

  return fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export type SupabaseAuthSettings = {
  external?: {
    github?: boolean;
    [key: string]: boolean | undefined;
  };
};

export async function getSupabaseAuthSettings() {
  const response = await supabaseServiceRequest("/auth/v1/settings");
  if (!response?.ok) {
    return null;
  }

  return (await response.json()) as SupabaseAuthSettings;
}

export async function isGitHubAuthAvailable() {
  const config = getSupabaseConfig();
  if (!config?.anonKey) {
    return { available: false, reason: "Missing Supabase anon key for OAuth browser flow." } as const;
  }

  const settings = await getSupabaseAuthSettings();
  if (!settings?.external?.github) {
    return { available: false, reason: "GitHub provider is not enabled in Supabase Auth." } as const;
  }

  return { available: true, reason: null } as const;
}
