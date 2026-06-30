import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import {
  getCampaigns,
  getCampaignById,
} from "../controllers/campaigns-controller";

import { enrollCampaignController } from "../controllers/enrollments-controller";

const campaigns = new Hono();

campaigns.get("/", getCampaigns);

campaigns.get("/:id", getCampaignById);

campaigns.post(
  "/:id/enroll",
  authMiddleware,
  enrollCampaignController
);

export default campaigns;