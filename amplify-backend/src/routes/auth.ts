import { Hono } from "hono";
import { register, login } from "../controllers/auth-controller";

const auth = new Hono();

auth.post("/register", register);

auth.post("/login", login);

export default auth;