import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),

    email: z.email("Invalid email"),

    password: z.string().min(6, "Password must be at least 6 characters"),

    phone: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const updateMeSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    profileImage: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      return value;
    },
    z.string().url().optional()
  ),
    instagramUsername: z.string().optional(),
});