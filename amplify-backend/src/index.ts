import { Hono } from "hono";
import { cors } from "hono/cors";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import campaignRoutes from "./routes/campaigns";
import enrollmentRoutes from "./routes/enrollments";
import instagramRoutes from "./routes/instagram";
import submissionRoutes from "./routes/submissions";
import adminRoutes from "./routes/admin";
import { dbMiddleware } from "./middleware/db";
import { scheduled } from "./scheduled";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("*", dbMiddleware);

// Scoped to /admin/* deliberately. The creator app is native and needs no CORS;
// widening this to "*" would hand every origin on the internet a preflight pass
// to the creator API for no benefit.
//
// The admin panel does not actually rely on this — it calls the Worker from the
// Next server, not the browser, which is what lets its token stay in an
// httpOnly cookie. This is here for direct browser access during debugging.
app.use(
  "/admin/*",
  cors({
    origin: (origin, c) => {
      // `||` not `??`: an ADMIN_ORIGIN set to "" would otherwise produce [""],
      // which matches Hono's empty-string origin for requests carrying no
      // Origin header at all.
      const configured: string = c.env.ADMIN_ORIGIN || "http://localhost:3000";

      const allowed = configured
        .split(",")
        .map((entry: string) => entry.trim())
        .filter((entry: string) => entry.length > 0);

      return origin && allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
  })
);

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
app.route("/admin", adminRoutes);

// Cron needs a `scheduled` export alongside `fetch`, so the bare Hono app can
// no longer be the default export.
export default {
  fetch: app.fetch,
  scheduled,
};
