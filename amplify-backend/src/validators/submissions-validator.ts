import { z } from "zod";

export const submissionSchema = z.object({
  reelUrl: z.string().url(),

  platform: z.enum([
    "instagram",
    "youtube",
  ]),
});