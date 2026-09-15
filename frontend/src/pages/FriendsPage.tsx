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
      <h1 className="text-xl font-semibold text-gray-900">Friends</h1>

      {isLoading && <p className="text-gray-500">Loading friends...</p>}
      {isError && <p className="text-red-500">Could not load friends.</p>}
      {!isLoading && !isError && friends.length === 0 && (
        <p className="text-gray-500">
          No friends yet — a friend is anyone you follow who follows you back. Follow someone who already follows
          you to see them here.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl"
          >
            <Link to={`/profile/${friend.id}`} className="flex min-w-0 items-center gap-3">
              <Avatar name={friend.displayName} imageUrl={friend.profileImageUrl} />
              <span className="min-w-0">
                <span className="block truncate font-medium text-gray-900">{friend.displayName}</span>
                <span className="block truncate text-sm text-gray-400">@{friend.username}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => openChat(friend.id)}
              className="shrink-0 rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-white hover:bg-agora-hover"
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
