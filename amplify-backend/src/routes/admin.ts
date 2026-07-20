import { Hono } from "hono";

import { adminMiddleware } from "../middleware/auth";

import {
  adminLogin,
  createCampaign,
  endCampaign,
  getCampaign,
  listCampaigns,
  listPayouts,
  markPayoutFailed,
  markPayoutPaid,
  setCreatorUpiId,
  startCampaign,
  updateCampaign,
} from "../controllers/admin-controller";

import type { AppEnv } from "../types";

const admin = new Hono<AppEnv>();

// The only unguarded route here — it is what issues the admin token.
admin.post("/login", adminLogin);

// adminMiddleware is attached per-route rather than as a `use("/*")` wildcard.
// A wildcard would have to be registered after /login to avoid guarding it,
// which leaves the guard's correctness resting on handler registration order.
// EVERY route added below needs adminMiddleware passed explicitly.
admin.get("/campaigns", adminMiddleware, listCampaigns);
admin.post("/campaigns", adminMiddleware, createCampaign);
admin.get("/campaigns/:id", adminMiddleware, getCampaign);
admin.patch("/campaigns/:id", adminMiddleware, updateCampaign);
admin.post("/campaigns/:id/start", adminMiddleware, startCampaign);
admin.post("/campaigns/:id/end", adminMiddleware, endCampaign);

admin.get("/payouts", adminMiddleware, listPayouts);
admin.post("/payouts/:id/paid", adminMiddleware, markPayoutPaid);
admin.post("/payouts/:id/failed", adminMiddleware, markPayoutFailed);

admin.patch("/creators/:id/upi", adminMiddleware, setCreatorUpiId);

export default admin;
