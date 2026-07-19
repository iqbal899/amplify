import { api } from "./api";

export interface InstagramConnection {
  connected: boolean;
  expired: boolean;
  username: string | null;
  instagramUserId: string | null;
  accountType: string | null;
  tokenExpiresAt: string | null;
  connectedAt: string | null;
}

export interface ConnectInstagramInput {
  code: string;
  redirectUri: string;
}

/**
 * Sends the OAuth code to our backend, which does the token exchange. The app
 * never handles the client secret or the access token itself.
 */
export async function connectInstagram(data: ConnectInstagramInput) {
  const response = await api.post("/instagram/connect", data);

  return response.data;
}

export async function getInstagramStatus(): Promise<{
  success: boolean;
  instagram: InstagramConnection;
}> {
  const response = await api.get("/instagram/status");

  return response.data;
}

export async function disconnectInstagram() {
  const response = await api.delete("/instagram/disconnect");

  return response.data;
}
