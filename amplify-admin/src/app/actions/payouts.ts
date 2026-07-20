"use server";

import { revalidatePath } from "next/cache";

import { api, ApiRequestError } from "@/lib/api";

export type ActionState = { error: string } | { ok: string } | null;

function toError(error: unknown): { error: string } {
  if (error instanceof ApiRequestError) {
    return { error: error.message };
  }

  return { error: "Could not reach the API. Is the backend running?" };
}

/**
 * Records a transfer the operator has already made by hand.
 *
 * This moves no money — it is bookkeeping after the fact. The backend rejects a
 * second attempt on an already-paid row, so two operators working the same list
 * cannot overwrite each other's reference.
 */
export async function markPayoutPaid(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const upiReference = String(formData.get("upiReference") ?? "").trim();

  if (!upiReference) {
    return { error: "Enter the UPI transaction reference" };
  }

  try {
    await api.post(`/admin/payouts/${id}/paid`, { upiReference });
  } catch (error) {
    return toError(error);
  }

  revalidatePath("/payouts");

  return { ok: `Payout #${id} marked paid` };
}

export async function markPayoutFailed(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));

  try {
    await api.post(`/admin/payouts/${id}/failed`);
  } catch (error) {
    return toError(error);
  }

  revalidatePath("/payouts");

  // Worth saying explicitly: operators expect "failed" to be final elsewhere.
  return { ok: `Payout #${id} marked failed. It can still be paid later.` };
}

export async function setCreatorUpiId(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const creatorId = Number(formData.get("creatorId"));
  const upiId = String(formData.get("upiId") ?? "").trim();

  if (!upiId) {
    return { error: "Enter a UPI id" };
  }

  try {
    await api.patch(`/admin/creators/${creatorId}/upi`, { upiId });
  } catch (error) {
    return toError(error);
  }

  revalidatePath("/payouts");

  return { ok: "UPI id saved" };
}
