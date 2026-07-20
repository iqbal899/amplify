import { Context } from "hono";

import {
  adminLoginSchema,
  createCampaignSchema,
  listCampaignsSchema,
  listPayoutsSchema,
  markPaidSchema,
  setUpiIdSchema,
  updateCampaignSchema,
} from "../validators/admin-validator";

import {
  AdminRequestError,
  createCampaign as createCampaignService,
  endCampaign as endCampaignService,
  getCampaign as getCampaignService,
  listCampaigns as listCampaignsService,
  listPayouts as listPayoutsService,
  markPayoutFailed as markPayoutFailedService,
  markPayoutPaid as markPayoutPaidService,
  setCreatorUpiId as setCreatorUpiIdService,
  startCampaign as startCampaignService,
  updateCampaign as updateCampaignService,
} from "../services/admin-service";

import { generateAdminToken } from "../utils/jwt";
import type { AppEnv } from "../types";

/**
 * Length-independent, content-constant-time comparison.
 *
 * The panel is internet-facing and its password is the only thing standing in
 * front of the payout controls, so a naive `===` would leak the password
 * prefix-by-prefix to anyone willing to time the responses.
 */
function secureEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  // Compare lengths without branching out early; an unequal length still walks
  // the full loop below so only the final result differs.
  let mismatch = left.length ^ right.length;

  for (let i = 0; i < left.length; i++) {
    mismatch |= left[i] ^ right[i % right.length];
  }

  return mismatch === 0;
}

function fail(c: Context<AppEnv>, error: unknown) {
  if (error instanceof AdminRequestError) {
    return c.json({ success: false, message: error.message }, error.status);
  }

  console.error(error);

  return c.json({ success: false, message: "Internal Server Error" }, 500);
}

function parseId(value: string | undefined) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AdminRequestError("Invalid id", 400);
  }

  return id;
}

export async function adminLogin(c: Context<AppEnv>) {
  const result = adminLoginSchema.safeParse(await c.req.json().catch(() => ({})));

  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400);
  }

  const expected = c.env.ADMIN_PASSWORD;

  if (!expected) {
    // Mirrors how the Instagram routes report missing configuration: an
    // unset secret is a deployment problem, not a wrong password.
    return c.json(
      { success: false, message: "Admin access is not configured on the server" },
      503
    );
  }

  if (!secureEquals(result.data.password, expected)) {
    return c.json({ success: false, message: "Invalid password" }, 401);
  }

  return c.json({ success: true, token: await generateAdminToken(expected) });
}

export async function listCampaigns(c: Context<AppEnv>) {
  const result = listCampaignsSchema.safeParse(c.req.query());

  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400);
  }

  try {
    return c.json({
      success: true,
      campaigns: await listCampaignsService(c.get("db"), result.data),
    });
  } catch (error) {
    return fail(c, error);
  }
}

export async function getCampaign(c: Context<AppEnv>) {
  try {
    const id = parseId(c.req.param("id"));

    return c.json({
      success: true,
      campaign: await getCampaignService(c.get("db"), id),
    });
  } catch (error) {
    return fail(c, error);
  }
}

export async function createCampaign(c: Context<AppEnv>) {
  const result = createCampaignSchema.safeParse(
    await c.req.json().catch(() => ({}))
  );

  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400);
  }

  try {
    return c.json(
      {
        success: true,
        campaign: await createCampaignService(c.get("db"), result.data),
      },
      201
    );
  } catch (error) {
    return fail(c, error);
  }
}

export async function updateCampaign(c: Context<AppEnv>) {
  const result = updateCampaignSchema.safeParse(
    await c.req.json().catch(() => ({}))
  );

  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400);
  }

  try {
    const id = parseId(c.req.param("id"));

    return c.json({
      success: true,
      campaign: await updateCampaignService(c.get("db"), id, result.data),
    });
  } catch (error) {
    return fail(c, error);
  }
}

export async function startCampaign(c: Context<AppEnv>) {
  try {
    const id = parseId(c.req.param("id"));

    return c.json({
      success: true,
      campaign: await startCampaignService(c.get("db"), id),
    });
  } catch (error) {
    return fail(c, error);
  }
}

/**
 * Ends a campaign and settles it in one request.
 *
 * This calls Instagram once per submission, so it is markedly slower than the
 * other admin routes — the panel should not treat a slow response as a failure
 * and retry, since a second run would re-snapshot every reel.
 */
export async function endCampaign(c: Context<AppEnv>) {
  try {
    const id = parseId(c.req.param("id"));

    return c.json({
      success: true,
      settlement: await endCampaignService(c.get("db"), c.env, id),
    });
  } catch (error) {
    return fail(c, error);
  }
}

export async function listPayouts(c: Context<AppEnv>) {
  const result = listPayoutsSchema.safeParse(c.req.query());

  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400);
  }

  try {
    return c.json({
      success: true,
      payouts: await listPayoutsService(c.get("db"), result.data),
    });
  } catch (error) {
    return fail(c, error);
  }
}

export async function markPayoutPaid(c: Context<AppEnv>) {
  const result = markPaidSchema.safeParse(await c.req.json().catch(() => ({})));

  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400);
  }

  try {
    const id = parseId(c.req.param("id"));

    return c.json({
      success: true,
      payout: await markPayoutPaidService(
        c.get("db"),
        id,
        result.data.upiReference
      ),
    });
  } catch (error) {
    return fail(c, error);
  }
}

export async function markPayoutFailed(c: Context<AppEnv>) {
  try {
    const id = parseId(c.req.param("id"));

    return c.json({
      success: true,
      payout: await markPayoutFailedService(c.get("db"), id),
    });
  } catch (error) {
    return fail(c, error);
  }
}

export async function setCreatorUpiId(c: Context<AppEnv>) {
  const result = setUpiIdSchema.safeParse(await c.req.json().catch(() => ({})));

  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400);
  }

  try {
    const id = parseId(c.req.param("id"));

    return c.json({
      success: true,
      creator: await setCreatorUpiIdService(c.get("db"), id, result.data.upiId),
    });
  } catch (error) {
    return fail(c, error);
  }
}
