import { Avatar } from "../components/Avatar";
import { useChatDock } from "../context/SocketContext";
import { useConversations } from "../hooks/useMessages";

export function MessagesPage() {
  const { openChat } = useChatDock();
  const { data, isLoading, isError } = useConversations();
  const conversations = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-agora-text">Messages</h1>

      {isLoading && <p className="text-agora-muted">Loading conversations...</p>}
      {isError && <p className="text-red-500">Could not load conversations.</p>}
      {!isLoading && !isError && conversations.length === 0 && (
        <p className="text-agora-muted">No conversations yet — message a friend from your Friends list.</p>
      )}

      <div className="flex flex-col gap-2">
        {conversations.map(({ partner, lastMessage, unreadCount }) => (
          <button
            key={partner.id}
            type="button"
            onClick={() => openChat(partner.id)}
            className="flex items-center gap-3 rounded-2xl border border-agora-border bg-agora-surface/80 p-4 text-left shadow-sm shadow-black/20 backdrop-blur-xl hover:bg-agora-surface/90"
          >
            <Avatar name={partner.displayName} imageUrl={partner.profileImageUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-agora-text">{partner.displayName}</p>
              <p className="truncate text-sm text-agora-muted">{lastMessage ? lastMessage.content : "Say hello!"}</p>
            </div>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
