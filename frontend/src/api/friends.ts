import { apiFetch, buildQuery } from "./client";
import type { PublicUser } from "../types";

export const listFriends = (page = 1) => apiFetch<PublicUser[]>(`/friends${buildQuery({ page })}`);
