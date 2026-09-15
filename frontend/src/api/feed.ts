import { apiFetch, buildQuery } from "./client";
import type { FeedItem } from "../types";

export type FeedType = "following" | "chronological" | "interests" | "local";

export const getFeed = (type: FeedType, page = 1) =>
  apiFetch<FeedItem[]>(`/feed/${type}${buildQuery({ page })}`);
