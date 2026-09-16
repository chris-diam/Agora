import { useState } from "react";
import { Link } from "react-router-dom";
import { useFollowUser } from "../hooks/useUsers";
import { useMarkAllNotificationsRead, useNotifications, useUnreadNotificationCount } from "../hooks/useNotifications";
import { Avatar } from "./Avatar";
import { BellIcon } from "./icons";

export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  // Locally-tracked "just followed back" ids — the list stays open after
  // clicking Follow back, so we flip that row immediately rather than
  // waiting for the next full notifications refetch.
  const [followedBackIds, setFollowedBackIds] = useState<Set<string>>(new Set());

  const { data: unread } = useUnreadNotificationCount();
  const { data: notifications, isLoading } = useNotifications(1, isOpen);
  const markAllRead = useMarkAllNotificationsRead();
  const followMutation = useFollowUser();

  const unreadCount = unread?.data.count ?? 0;
  const items = notifications?.data ?? [];

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && unreadCount > 0) {
      markAllRead.mutate();
    }
  };

  const handleFollowBack = (actorId: string) => {
    followMutation.mutate(actorId);
    setFollowedBackIds((previous) => new Set(previous).add(actorId));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-agora-muted hover:bg-white/5"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Click-outside catcher — simpler and more reliable than blur timing tricks. */}
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-agora-border bg-agora-surface/95 shadow-lg shadow-black/30 backdrop-blur-xl">
            <p className="border-b border-agora-border px-4 py-2 text-xs font-semibold tracking-wide text-agora-dim uppercase">
              Notifications
            </p>
            <div className="max-h-96 overflow-y-auto">
              {isLoading && <p className="px-4 py-3 text-sm text-agora-dim">Loading...</p>}
              {!isLoading && items.length === 0 && (
                <p className="px-4 py-3 text-sm text-agora-dim">No notifications yet.</p>
              )}
              {items.map((notification) => {
                const isFollowingBack = notification.followingBack || followedBackIds.has(notification.actor.id);
                return (
                  <div key={notification.id} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5">
                    <Link
                      to={`/profile/${notification.actor.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <Avatar name={notification.actor.displayName} imageUrl={notification.actor.profileImageUrl} size="sm" />
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-agora-text">{notification.actor.displayName}</span>{" "}
                        <span className="text-agora-muted">started following you</span>
                      </span>
                    </Link>
                    {isFollowingBack ? (
                      <span className="shrink-0 text-xs text-agora-dim">Following</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleFollowBack(notification.actor.id)}
                        className="shrink-0 rounded-full bg-agora px-3 py-1 text-xs font-medium text-agora-on hover:bg-agora-hover"
                      >
                        Follow back
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
