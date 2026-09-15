import { apiFetch, buildQuery } from "./client";
import type { PostAuthor } from "../types";

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: PostAuthor;
}

export interface ConversationSummary {
  partner: PostAuthor;
  lastMessage: DirectMessage | null;
  unreadCount: number;
}

export const listConversations = () => apiFetch<ConversationSummary[]>("/messages");

export const getUnreadCount = () => apiFetch<{ count: number }>("/messages/unread-count");

export const getConversation = (userId: string, page = 1) =>
  apiFetch<DirectMessage[]>(`/messages/${userId}${buildQuery({ page })}`);

export const sendMessage = (userId: string, content: string) =>
  apiFetch<DirectMessage>(`/messages/${userId}`, { method: "POST", body: JSON.stringify({ content }) });
