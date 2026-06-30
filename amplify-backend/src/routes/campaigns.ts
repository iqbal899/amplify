import { Hono } from "hono";
import {
  getCampaigns,
  getCampaignById,
} from "../controllers/campaigns-controller";

const campaigns = new Hono();

campaigns.get("/", getCampaigns);

campaigns.get("/:id", getCampaignById);

export default campaigns;