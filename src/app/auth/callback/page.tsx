import { AuthCallbackClient } from "./callback-client";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string; error?: string; error_description?: string }>;
}) {
  const params = await searchParams;

  return <AuthCallbackClient code={params.code} next={params.next ?? "/"} authError={params.error_description ?? params.error} />;
}
