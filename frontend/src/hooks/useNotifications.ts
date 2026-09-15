import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../api/notifications";
import { useAuth } from "../context/AuthContext";

// Sockets push updates instantly (see SocketContext) — this poll is just a
// resilience fallback in case a connection drops silently.
const POLL_INTERVAL_MS = 60_000;

export const useUnreadNotificationCount = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: POLL_INTERVAL_MS,
  });
};

export const useNotifications = (page: number, enabled: boolean) =>
  useQuery({
    queryKey: ["notifications", "list", page],
    queryFn: () => notificationsApi.listNotifications(page),
    enabled,
  });

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
