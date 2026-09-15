import { Avatar } from "../components/Avatar";
import { useChatDock } from "../context/SocketContext";
import { useConversations } from "../hooks/useMessages";

export function MessagesPage() {
  const { openChat } = useChatDock();
  const { data, isLoading, isError } = useConversations();
  const conversations = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Messages</h1>

      {isLoading && <p className="text-gray-500">Loading conversations...</p>}
      {isError && <p className="text-red-500">Could not load conversations.</p>}
      {!isLoading && !isError && conversations.length === 0 && (
        <p className="text-gray-500">No conversations yet — message a friend from your Friends list.</p>
      )}

      <div className="flex flex-col gap-2">
        {conversations.map(({ partner, lastMessage, unreadCount }) => (
          <button
            key={partner.id}
            type="button"
            onClick={() => openChat(partner.id)}
            className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 text-left shadow-sm shadow-gray-900/5 backdrop-blur-xl hover:bg-white/90"
          >
            <Avatar name={partner.displayName} imageUrl={partner.profileImageUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{partner.displayName}</p>
              <p className="truncate text-sm text-gray-500">{lastMessage ? lastMessage.content : "Say hello!"}</p>
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
