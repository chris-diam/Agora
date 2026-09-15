import { apiFetch, buildQuery } from "./client";
import type { PublicUser, UserProfile } from "../types";

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  city?: string;
  country?: string;
  profileImageUrl?: string;
}

export const getUser = (id: string) => apiFetch<UserProfile>(`/users/${id}`);

export const updateMe = (input: UpdateProfileInput) =>
  apiFetch<PublicUser>("/users/me", { method: "PATCH", body: JSON.stringify(input) });

export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiFetch<PublicUser>("/users/me/avatar", { method: "POST", body: formData });
};

export const followUser = (id: string) =>
  apiFetch<{ following: boolean }>(`/users/${id}/follow`, { method: "POST" });

export const unfollowUser = (id: string) =>
  apiFetch<{ following: boolean }>(`/users/${id}/follow`, { method: "DELETE" });

export const getFollowers = (id: string, page = 1) =>
  apiFetch<PublicUser[]>(`/users/${id}/followers${buildQuery({ page })}`);

export const getFollowing = (id: string, page = 1) =>
  apiFetch<PublicUser[]>(`/users/${id}/following${buildQuery({ page })}`);
