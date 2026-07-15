import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import {
  getCampaigns,
  getCampaignById,
} from "../controllers/campaigns-controller";

import { enrollCampaignController } from "../controllers/enrollments-controller";
import type { AppEnv } from "../types";

const campaigns = new Hono<AppEnv>();

campaigns.get("/", getCampaigns);

campaigns.get("/:id", getCampaignById);

campaigns.post("/:id/enroll", authMiddleware, enrollCampaignController);

export default campaigns;