import { api } from "./api";

export async function getCampaigns() {
  const response = await api.get("/campaigns");

  return response.data;
}

export async function getCampaign(id: number) {
  const response = await api.get(`/campaigns/${id}`);

  return response.data;
}

export async function enrollCampaign(id: number, token: string) {
  const response = await api.post(
    `/campaigns/${id}/enroll`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}