import { api } from "./api";

export async function enrollCampaign(campaignId: number) {
  const response = await api.post(
    `/campaigns/${campaignId}/enroll`
  );

  return response.data;
}

export async function getMyEnrollments() {
  const response = await api.get("/me/enrollments");

  return response.data.enrollments;
}