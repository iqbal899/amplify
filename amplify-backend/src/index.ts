import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.text("ok-health");
});

export default app;