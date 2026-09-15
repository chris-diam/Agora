import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunities, useJoinCommunity } from "../hooks/useCommunities";
import { useEvents } from "../hooks/useEvents";

// Real data only — no fabricated "active now" counts. Upcoming events are
// filtered to the viewer's own city when set; communities are whatever the
// backend returns, filtered client-side to ones not already joined.
export function RightRail() {
  const { user } = useAuth();
  const { data: eventsResult } = useEvents({ city: user?.city ?? undefined, limit: 3 });
  const { data: communitiesResult } = useCommunities({ limit: 6 });

  const upcomingEvents = eventsResult?.data ?? [];
  const suggestedCommunities = (communitiesResult?.data ?? []).filter((community) => !community.isMember).slice(0, 3);

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
      <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {user?.city ? `Upcoming in ${user.city}` : "Upcoming events"}
          </h2>
          <Link to="/events" className="text-xs text-gray-400 hover:text-gray-600">
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingEvents.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="block hover:opacity-80">
              <p className="text-sm font-medium text-gray-900">{event.title}</p>
              <p className="text-xs text-gray-400">
                {event.venueName ?? event.city} ·{" "}
                {new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </Link>
          ))}
          {upcomingEvents.length === 0 && <p className="text-xs text-gray-400">No upcoming events yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Communities to join</h2>
          <Link to="/communities" className="text-xs text-gray-400 hover:text-gray-600">
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {suggestedCommunities.map((community) => (
            <SuggestedCommunityRow key={community.id} id={community.id} name={community.name} membersCount={community.membersCount} />
          ))}
          {suggestedCommunities.length === 0 && <p className="text-xs text-gray-400">You're in every community here.</p>}
        </div>
      </div>

      <div className="rounded-2xl bg-agora-dark p-4 text-white shadow-sm">
        <h2 className="text-sm font-semibold">Nothing hidden</h2>
        <p className="mt-1 text-xs text-gray-300">
          No outrage ranking, no engagement-maximizing algorithm. You choose the feed, and every item says why it's
          here.
        </p>
      </div>
    </aside>
  );
}

function SuggestedCommunityRow({ id, name, membersCount }: { id: string; name: string; membersCount: number }) {
  const joinMutation = useJoinCommunity();

  return (
    <div className="flex items-center justify-between gap-2">
      <Link to={`/communities/${id}`} className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 hover:underline">{name}</p>
        <p className="text-xs text-gray-400">{membersCount} members</p>
      </Link>
      <button
        type="button"
        onClick={() => joinMutation.mutate(id)}
        disabled={joinMutation.isPending}
        className="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Join
      </button>
    </div>
  );
}
