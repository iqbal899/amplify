import { api } from "./api";

export async function getMyEnrollments(
  token: string
) {
  const response = await api.get(
    "/me/enrollments",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}