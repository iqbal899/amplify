"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api, ApiRequestError, SESSION_COOKIE } from "@/lib/api";

export type ActionState = { error: string } | null;

export async function login(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Enter the admin password" };
  }

  let token: string;

  try {
    ({ token } = await api.login(password));
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { error: error.message };
    }

    // A connection refused here means the Worker is down, which looks
    // identical to a wrong password unless it is called out.
    return { error: "Could not reach the API. Is the backend running?" };
  }

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Matches the token's own 12h expiry. A cookie outliving the token would
    // leave the app looking signed in while every request 401s.
    maxAge: 60 * 60 * 12,
  });

  redirect("/campaigns");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
