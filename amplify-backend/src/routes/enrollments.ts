import { Hono } from "hono";

import { authMiddleware } from "../middleware/auth";
import { submitReel } from "../controllers/submissions-controller";
import type { AppEnv } from "../types";

const enrollments = new Hono<AppEnv>();

enrollments.use("*", authMiddleware);

enrollments.post("/:id/submission", submitReel);

export default enrollments;