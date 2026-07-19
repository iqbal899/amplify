import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import {
  connectInstagram,
  disconnectInstagram,
  instagramStatus,
} from "../controllers/instagram-controller";

import type { AppEnv } from "../types";

const instagram = new Hono<AppEnv>();

instagram.use("*", authMiddleware);

instagram.get("/status", instagramStatus);
instagram.post("/connect", connectInstagram);
instagram.delete("/disconnect", disconnectInstagram);

export default instagram;
