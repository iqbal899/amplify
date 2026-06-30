import { Hono } from "hono";

import { authMiddleware } from "../middleware/auth";
import { getMe, updateMe } from "../controllers/me-controller";
import { getMyEnrollments } from "../controllers/me-controller";

import { getMySubmissions } from "../controllers/me-controller";

import { getMyPayouts } from "../controllers/me-controller"

const me = new Hono();

me.use("*", authMiddleware);

me.get("/", getMe);

me.patch("/", updateMe);

me.get("/enrollments", getMyEnrollments);

me.get("/submissions", getMySubmissions);

me.get("/payouts", getMyPayouts);

export default me;