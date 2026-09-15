import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import * as friendsApi from "../api/friends";

export const useFriends = (page = 1) => {
  const { isAuthenticated } = useAuth();
  // Guards against firing for anonymous visitors — React hooks run before a
  // component's own early-return, so e.g. ChatDock (rendered for every
  // visitor, not just logged-in ones) would otherwise fire this on mount
  // regardless of auth state.
  return useQuery({
    queryKey: ["friends", page],
    queryFn: () => friendsApi.listFriends(page),
    enabled: isAuthenticated,
  });
};
