import { Hono } from "hono";
import { register, login } from "../controllers/auth-controller";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

auth.post("/register", register);

auth.post("/login", login);

export default auth;