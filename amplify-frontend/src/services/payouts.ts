import { api } from "./api";

export async function getPayouts(
  token: string
) {
  const response = await api.get(
    "/me/payouts",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}