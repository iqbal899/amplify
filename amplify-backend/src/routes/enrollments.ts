import { Hono } from "hono";

import { authMiddleware } from "../middleware/auth";
import { submitReel } from "../controllers/submissions-controller";

const enrollments = new Hono();

enrollments.use("*", authMiddleware);

enrollments.post("/:id/submission", submitReel);

export default enrollments;