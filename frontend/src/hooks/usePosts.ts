import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import * as postsApi from "../api/posts";

export const usePosts = (params: postsApi.ListPostsParams = {}) =>
  useQuery({ queryKey: ["posts", params], queryFn: () => postsApi.listPosts(params) });

export const usePost = (id: string) =>
  useQuery({ queryKey: ["posts", id], queryFn: () => postsApi.getPost(id), enabled: Boolean(id) });

// Any post mutation can change what following/chronological/interests/local
// feeds show, since a feed is just a filtered, ordered view over posts —
// so every write invalidates both caches rather than trying to patch them.
const invalidatePostLists = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["posts"] });
  queryClient.invalidateQueries({ queryKey: ["feed"] });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: postsApi.CreatePostInput) => postsApi.createPost(input),
    onSuccess: () => invalidatePostLists(queryClient),
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postsApi.deletePost(id),
    onSuccess: () => invalidatePostLists(queryClient),
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? postsApi.unlikePost(id) : postsApi.likePost(id),
    onSuccess: () => invalidatePostLists(queryClient),
  });
};
