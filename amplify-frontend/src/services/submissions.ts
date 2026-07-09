import { api } from "./api";

export async function submitReel(
  enrollmentId: number,
  reelUrl: string,
  platform: "instagram" | "youtube"
) {
  const response = await api.post(
    `/enrollments/${enrollmentId}/submission`,
    {
      reelUrl,
      platform,
    }
  );

  return response.data;
}