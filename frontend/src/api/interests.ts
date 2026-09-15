import { apiFetch } from "./client";
import type { Interest } from "../types";

export const listInterests = () => apiFetch<Interest[]>("/interests");

export const setMyInterests = (interestIds: string[]) =>
  apiFetch<Interest[]>("/users/me/interests", { method: "PATCH", body: JSON.stringify({ interestIds }) });
