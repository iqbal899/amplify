import { Hono } from "hono";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import campaignRoutes from "./routes/campaigns";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    ok: true,
  });
});

app.route("/auth", authRoutes);
app.route("/me", meRoutes);
app.route("/campaigns", campaignRoutes);

export default app;