import { apiFetch } from "./client";
import type { Community, PublicUser } from "../types";

export interface SearchResults {
  users: PublicUser[];
  communities: Community[];
}

export const search = (q: string) => apiFetch<SearchResults>(`/search?q=${encodeURIComponent(q)}`);
