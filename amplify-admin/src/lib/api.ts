import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "./session";

export { SESSION_COOKIE };

const API_URL = process.env.AMPLIFY_API_URL ?? "http://127.0.0.1:8787";

/**
 * The API's two failure shapes.
 *
 * Zod rejections come back as `{ success: false, errors: [...] }` and
 * everything else as `{ success: false, message }`, so a caller that only reads
 * `message` silently shows "undefined" for every validation failure — which is
 * exactly the case an operator most needs to read.
 */
type ApiError = {
  success: false;
  message?: string;
  errors?: { path?: (string | number)[]; message: string }[];
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function readError(body: ApiError, status: number): string {
  if (body.errors?.length) {
    return body.errors
      .map((issue) => {
        const path = issue.path?.filter((part) => part !== "").join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");
  }

  return body.message ?? `Request failed (${status})`;
}

/**
 * Calls the Worker from the Next server, never the browser.
 *
 * The admin token lives in an httpOnly cookie, so it is not reachable from
 * client JavaScript — which matters more than usual here, since that token can
 * read every creator's contact details and change where their payout is sent.
 */
async function request<T>(
  path: string,
  init: RequestInit & { authenticated?: boolean } = {},
): Promise<T> {
  const { authenticated = true, ...options } = init;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;

    if (!token) {
      throw new ApiRequestError("Not signed in", 401);
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    // Admin screens must never show a stale payout or campaign state; every
    // read reflects the database at the moment the page was requested.
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}) as ApiError);

  if (!response.ok) {
    throw new ApiRequestError(
      readError(body as ApiError, response.status),
      response.status,
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),

  patch: <T>(path: string, payload: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(payload) }),

  login: (password: string) =>
    request<{ success: true; token: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
      authenticated: false,
    }),
};
