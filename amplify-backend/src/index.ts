import { Hono } from "hono";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import campaignRoutes from "./routes/campaigns";
import enrollmentRoutes from "./routes/enrollments";
import instagramRoutes from "./routes/instagram";
import submissionRoutes from "./routes/submissions";
import { dbMiddleware } from "./middleware/db";
import { scheduled } from "./scheduled";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("*", dbMiddleware);

app.get("/health", (c) => {
  return c.json({
    ok: true,
  });
});

app.route("/auth", authRoutes);
app.route("/me", meRoutes);
app.route("/campaigns", campaignRoutes);
app.route("/enrollments", enrollmentRoutes);
app.route("/instagram", instagramRoutes);
app.route("/submissions", submissionRoutes);

// Cron needs a `scheduled` export alongside `fetch`, so the bare Hono app can
// no longer be the default export.
export default {
  fetch: app.fetch,
  scheduled,
};
