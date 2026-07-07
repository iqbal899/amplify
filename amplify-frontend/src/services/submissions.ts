import { api } from "./api";

export async function submitReel(
  enrollmentId: number,
  token: string,
  reelUrl: string,
  platform: "instagram" | "youtube"
) {
  const response = await api.post(
    `/enrollments/${enrollmentId}/submission`,
    {
      reelUrl,
      platform,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}