/**
 * Deliberately dependency-free.
 *
 * `proxy.ts` needs this name, and importing it from `lib/api` would drag that
 * module's `server-only` marker and `next/headers` import into the proxy
 * bundle, which does not run in that environment.
 */
export const SESSION_COOKIE = "amplify_admin_session";
