import { createDb } from "./db/client";
import { pollAllSubmissions, settleDueCampaigns } from "./services/tracking-service";
import type { AppEnv } from "./types";

type Env = AppEnv["Bindings"];

/**
 * Cron entrypoint.
 *
 * Two jobs on different cadences:
 *
 *  - settlement runs often, because a campaign must be closed promptly after
 *    its deadline; the final reading is what everyone gets paid against.
 *  - polling runs hourly. Nobody is paid on five-minute granularity, and each
 *    submission costs an API call.
 *
 * `scheduled()` gets no Hono context, so unlike the request path it has to
 * build and tear down its own connection.
 */
export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const { db, pool } = createDb(env.DATABASE_URL);

  try {
    // Settlement first: a campaign that just ended should be settled with this
    // run's fresh reading rather than waiting for the next poll.
    const settled = await settleDueCampaigns(db, env);

    if (settled.length) {
      console.log("[cron] settled campaigns", JSON.stringify(settled));
    }

    // cron is "*/15 * * * *"; only poll on the hour to keep it hourly.
    const isHourlyTick = new Date(controller.scheduledTime).getUTCMinutes() < 15;

    if (isHourlyTick) {
      const polled = await pollAllSubmissions(db, env);
      console.log("[cron] polled submissions", JSON.stringify(polled));
    }
  } catch (error) {
    // Rethrow so the failure is visible in Workers logs rather than silently
    // succeeding.
    console.error("[cron] run failed", error);
    throw error;
  } finally {
    ctx.waitUntil(pool.end());
  }
}
