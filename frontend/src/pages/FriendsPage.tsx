import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Pagination } from "../components/Pagination";
import { useChatDock } from "../context/SocketContext";
import { useFriends } from "../hooks/useFriends";

export function FriendsPage() {
  const [page, setPage] = useState(1);
  const { openChat } = useChatDock();
  const { data, isLoading, isError } = useFriends(page);
  const friends = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-agora-text">Friends</h1>

      {isLoading && <p className="text-agora-muted">Loading friends...</p>}
      {isError && <p className="text-red-500">Could not load friends.</p>}
      {!isLoading && !isError && friends.length === 0 && (
        <p className="text-agora-muted">
          No friends yet — a friend is anyone you follow who follows you back. Follow someone who already follows
          you to see them here.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl"
          >
            <Link to={`/profile/${friend.id}`} className="flex min-w-0 items-center gap-3">
              <Avatar name={friend.displayName} imageUrl={friend.profileImageUrl} />
              <span className="min-w-0">
                <span className="block truncate font-medium text-agora-text">{friend.displayName}</span>
                <span className="block truncate text-sm text-agora-dim">@{friend.username}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => openChat(friend.id)}
              className="shrink-0 rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-agora-on hover:bg-agora-hover"
            >
              Message
            </button>
          </div>
        ))}
      </div>

      {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
