import { apiFetch, buildQuery } from "./client";
import type { Community } from "../types";

export interface ListCommunitiesParams {
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  category?: string;
}

export interface CreateCommunityInput {
  name: string;
  description?: string;
  category?: string;
  city?: string;
  country?: string;
}

export const listCommunities = (params: ListCommunitiesParams = {}) =>
  apiFetch<Community[]>(`/communities${buildQuery(params)}`);

export const getCommunity = (id: string) => apiFetch<Community>(`/communities/${id}`);

export const createCommunity = (input: CreateCommunityInput) =>
  apiFetch<Community>("/communities", { method: "POST", body: JSON.stringify(input) });

export const joinCommunity = (id: string) =>
  apiFetch<{ joined: boolean }>(`/communities/${id}/join`, { method: "POST" });

export const leaveCommunity = (id: string) =>
  apiFetch<{ joined: boolean }>(`/communities/${id}/join`, { method: "DELETE" });
