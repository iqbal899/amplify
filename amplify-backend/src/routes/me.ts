import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import {
  getMe,
  updateMe,
  getMyEnrollments,
  getMySubmissions,
  getMyPayouts,
} from "../controllers/me-controller";

import type { AppEnv } from "../types";

const me = new Hono<AppEnv>();

me.use("*", authMiddleware);

me.get("/", getMe);
me.patch("/", updateMe);
me.get("/enrollments", getMyEnrollments);
me.get("/submissions", getMySubmissions);
me.get("/payouts", getMyPayouts);

export default me;