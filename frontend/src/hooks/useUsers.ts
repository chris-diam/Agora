import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users";

export const useUser = (id: string) =>
  useQuery({ queryKey: ["users", id], queryFn: () => usersApi.getUser(id), enabled: Boolean(id) });

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.followUser(id),
    onSuccess: (_result, id) => queryClient.invalidateQueries({ queryKey: ["users", id] }),
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unfollowUser(id),
    onSuccess: (_result, id) => queryClient.invalidateQueries({ queryKey: ["users", id] }),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: usersApi.UpdateProfileInput) => usersApi.updateMe(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: () => {
      // Refresh both the "me" cache (Navbar/Sidebar avatar) and this user's
      // public profile cache (in case their own profile page is open).
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
