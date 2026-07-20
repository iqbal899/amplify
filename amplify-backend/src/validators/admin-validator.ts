import { z } from "zod";

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

/**
 * One milestone tier.
 *
 * Validated strictly because this is author-entered JSON that decides what
 * people get paid. A typo here is a wrong payout, and the evaluator trusts
 * whatever it is handed — it sorts the tiers but does not sanity-check them.
 */
const milestoneSchema = z.object({
  views: z.number().int().positive(),
  minDaysLive: z.number().int().min(0),
  incrementalPayout: z.number().nonnegative(),
  cumulativePayout: z.number().nonnegative(),
});

/**
 * Tiers must be internally consistent: sorted by views, each cumulative figure
 * equal to the running total of the increments. The settlement path pays
 * `cumulativePayout` and ignores `incrementalPayout` entirely, so a mismatch
 * between the two is silent in production and only visible here.
 */
const milestonesSchema = z
  .array(milestoneSchema)
  .min(1)
  .superRefine((tiers, ctx) => {
    const ordered = [...tiers].sort((a, b) => a.views - b.views);

    let runningTotal = 0;

    for (const [index, tier] of ordered.entries()) {
      runningTotal += tier.incrementalPayout;

      if (tier.cumulativePayout !== runningTotal) {
        ctx.addIssue({
          code: "custom",
          path: [index, "cumulativePayout"],
          message:
            `cumulativePayout ${tier.cumulativePayout} does not match the ` +
            `running total of incrementalPayout (${runningTotal}) at ${tier.views} views`,
        });
      }
    }

    const viewTargets = ordered.map((tier) => tier.views);

    if (new Set(viewTargets).size !== viewTargets.length) {
      ctx.addIssue({
        code: "custom",
        message: "two milestones share the same view target",
      });
    }
  });

export const createCampaignSchema = z.object({
  trackName: z.string().trim().min(1).max(255),
  artistName: z.string().trim().min(1).max(255),
  spotifyTrackId: z.string().trim().max(255).optional(),
  genre: z.string().trim().max(100).optional(),
  language: z.string().trim().max(100).optional(),
  albumArt: z.string().trim().optional(),
  previewUrl: z.string().trim().optional(),
  description: z.string().trim().optional(),
  rewardPool: z.number().nonnegative().optional(),
  spotsTotal: z.number().int().positive(),
  endsAt: z.coerce.date(),
  milestones: milestonesSchema,
});

// Every field optional, but the same shape rules apply to whatever is sent.
export const updateCampaignSchema = createCampaignSchema.partial();

export const listCampaignsSchema = z.object({
  status: z.enum(["draft", "open", "full", "closed"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const listPayoutsSchema = z.object({
  status: z.enum(["pending", "paid", "failed"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const markPaidSchema = z.object({
  upiReference: z.string().trim().min(1).max(100),
});

export const setUpiIdSchema = z.object({
  upiId: z.string().trim().min(1).max(255),
});
