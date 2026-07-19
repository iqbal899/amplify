import { z } from "zod";

export const connectInstagramSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),

  // Must match the redirect_uri the app used for the authorize call, or Meta
  // rejects the exchange. The app sends back whatever makeRedirectUri produced.
  redirectUri: z.string().min(1, "redirectUri is required"),
});
