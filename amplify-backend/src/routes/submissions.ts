import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import {
  refreshSubmissionViews,
  getSubmissionSnapshots,
} from "../controllers/submissions-controller";

import type { AppEnv } from "../types";

const submissions = new Hono<AppEnv>();

submissions.use("*", authMiddleware);

submissions.post("/:id/refresh-views", refreshSubmissionViews);
submissions.get("/:id/snapshots", getSubmissionSnapshots);

export default submissions;
