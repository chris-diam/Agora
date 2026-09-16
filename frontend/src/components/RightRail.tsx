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
      <div className="rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-agora-text">
            {user?.city ? `Upcoming in ${user.city}` : "Upcoming events"}
          </h2>
          <Link to="/events" className="text-xs text-agora-dim hover:text-agora-muted">
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingEvents.map((event) => {
            const start = new Date(event.startDate);
            return (
              <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-3 hover:opacity-80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agora-light text-sm font-semibold text-agora-text">
                  {start.getDate()}
                </span>
                <span className="min-w-0">
                  <p className="truncate text-sm font-medium text-agora-text">{event.title}</p>
                  <p className="text-xs text-agora-dim">
                    {event.venueName ?? event.city} ·{" "}
                    {start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </span>
              </Link>
            );
          })}
          {upcomingEvents.length === 0 && <p className="text-xs text-agora-dim">No upcoming events yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-agora-text">Communities in motion</h2>
          <Link to="/communities" className="text-xs text-agora-dim hover:text-agora-muted">
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {suggestedCommunities.map((community) => (
            <SuggestedCommunityRow key={community.id} id={community.id} name={community.name} membersCount={community.membersCount} />
          ))}
          {suggestedCommunities.length === 0 && <p className="text-xs text-agora-dim">You're in every community here.</p>}
        </div>
      </div>

      <div className="rounded-2xl bg-agora p-4 text-agora-on shadow-sm">
        <h2 className="text-sm font-semibold">Nothing hidden</h2>
        <p className="mt-1 text-xs text-white/80">
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
        <p className="truncate text-sm font-medium text-agora-text hover:underline">{name}</p>
        <p className="text-xs text-agora-dim">{membersCount} members</p>
      </Link>
      <button
        type="button"
        onClick={() => joinMutation.mutate(id)}
        disabled={joinMutation.isPending}
        className="shrink-0 rounded-full border border-agora-border bg-agora-surface px-3 py-1 text-xs font-medium text-agora-muted hover:bg-agora-surface disabled:opacity-50"
      >
        Join
      </button>
    </div>
  );
}
