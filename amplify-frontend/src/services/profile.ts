import { api } from "./api";

export async function getProfile() {
  const response = await api.get("/me");
  return response.data.creator;
}

export async function updateProfile(data: {
  name?: string;
  phone?: string;
  instagramUsername?: string;
  profileImage?: string;
}) {
  const response = await api.patch("/me", data);
  return response.data.creator;
}