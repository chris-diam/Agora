import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConversation, useSendMessage } from "../hooks/useMessages";
import { useUser } from "../hooks/useUsers";
import { Avatar } from "./Avatar";
import { CloseIcon, MinusIcon } from "./icons";

interface ChatPopupProps {
  userId: string;
  onClose: () => void;
  onMinimize: () => void;
}

export function ChatPopup({ userId, onClose, onMinimize }: ChatPopupProps) {
  const { user } = useAuth();
  const { data: partnerResult } = useUser(userId);
  const { data, isLoading } = useConversation(userId);
  const sendMessage = useSendMessage(userId);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const partner = partnerResult?.data;
  // Backend returns newest-first for pagination; a chat thread reads
  // oldest-at-top, so reverse for display.
  const messages = [...(data?.data ?? [])].reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;
    await sendMessage.mutateAsync(content.trim());
    setContent("");
  };

  return (
    <div className="flex h-96 w-72 flex-col overflow-hidden rounded-t-2xl border border-white/60 bg-white/95 shadow-xl shadow-gray-900/15 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <Link to={`/profile/${userId}`} className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar name={partner?.displayName ?? "?"} imageUrl={partner?.profileImageUrl} size="sm" />
          <span className="truncate text-sm font-medium text-gray-900">{partner?.displayName ?? "..."}</span>
        </Link>
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize"
          className="rounded p-1 text-gray-400 hover:bg-gray-900/5 hover:text-gray-700"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversation"
          className="rounded p-1 text-gray-400 hover:bg-gray-900/5 hover:text-gray-700"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {isLoading && <p className="text-xs text-gray-400">Loading...</p>}
        {!isLoading && messages.length === 0 && <p className="text-xs text-gray-400">Say hello!</p>}
        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                  isMine ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 p-2">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a message..."
          className="w-full rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sendMessage.isPending || !content.trim()}
          className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
