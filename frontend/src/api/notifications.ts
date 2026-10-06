import { apiFetch, buildQuery } from "./client";
import type { PostAuthor } from "../types";

export type NotificationType = "FOLLOW" | "LIKE" | "COMMENT";

export interface Notification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: PostAuthor;
  // Only set for LIKE/COMMENT — the post that was liked/commented on.
  postId: string | null;
  // Only meaningful for FOLLOW.
  followingBack: boolean;
}

export const listNotifications = (page = 1) => apiFetch<Notification[]>(`/notifications${buildQuery({ page })}`);

export const getUnreadCount = () => apiFetch<{ count: number }>("/notifications/unread-count");

export const markAllRead = () => apiFetch<null>("/notifications/read-all", { method: "POST" });
