import { apiFetch } from "./client";
import type { CurrentUser } from "../types";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

// Login is a direct browser->Keycloak call (see lib/authTokens.ts), not a
// request to our own backend at all. Registration has no equivalent
// self-service grant, so it goes through our backend (which uses a scoped
// Keycloak service-account client server-side — see
// keycloak-admin.service.ts on the backend).
export const register = (input: RegisterInput) =>
  apiFetch<null>("/auth/register", { method: "POST", body: JSON.stringify(input) });

export const getMe = () => apiFetch<CurrentUser>("/auth/me");
