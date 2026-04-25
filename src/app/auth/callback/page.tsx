import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/shared";

import { AuthCallbackClient } from "./callback-client";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string; error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";
  const authError = params.error_description ?? params.error;

  if (authError) {
    return <AuthCallbackClient next={next} authError={authError} />;
  }

  if (!params.code) {
    return <AuthCallbackClient next={next} authError="Missing GitHub authorization code." />;
  }

  const config = getSupabasePublicEnv();
  if (!config) {
    return <AuthCallbackClient next={next} authError="Missing Supabase browser config." />;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot always persist auth cookies here.
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);

  return (
    <AuthCallbackClient
      next={next}
      authError={error?.message}
      accessToken={data.session?.access_token}
    />
  );
}
