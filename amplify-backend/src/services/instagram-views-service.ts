import { eq } from "drizzle-orm";

import { creators } from "../db/schema/creators";
import { decryptToken, encryptToken } from "../utils/crypto";
import type { Database } from "../db/client";

/**
 * Reading view counts from the Instagram Graph API.
 *
 * Insights are addressed by media id and are only readable for media owned by
 * the authenticated account, so every call needs that creator's token.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/
 */

const GRAPH_BASE = "https://graph.instagram.com";

export class InstagramTokenExpiredError extends Error {
  constructor(message = "Instagram connection expired") {
    super(message);
    this.name = "InstagramTokenExpiredError";
  }
}

export class InstagramMediaUnavailableError extends Error {
  constructor(message = "Reel is no longer available on Instagram") {
    super(message);
    this.name = "InstagramMediaUnavailableError";
  }
}

type GraphError = {
  message?: string;
  code?: number;
  error_subcode?: number;
};

async function graphRequest(url: string, context: string): Promise<any> {
  const response = await fetch(url);
  const text = await response.text();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Instagram ${context} returned a non-JSON response (HTTP ${response.status})`
    );
  }

  const error: GraphError | undefined = parsed?.error;

  if (error) {
    // 190 = token invalidated/expired. 100 with subcode 33 = object not
    // visible, which is what a deleted reel or a flipped-to-private account
    // looks like. Both need distinct handling upstream.
    if (error.code === 190) {
      throw new InstagramTokenExpiredError(
        error.message ?? "Instagram connection expired"
      );
    }

    if (error.code === 100 || error.code === 24) {
      throw new InstagramMediaUnavailableError(
        error.message ?? "Reel is no longer available"
      );
    }

    throw new Error(`Instagram ${context} failed: ${error.message ?? "unknown"}`);
  }

  if (!response.ok) {
    throw new Error(`Instagram ${context} failed (HTTP ${response.status})`);
  }

  return parsed;
}

/**
 * Instagram reel URLs look like https://www.instagram.com/reel/<shortcode>/.
 * The shortcode is not the media id, and there is no public endpoint to convert
 * one to the other — so we list the creator's own media and match on permalink.
 */
export function extractShortcode(reelUrl: string): string | null {
  const match = reelUrl.match(
    /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/
  );
  return match ? match[1] : null;
}

export type ResolvedMedia = {
  mediaId: string;
  permalink: string;
  timestamp: string | null;
  mediaType: string | null;
};

/**
 * Finds the media id for a reel URL by paging the creator's media.
 *
 * Returns null when the reel is not in their media list at all, which usually
 * means they submitted someone else's reel.
 */
export async function resolveMediaId(
  accessToken: string,
  reelUrl: string,
  maxPages = 5
): Promise<ResolvedMedia | null> {
  const shortcode = extractShortcode(reelUrl);

  if (!shortcode) {
    return null;
  }

  let url: string | null = (() => {
    const u = new URL(`${GRAPH_BASE}/me/media`);
    u.searchParams.set("fields", "id,permalink,timestamp,media_type");
    u.searchParams.set("limit", "50");
    u.searchParams.set("access_token", accessToken);
    return u.toString();
  })();

  for (let page = 0; page < maxPages && url; page++) {
    const data = await graphRequest(url, "media list");

    for (const item of data?.data ?? []) {
      if (typeof item?.permalink === "string" && item.permalink.includes(shortcode)) {
        return {
          mediaId: String(item.id),
          permalink: item.permalink,
          timestamp: item.timestamp ?? null,
          mediaType: item.media_type ?? null,
        };
      }
    }

    url = data?.paging?.next ?? null;
  }

  return null;
}

export type MediaInsights = {
  views: number;
  reach: number | null;
};

/**
 * `views` is the current metric for reels — it replaced `plays`, and
 * `video_views` was removed on 2025-01-08.
 */
export async function fetchMediaInsights(
  accessToken: string,
  mediaId: string
): Promise<MediaInsights> {
  const url = new URL(`${GRAPH_BASE}/${mediaId}/insights`);
  url.searchParams.set("metric", "views,reach");
  url.searchParams.set("access_token", accessToken);

  const data = await graphRequest(url.toString(), "media insights");

  const byName = new Map<string, number>();

  for (const entry of data?.data ?? []) {
    const value = entry?.values?.[0]?.value;
    if (typeof value === "number") {
      byName.set(entry.name, value);
    }
  }

  const views = byName.get("views");

  if (typeof views !== "number") {
    throw new Error("Instagram did not return a views metric for this reel");
  }

  return {
    views,
    reach: byName.get("reach") ?? null,
  };
}

/**
 * Loads and decrypts a creator's token, refusing if it has expired. Callers
 * should treat a throw here as "this creator needs to reconnect".
 */
export async function getCreatorAccessToken(
  db: Database,
  encryptionKey: string,
  creatorId: number
): Promise<string> {
  const [creator] = await db
    .select({
      token: creators.instagramAccessToken,
      expiresAt: creators.instagramTokenExpiresAt,
    })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator?.token) {
    throw new InstagramTokenExpiredError("Instagram is not connected");
  }

  if (creator.expiresAt && creator.expiresAt.getTime() <= Date.now()) {
    throw new InstagramTokenExpiredError();
  }

  return decryptToken(creator.token, encryptionKey);
}

/**
 * Long-lived tokens last 60 days and can be refreshed once they are at least a
 * day old. Without this a creator silently goes dark two months after
 * connecting, mid-campaign.
 */
export async function refreshCreatorToken(
  db: Database,
  encryptionKey: string,
  creatorId: number
): Promise<Date> {
  const token = await getCreatorAccessToken(db, encryptionKey, creatorId);

  const url = new URL(`${GRAPH_BASE}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);

  const data = await graphRequest(url.toString(), "token refresh");

  const expiresAt = new Date(
    Date.now() + (data?.expires_in ?? 60 * 24 * 60 * 60) * 1000
  );

  await db
    .update(creators)
    .set({
      instagramAccessToken: await encryptToken(data.access_token, encryptionKey),
      instagramTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creatorId));

  return expiresAt;
}
