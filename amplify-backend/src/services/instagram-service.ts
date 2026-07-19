import { eq } from "drizzle-orm";

import { creators } from "../db/schema/creators";
import { encryptToken } from "../utils/crypto";
import type { Database } from "../db/client";

/**
 * Instagram API with Instagram Login.
 *
 * Flow: the app opens the authorize URL and receives a `code`, then posts that
 * code here. We exchange it server-side (the client secret must never ship in
 * the app bundle), upgrade to a long-lived token, verify the account is a
 * professional one, and store the token encrypted.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 */

const OAUTH_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_BASE = "https://graph.instagram.com";

/** Personal accounts return no insights, so they cannot be paid on views. */
const PROFESSIONAL_ACCOUNT_TYPES = ["BUSINESS", "MEDIA_CREATOR", "CREATOR"];

const LONG_LIVED_TOKEN_TTL_DAYS = 60;

type Env = {
  INSTAGRAM_APP_ID: string;
  INSTAGRAM_APP_SECRET: string;
  TOKEN_ENCRYPTION_KEY: string;
};

type ShortLivedTokenResponse = {
  access_token: string;
  user_id: number | string;
  permissions?: string;
};

type LongLivedTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
};

type InstagramProfile = {
  id?: string;
  user_id?: string;
  username: string;
  account_type?: string;
  profile_picture_url?: string;
};

/** Meta returns errors as 200s in some paths, so parse before trusting status. */
async function readJson(response: Response, context: string) {
  const text = await response.text();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Instagram ${context} returned a non-JSON response (HTTP ${response.status})`
    );
  }

  if (parsed?.error_message || parsed?.error) {
    const message =
      parsed.error_message ??
      parsed.error?.message ??
      "unknown error";
    throw new Error(`Instagram ${context} failed: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Instagram ${context} failed (HTTP ${response.status})`);
  }

  return parsed;
}

async function exchangeCodeForShortLivedToken(
  env: Env,
  code: string,
  redirectUri: string
): Promise<ShortLivedTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.INSTAGRAM_APP_ID,
    client_secret: env.INSTAGRAM_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return readJson(response, "code exchange");
}

async function exchangeForLongLivedToken(
  env: Env,
  shortLivedToken: string
): Promise<LongLivedTokenResponse> {
  const url = new URL(`${GRAPH_BASE}/access_token`);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", env.INSTAGRAM_APP_SECRET);
  url.searchParams.set("access_token", shortLivedToken);

  const response = await fetch(url.toString());

  return readJson(response, "long-lived token exchange");
}

async function fetchProfile(accessToken: string): Promise<InstagramProfile> {
  const url = new URL(`${GRAPH_BASE}/me`);
  url.searchParams.set(
    "fields",
    "id,user_id,username,account_type,profile_picture_url"
  );
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());

  return readJson(response, "profile fetch");
}

/**
 * Full connect flow. Throws with a creator-facing message on any failure —
 * the controller surfaces `error.message` directly.
 */
export async function connectInstagramAccount(
  db: Database,
  env: Env,
  creatorId: number,
  input: { code: string; redirectUri: string }
) {
  const shortLived = await exchangeCodeForShortLivedToken(
    env,
    input.code,
    input.redirectUri
  );

  const longLived = await exchangeForLongLivedToken(
    env,
    shortLived.access_token
  );

  const profile = await fetchProfile(longLived.access_token);

  const accountType = profile.account_type?.toUpperCase();

  // Gate here rather than at enrollment: connecting a personal account would
  // look successful but every later view fetch would come back empty.
  if (accountType && !PROFESSIONAL_ACCOUNT_TYPES.includes(accountType)) {
    throw new Error(
      "This Instagram account is a personal account. Switch it to a Professional (Business or Creator) account in Instagram settings, then connect again."
    );
  }

  const instagramUserId = String(
    profile.user_id ?? profile.id ?? shortLived.user_id
  );

  // Prefer the API's own expiry; fall back to the documented 60 days.
  const expiresInSeconds =
    longLived.expires_in ?? LONG_LIVED_TOKEN_TTL_DAYS * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const encryptedToken = await encryptToken(
    longLived.access_token,
    env.TOKEN_ENCRYPTION_KEY
  );

  const [updated] = await db
    .update(creators)
    .set({
      instagramUserId,
      instagramUsername: profile.username,
      instagramAccessToken: encryptedToken,
      instagramTokenExpiresAt: expiresAt,
      instagramAccountType: accountType ?? null,
      instagramConnectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creatorId))
    .returning({
      id: creators.id,
      instagramUsername: creators.instagramUsername,
      instagramUserId: creators.instagramUserId,
      instagramAccountType: creators.instagramAccountType,
      instagramTokenExpiresAt: creators.instagramTokenExpiresAt,
      instagramConnectedAt: creators.instagramConnectedAt,
    });

  if (!updated) {
    throw new Error("Creator not found");
  }

  return updated;
}

export async function disconnectInstagramAccount(
  db: Database,
  creatorId: number
) {
  const [updated] = await db
    .update(creators)
    .set({
      instagramAccessToken: null,
      instagramTokenExpiresAt: null,
      instagramAccountType: null,
      instagramConnectedAt: null,
      instagramUserId: null,
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creatorId))
    .returning({ id: creators.id });

  if (!updated) {
    throw new Error("Creator not found");
  }

  return { disconnected: true };
}

/**
 * Connection status for the app. Never returns the token itself — only whether
 * it exists and whether it is still usable.
 */
export async function getInstagramStatus(db: Database, creatorId: number) {
  const [creator] = await db
    .select({
      instagramUsername: creators.instagramUsername,
      instagramUserId: creators.instagramUserId,
      instagramAccountType: creators.instagramAccountType,
      instagramTokenExpiresAt: creators.instagramTokenExpiresAt,
      instagramConnectedAt: creators.instagramConnectedAt,
      hasToken: creators.instagramAccessToken,
    })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator) {
    throw new Error("Creator not found");
  }

  const expiresAt = creator.instagramTokenExpiresAt;
  const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;

  return {
    connected: Boolean(creator.hasToken) && !isExpired,
    expired: Boolean(creator.hasToken) && isExpired,
    username: creator.instagramUsername,
    instagramUserId: creator.instagramUserId,
    accountType: creator.instagramAccountType,
    tokenExpiresAt: expiresAt,
    connectedAt: creator.instagramConnectedAt,
  };
}
