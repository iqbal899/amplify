import { Hono } from "hono";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import campaignRoutes from "./routes/campaigns";
import enrollmentRoutes from "./routes/enrollments";
import { dbMiddleware } from "./middleware/db";
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

export default app;
