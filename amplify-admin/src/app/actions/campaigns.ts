"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, ApiRequestError } from "@/lib/api";
import type { Campaign, Milestone, SettlementResult } from "@/lib/types";

export type ActionState = { error: string } | { ok: string } | null;

function toError(error: unknown): { error: string } {
  if (error instanceof ApiRequestError) {
    return { error: error.message };
  }

  return { error: "Could not reach the API. Is the backend running?" };
}

/**
 * Milestone tiers arrive as JSON from the client editor.
 *
 * `cumulativePayout` is recomputed here rather than trusted: the editor derives
 * it from the increments, but a hand-edited payload could disagree, and the
 * backend pays the cumulative figure. Recomputing means the two can never drift.
 */
function parseMilestones(raw: FormDataEntryValue | null): Milestone[] {
  const tiers = JSON.parse(String(raw ?? "[]")) as Milestone[];

  let runningTotal = 0;

  return [...tiers]
    .sort((a, b) => a.views - b.views)
    .map((tier) => {
      runningTotal += Number(tier.incrementalPayout);

      return {
        views: Number(tier.views),
        minDaysLive: Number(tier.minDaysLive),
        incrementalPayout: Number(tier.incrementalPayout),
        cumulativePayout: runningTotal,
      };
    });
}

function readCampaignForm(formData: FormData) {
  const optional = (field: string) => {
    const value = String(formData.get(field) ?? "").trim();
    return value === "" ? undefined : value;
  };

  const rewardPool = optional("rewardPool");

  return {
    trackName: String(formData.get("trackName") ?? "").trim(),
    artistName: String(formData.get("artistName") ?? "").trim(),
    genre: optional("genre"),
    language: optional("language"),
    description: optional("description"),
    spotifyTrackId: optional("spotifyTrackId"),
    albumArt: optional("albumArt"),
    previewUrl: optional("previewUrl"),
    rewardPool: rewardPool === undefined ? undefined : Number(rewardPool),
    spotsTotal: Number(formData.get("spotsTotal") ?? 0),
    // datetime-local has no timezone; the API expects a real instant, so pin
    // it to the operator's browser offset rather than letting it read as UTC.
    endsAt: new Date(String(formData.get("endsAt") ?? "")).toISOString(),
    milestones: parseMilestones(formData.get("milestones")),
  };
}

export async function createCampaign(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let campaign: Campaign;

  try {
    ({ campaign } = await api.post<{ campaign: Campaign }>(
      "/admin/campaigns",
      readCampaignForm(formData),
    ));
  } catch (error) {
    return toError(error);
  }

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaign(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));

  try {
    await api.patch(`/admin/campaigns/${id}`, readCampaignForm(formData));
  } catch (error) {
    return toError(error);
  }

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");

  return { ok: "Campaign saved" };
}

export async function startCampaign(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));

  try {
    await api.post(`/admin/campaigns/${id}/start`);
  } catch (error) {
    return toError(error);
  }

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");

  return { ok: "Campaign is now open to creators" };
}

/**
 * Ends and settles a campaign.
 *
 * Slow by nature — the backend calls Instagram once per submission — and it
 * cannot be undone, so the UI gates it behind a typed confirmation and must not
 * retry on a slow response.
 */
export async function endCampaign(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));

  let settlement: SettlementResult;

  try {
    ({ settlement } = await api.post<{ settlement: SettlementResult }>(
      `/admin/campaigns/${id}/end`,
    ));
  } catch (error) {
    return toError(error);
  }

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  revalidatePath("/payouts");

  return {
    ok:
      `Settled ${settlement.submissions} submission(s); ` +
      `${settlement.paid} payout(s) written. See Payouts.`,
  };
}
