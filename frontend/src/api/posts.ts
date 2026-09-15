import { apiFetch, buildQuery } from "./client";
import type { Comment, Post, PostCategory } from "../types";

export interface ListPostsParams {
  page?: number;
  limit?: number;
  category?: PostCategory;
  authorId?: string;
}

export interface CreatePostInput {
  content: string;
  category?: PostCategory;
  city?: string;
  country?: string;
}

export type UpdatePostInput = Partial<CreatePostInput>;

export const listPosts = (params: ListPostsParams = {}) => apiFetch<Post[]>(`/posts${buildQuery(params)}`);

export const getPost = (id: string) => apiFetch<Post>(`/posts/${id}`);

export const createPost = (input: CreatePostInput) =>
  apiFetch<Post>("/posts", { method: "POST", body: JSON.stringify(input) });

export const updatePost = (id: string, input: UpdatePostInput) =>
  apiFetch<Post>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deletePost = (id: string) => apiFetch<null>(`/posts/${id}`, { method: "DELETE" });

export const likePost = (id: string) => apiFetch<{ liked: boolean }>(`/posts/${id}/like`, { method: "POST" });

export const unlikePost = (id: string) => apiFetch<{ liked: boolean }>(`/posts/${id}/like`, { method: "DELETE" });

export const getComments = (postId: string, page = 1) =>
  apiFetch<Comment[]>(`/posts/${postId}/comments${buildQuery({ page })}`);

export const createComment = (postId: string, content: string) =>
  apiFetch<Comment>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) });

export const deleteComment = (commentId: string) => apiFetch<null>(`/comments/${commentId}`, { method: "DELETE" });
