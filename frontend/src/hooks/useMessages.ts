import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import * as messagesApi from "../api/messages";

export const useConversations = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => messagesApi.listConversations(),
    enabled: isAuthenticated,
  });
};

export const useUnreadMessageCount = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: () => messagesApi.getUnreadCount(),
    enabled: isAuthenticated,
    // Sockets push updates instantly (see SocketContext) — this is just a
    // resilience fallback in case a connection drops silently.
    refetchInterval: 60_000,
  });
};

export const useConversation = (userId: string, page = 1) =>
  useQuery({
    queryKey: ["messages", "conversation", userId, page],
    queryFn: () => messagesApi.getConversation(userId, page),
    enabled: Boolean(userId),
  });

export const useSendMessage = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => messagesApi.sendMessage(userId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};
