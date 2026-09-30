import { apiFetch } from "./client";
import type { CurrentUser } from "../types";

// Login/registration itself happens on Keycloak's hosted pages (see
// AuthContext.tsx / lib/keycloak.ts) — this is the only auth-related call
// left against our own backend, fetching the local profile for whichever
// Keycloak-authenticated user is making the request.
export const getMe = () => apiFetch<CurrentUser>("/auth/me");
