import { apiFetch } from "./client";
import type { CurrentUser, PublicUser } from "../types";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  user: PublicUser;
  token: string;
}

export const register = (input: RegisterInput) =>
  apiFetch<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify(input) });

export const login = (input: LoginInput) =>
  apiFetch<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify(input) });

export const getMe = () => apiFetch<CurrentUser>("/auth/me");

// credential is the GIS ID-token JWT string — verified server-side.
export const googleLogin = (credential: string) =>
  apiFetch<AuthResult>("/auth/google", { method: "POST", body: JSON.stringify({ credential }) });
