import { api } from "./api";

export async function login(
  email: string,
  password: string
) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const response = await api.post(
    "/auth/register",
    data
  );

  return response.data;
}

export async function getProfile(token: string) {
  const response = await api.get("/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}