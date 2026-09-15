import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { getToken, SOCKET_URL } from "../api/client";
import { useAuth } from "./AuthContext";
import type { PostAuthor } from "../types";

interface IncomingNotification {
  actor: PostAuthor;
}

interface IncomingMessage {
  senderId: string;
  sender: PostAuthor;
}

export interface ToastItem {
  id: string;
  message: string;
}

export interface OpenChat {
  userId: string;
  minimized: boolean;
  // Local-only unread count for the minimized bubble's badge — separate
  // from the server-side Message.isRead, which only gets marked once the
  // conversation is actually opened.
  unreadCount: number;
}

interface SocketContextValue {
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  openChats: OpenChat[];
  openChat: (userId: string) => void;
  closeChat: (userId: string) => void;
  toggleMinimizeChat: (userId: string) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 5000;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);

  const dismissToast = (id: string) => setToasts((previous) => previous.filter((toast) => toast.id !== id));

  const pushToast = (message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((previous) => [...previous, { id, message }]);
    setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  };

  const openChat = useCallback((userId: string) => {
    setOpenChats((previous) => {
      const existing = previous.find((chat) => chat.userId === userId);
      if (existing) {
        return previous.map((chat) => (chat.userId === userId ? { ...chat, minimized: false, unreadCount: 0 } : chat));
      }
      return [...previous, { userId, minimized: false, unreadCount: 0 }];
    });
  }, []);

  const closeChat = useCallback((userId: string) => {
    setOpenChats((previous) => previous.filter((chat) => chat.userId !== userId));
  }, []);

  const toggleMinimizeChat = useCallback((userId: string) => {
    setOpenChats((previous) =>
      previous.map((chat) =>
        chat.userId === userId ? { ...chat, minimized: !chat.minimized, unreadCount: 0 } : chat
      )
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setOpenChats([]);
      return;
    }

    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("notification:new", (notification: IncomingNotification) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      pushToast(`${notification.actor.displayName} started following you`);
    });

    socket.on("message:new", (message: IncomingMessage) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      // Pop up a minimized chat bubble for the sender if one isn't already
      // open and focused — mirrors Messenger's "a chat head appears when
      // you get a new message", without stealing focus from what the
      // viewer is doing.
      setOpenChats((previous) => {
        const existing = previous.find((chat) => chat.userId === message.senderId);
        if (existing) {
          if (!existing.minimized) return previous; // already open and focused
          return previous.map((chat) =>
            chat.userId === message.senderId ? { ...chat, unreadCount: chat.unreadCount + 1 } : chat
          );
        }
        return [...previous, { userId: message.senderId, minimized: true, unreadCount: 1 }];
      });

      pushToast(`New message from ${message.sender.displayName}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, queryClient]);

  return (
    <SocketContext.Provider value={{ toasts, dismissToast, openChats, openChat, closeChat, toggleMinimizeChat }}>
      {children}
    </SocketContext.Provider>
  );
}

function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) throw new Error("Socket hooks must be used within a SocketProvider");
  return context;
}

export function useSocketToasts() {
  const { toasts, dismissToast } = useSocketContext();
  return { toasts, dismissToast };
}

export function useChatDock() {
  const { openChats, openChat, closeChat, toggleMinimizeChat } = useSocketContext();
  return { openChats, openChat, closeChat, toggleMinimizeChat };
}
