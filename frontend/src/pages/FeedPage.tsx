import { useState } from "react";
import { CreatePost } from "../components/CreatePost";
import { Feed } from "../components/Feed";
import { RightRail } from "../components/RightRail";
import { getToken } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFeed } from "../hooks/useFeed";
import type { FeedType } from "../api/feed";

const FEED_TABS: { key: FeedType; label: string }[] = [
  { key: "following", label: "Following" },
  { key: "chronological", label: "Chronological" },
  { key: "interests", label: "Interests" },
  { key: "local", label: "Local" },
];

export function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  // Seeded from the token's presence (synchronous) rather than
  // isAuthenticated (which waits on the async "me" query) — otherwise a
  // fresh page load always locks this lazy initializer to "chronological"
  // before the auth check resolves, even for an already-logged-in user.
  const [feedType, setFeedType] = useState<FeedType>(() => (getToken() ? "following" : "chronological"));
  const [page, setPage] = useState(1);
  const [explainReasons, setExplainReasons] = useState(true);

  const { data, isLoading, isError, error } = useFeed(feedType, page);

  const handleTabChange = (type: FeedType) => {
    setFeedType(type);
    setPage(1);
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: "long" });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
          <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">
            {today}
            {user?.city ? ` · ${user.city}` : ""}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            {isAuthenticated && user ? `What moves you today, ${user.displayName.split(" ")[0]}?` : "What moves you today?"}
          </h1>
          <p className="mt-1 text-gray-500">Choose the current. Every story keeps its reason visible.</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {FEED_TABS.map((tab) => {
              const disabled = !isAuthenticated && tab.key !== "chronological";
              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleTabChange(tab.key)}
                  title={disabled ? "Log in to use this feed" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    feedType === tab.key ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${disabled ? "opacity-40" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}

            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-gray-500">
              Explain recommendations
              <button
                type="button"
                role="switch"
                aria-checked={explainReasons}
                onClick={() => setExplainReasons((value) => !value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  explainReasons ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    explainReasons ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </section>

        {isAuthenticated && <CreatePost />}

        <Feed
          items={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error instanceof Error ? error.message : undefined}
          pagination={data?.pagination}
          onPageChange={setPage}
          showReasons={explainReasons}
        />
      </div>

      <RightRail />
    </div>
  );
}
