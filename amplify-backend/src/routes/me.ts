import { Hono } from "hono";

import { authMiddleware } from "../middleware/auth";
import { getMe, updateMe } from "../controllers/me-controller";
import { getMyEnrollments } from "../controllers/me-controller";

const me = new Hono();

me.use("*", authMiddleware);

me.get("/", getMe);

me.patch("/", updateMe);

me.get("/enrollments", getMyEnrollments);

export default me;