import { cookies } from "next/headers";

export const ANONYMOUS_SESSION_COOKIE = "lpr-anon-session";
export const USER_ID_COOKIE = "lpr-user-id";
export const USER_NAME_COOKIE = "lpr-user-name";

export type OwnerContext =
  | {
      ownerType: "anonymous";
      ownerId: string;
      isAuthenticated: false;
      displayName: "Guest";
    }
  | {
      ownerType: "user";
      ownerId: string;
      isAuthenticated: true;
      displayName: string;
    };

export function createAnonymousSessionId() {
  return crypto.randomUUID();
}

export async function getOwnerContext(): Promise<OwnerContext> {
  const store = await cookies();
  const userId = store.get(USER_ID_COOKIE)?.value?.trim();

  if (userId) {
    const displayName = store.get(USER_NAME_COOKIE)?.value?.trim() || "GitHub user";
    return {
      ownerType: "user",
      ownerId: userId,
      isAuthenticated: true,
      displayName,
    };
  }

  const anonymousSessionId = store.get(ANONYMOUS_SESSION_COOKIE)?.value?.trim();
  return {
    ownerType: "anonymous",
    ownerId: anonymousSessionId || createAnonymousSessionId(),
    isAuthenticated: false,
    displayName: "Guest",
  };
}

export function getScopedPath(owner: OwnerContext, resource: "reports" | "projects") {
  return `owners/${owner.ownerType}/${owner.ownerId}/${resource}`;
}
