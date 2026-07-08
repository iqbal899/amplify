import { api } from "./api";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export async function login(data: LoginInput) {
  const response = await api.post("/auth/login", data);

  return response.data;
}

export async function register(data: RegisterInput) {
  const response = await api.post("/auth/register", data);

  return response.data;
}