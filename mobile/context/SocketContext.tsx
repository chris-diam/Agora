import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { apiFetch, SOCKET_URL } from "../lib/api";
import { getAccessToken } from "../lib/authTokens";
import { playMessageSound } from "../lib/notificationSound";
import { useAuth } from "./AuthContext";

interface IncomingMessage {
  senderId: string;
  sender: { displayName: string };
}

export interface IncomingNotification {
  id: string;
  type: "FOLLOW" | "LIKE" | "COMMENT";
  actor: { id: string; displayName: string; profileImageUrl: string | null };
  postId?: string | null;
}

export interface ToastItem {
  id: string;
  text: string;
  actorId: string;
  postId?: string | null;
}

interface SocketContextValue {
  latestMessageFrom: string | null;
  // Exposed (as state, not a ref) so screens — the chat screen in
  // particular — can attach their own "message:new" listener for a
  // specific conversation instead of this context trying to anticipate
  // every screen's needs.
  socket: Socket | null;
  // Drives the Messages tab badge. Re-fetched from the server rather than
  // incremented/decremented locally — opening a conversation marks a whole
  // batch of messages read server-side (see messages.service.ts), so local
  // arithmetic would drift out of sync with the real count almost
  // immediately.
  unreadCount: number;
  refreshUnreadCount: () => void;
  unreadNotificationsCount: number;
  refreshUnreadNotificationsCount: () => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 4000;

const notificationText = (notification: IncomingNotification): string => {
  if (notification.type === "LIKE") return `${notification.actor.displayName} liked your post`;
  if (notification.type === "COMMENT") return `${notification.actor.displayName} commented on your post`;
  return `${notification.actor.displayName} started following you`;
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestMessageFrom, setLatestMessageFrom] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((previous) => [...previous, { ...toast, id }]);
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  const refreshUnreadCount = useCallback(() => {
    if (!isAuthenticated) return;
    apiFetch<{ count: number }>("/messages/unread-count")
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
  }, [isAuthenticated]);

  const refreshUnreadNotificationsCount = useCallback(() => {
    if (!isAuthenticated) return;
    apiFetch<{ count: number }>("/notifications/unread-count")
      .then((data) => setUnreadNotificationsCount(data.count))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setUnreadNotificationsCount(0);
      return;
    }
    refreshUnreadCount();
    refreshUnreadNotificationsCount();
  }, [isAuthenticated, refreshUnreadCount, refreshUnreadNotificationsCount]);

  useEffect(() => {
    if (!isAuthenticated || !getAccessToken()) {
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
      return;
    }

    // Same re-evaluated-per-connection pattern as the web app's
    // SocketContext — `auth` as a function so a reconnect after the
    // access token has rotated still sends the current one.
    const nextSocket = io(SOCKET_URL, { auth: (cb) => cb({ token: getAccessToken() }) });
    setSocket(nextSocket);

    nextSocket.on("message:new", (message: IncomingMessage) => {
      playMessageSound();
      setLatestMessageFrom(message.sender.displayName);
      refreshUnreadCount();
    });

    nextSocket.on("notification:new", (notification: IncomingNotification) => {
      refreshUnreadNotificationsCount();
      pushToast({ text: notificationText(notification), actorId: notification.actor.id, postId: notification.postId });
    });

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, refreshUnreadCount, refreshUnreadNotificationsCount, pushToast]);

  return (
    <SocketContext.Provider
      value={{
        latestMessageFrom,
        socket,
        unreadCount,
        refreshUnreadCount,
        unreadNotificationsCount,
        refreshUnreadNotificationsCount,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
}
