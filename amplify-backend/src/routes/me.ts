import { Hono } from "hono";

import { authMiddleware } from "../middleware/auth";
import { getMe, updateMe } from "../controllers/me-controller";

const me = new Hono();

me.use("*", authMiddleware);

me.get("/", getMe);

me.patch("/", updateMe);

export default me;