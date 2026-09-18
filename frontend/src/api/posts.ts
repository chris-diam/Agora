import { apiFetch, buildQuery } from "./client";
import type { Comment, Post, PostCategory } from "../types";

export interface ListPostsParams {
  page?: number;
  limit?: number;
  category?: PostCategory | PostCategory[];
  authorId?: string;
  communityId?: string;
}

export interface CreatePostInput {
  content: string;
  category?: PostCategory;
  city?: string;
  country?: string;
  // At most one of these — an uploaded image/video, or an external link
  // (e.g. YouTube) to embed instead.
  mediaFile?: File;
  linkUrl?: string;
  // Set to publish into a community's Discussions tab instead of the
  // general feed — the poster must already be a member.
  communityId?: string;
}

export type UpdatePostInput = Partial<Pick<CreatePostInput, "content" | "category" | "city" | "country">>;

export const listPosts = (params: ListPostsParams = {}) => apiFetch<Post[]>(`/posts${buildQuery(params)}`);

export const getPost = (id: string) => apiFetch<Post>(`/posts/${id}`);

export const createPost = (input: CreatePostInput) => {
  const formData = new FormData();
  formData.append("content", input.content);
  if (input.category) formData.append("category", input.category);
  if (input.city) formData.append("city", input.city);
  if (input.country) formData.append("country", input.country);
  if (input.mediaFile) formData.append("media", input.mediaFile);
  else if (input.linkUrl) formData.append("linkUrl", input.linkUrl);
  if (input.communityId) formData.append("communityId", input.communityId);

  return apiFetch<Post>("/posts", { method: "POST", body: formData });
};

export const updatePost = (id: string, input: UpdatePostInput) =>
  apiFetch<Post>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deletePost = (id: string) => apiFetch<null>(`/posts/${id}`, { method: "DELETE" });

export const likePost = (id: string) => apiFetch<{ liked: boolean }>(`/posts/${id}/like`, { method: "POST" });

export const unlikePost = (id: string) => apiFetch<{ liked: boolean }>(`/posts/${id}/like`, { method: "DELETE" });

export interface ListSavedPostsParams {
  page?: number;
  limit?: number;
}

export const listSavedPosts = (params: ListSavedPostsParams = {}) =>
  apiFetch<Post[]>(`/posts/saved${buildQuery(params)}`);

export const savePost = (id: string) => apiFetch<{ saved: boolean }>(`/posts/${id}/save`, { method: "POST" });

export const unsavePost = (id: string) => apiFetch<{ saved: boolean }>(`/posts/${id}/save`, { method: "DELETE" });

export const getComments = (postId: string, page = 1) =>
  apiFetch<Comment[]>(`/posts/${postId}/comments${buildQuery({ page })}`);

export const createComment = (postId: string, content: string) =>
  apiFetch<Comment>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) });

export const deleteComment = (commentId: string) => apiFetch<null>(`/comments/${commentId}`, { method: "DELETE" });
