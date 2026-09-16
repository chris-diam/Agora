import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreatePost } from "../components/CreatePost";
import { EventCard } from "../components/EventCard";
import { Feed } from "../components/Feed";
import { RightRail } from "../components/RightRail";
import { getToken } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../hooks/useEvents";
import { useFeed } from "../hooks/useFeed";
import type { FeedType } from "../api/feed";

const VALID_FEED_TYPES: FeedType[] = ["following", "chronological", "interests", "local"];

const FEED_TABS: { key: FeedType; label: string }[] = [
  { key: "following", label: "Following" },
  { key: "chronological", label: "Chronological" },
  { key: "interests", label: "Interests" },
  { key: "local", label: "Local" },
];

export function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  // Seeded from the token's presence (synchronous) rather than
  // isAuthenticated (which waits on the async "me" query) — otherwise a
  // fresh page load always locks this lazy initializer to "chronological"
  // before the auth check resolves, even for an already-logged-in user.
  // A "type" query param (e.g. the sidebar's "Local" link) overrides that
  // default — read once on mount, same as the token check.
  const [feedType, setFeedType] = useState<FeedType>(() => {
    const requested = searchParams.get("type");
    if (requested && (VALID_FEED_TYPES as string[]).includes(requested)) return requested as FeedType;
    return getToken() ? "following" : "chronological";
  });
  const [page, setPage] = useState(1);
  const [explainReasons, setExplainReasons] = useState(true);

  const { data, isLoading, isError, error } = useFeed(feedType, page, isAuthenticated);
  const { data: upcomingEvents, isLoading: eventsLoading } = useEvents({ limit: 10 });

  const handleTabChange = (type: FeedType) => {
    setFeedType(type);
    setPage(1);
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: "long" });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <section className="rounded-3xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
          <p className="text-xs font-semibold tracking-wide text-agora uppercase">
            {today}
            {user?.city ? ` · ${user.city}` : ""}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-agora-text">
            {isAuthenticated && user ? `What moves you today, ${user.displayName.split(" ")[0]}?` : "What's coming up?"}
          </h1>
          <p className="mt-1 text-agora-muted">
            {isAuthenticated
              ? "Choose the current. Every story keeps its reason visible."
              : "Upcoming events on Agora — log in to see the feed and post your own."}
          </p>

          {isAuthenticated && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {FEED_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    feedType === tab.key ? "bg-agora text-agora-on" : "bg-agora-light text-agora-muted hover:bg-agora-border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-agora-muted">
                Explain recommendations
                <button
                  type="button"
                  role="switch"
                  aria-checked={explainReasons}
                  onClick={() => setExplainReasons((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    explainReasons ? "bg-agora" : "bg-agora-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-agora-surface shadow transition-transform ${
                      explainReasons ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          )}
        </section>

        {isAuthenticated ? (
          <>
            <CreatePost />
            <Feed
              items={data?.data ?? []}
              isLoading={isLoading}
              isError={isError}
              errorMessage={error instanceof Error ? error.message : undefined}
              pagination={data?.pagination}
              onPageChange={setPage}
              showReasons={explainReasons}
            />
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {eventsLoading && <p className="text-agora-muted">Loading upcoming events...</p>}
            {(upcomingEvents?.data ?? []).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {!eventsLoading && (upcomingEvents?.data.length ?? 0) === 0 && (
              <p className="text-agora-muted">No upcoming events yet.</p>
            )}
          </div>
        )}
      </div>

      <RightRail />
    </div>
  );
}
