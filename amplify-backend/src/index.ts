import { Hono } from "hono";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";

const app = new Hono();

app.get("/health", (c) => c.text("ok"));

app.route("/auth", authRoutes);
app.route("/me", meRoutes);

export default app;