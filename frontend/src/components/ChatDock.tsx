import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChatDock } from "../context/SocketContext";
import { useFriends } from "../hooks/useFriends";
import { useUser } from "../hooks/useUsers";
import { Avatar } from "./Avatar";
import { ChatPopup } from "./ChatPopup";
import { PencilIcon } from "./icons";

// A floating chat dock in the bottom-right corner, inspired by (but
// deliberately not a copy of) Messenger's chat heads: minimized
// conversations collapse into small avatar bubbles, new incoming messages
// pop a bubble up automatically, and a compose button opens a friend
// picker to start a new one.
export function ChatDock() {
  const { isAuthenticated } = useAuth();
  const { openChats, openChat, closeChat, toggleMinimizeChat } = useChatDock();
  const { data: friendsResult } = useFriends();
  const [showPicker, setShowPicker] = useState(false);

  if (!isAuthenticated) return null;

  const friends = friendsResult?.data ?? [];
  const minimized = openChats.filter((chat) => chat.minimized);
  const expanded = openChats.filter((chat) => !chat.minimized);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-2rem)] items-end gap-3">
      {/* Multiple simultaneously-open chats can be wider than a phone
          screen — this row scrolls horizontally instead of pushing earlier
          chats off past the viewport edge. */}
      <div className="flex items-end gap-3 overflow-x-auto">
        {expanded.map((chat) => (
          <ChatPopup
            key={chat.userId}
            userId={chat.userId}
            onClose={() => closeChat(chat.userId)}
            onMinimize={() => toggleMinimizeChat(chat.userId)}
          />
        ))}
      </div>

      <div className="flex flex-col-reverse items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((value) => !value)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-agora text-agora-on shadow-lg shadow-black/30 hover:bg-agora-hover"
            aria-label="New chat"
          >
            <PencilIcon className="h-5 w-5" />
          </button>

          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div className="absolute right-0 bottom-full z-50 mb-2 w-64 overflow-hidden rounded-2xl border border-agora-border bg-agora-surface/95 shadow-lg shadow-black/30 backdrop-blur-xl">
                <p className="border-b border-agora-border px-4 py-2 text-xs font-semibold tracking-wide text-agora-dim uppercase">
                  Start a chat
                </p>
                <div className="max-h-72 overflow-y-auto">
                  {friends.length === 0 && (
                    <p className="px-4 py-3 text-sm text-agora-dim">
                      No friends yet — a friend is anyone you follow who follows you back.
                    </p>
                  )}
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => {
                        openChat(friend.id);
                        setShowPicker(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-white/5"
                    >
                      <Avatar name={friend.displayName} imageUrl={friend.profileImageUrl} size="sm" />
                      {friend.displayName}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {minimized.map((chat) => (
          <MinimizedBubble
            key={chat.userId}
            userId={chat.userId}
            unreadCount={chat.unreadCount}
            onClick={() => toggleMinimizeChat(chat.userId)}
          />
        ))}
      </div>
    </div>
  );
}

function MinimizedBubble({
  userId,
  unreadCount,
  onClick,
}: {
  userId: string;
  unreadCount: number;
  onClick: () => void;
}) {
  const { data } = useUser(userId);
  const partner = data?.data;

  return (
    <button type="button" onClick={onClick} className="relative" aria-label={`Open chat with ${partner?.displayName ?? "conversation"}`}>
      <Avatar name={partner?.displayName ?? "?"} imageUrl={partner?.profileImageUrl} size="md" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
