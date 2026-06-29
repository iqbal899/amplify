import { Hono } from "hono";

import authRoutes from "./routes/auth";

const app = new Hono();

app.get("/health", (c) => c.text("ok"));

app.route("/auth", authRoutes);

export default app;