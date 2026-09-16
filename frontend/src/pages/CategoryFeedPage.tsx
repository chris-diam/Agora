import { useState } from "react";
import { EventCard } from "../components/EventCard";
import { Feed } from "../components/Feed";
import { useEvents } from "../hooks/useEvents";
import { usePosts } from "../hooks/usePosts";
import type { EventCategory, PostCategory } from "../types";

interface CategoryFeedPageProps {
  title: string;
  description: string;
  postCategories: PostCategory[];
  eventCategories?: EventCategory[];
}

// Shared by News, Music, and Arts & Culture — each is just "posts in these
// categories, plus upcoming events in these categories" with real data
// (no fabricated stats), so one component covers all three.
export function CategoryFeedPage({ title, description, postCategories, eventCategories }: CategoryFeedPageProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = usePosts({ category: postCategories, page });
  const { data: eventsResult } = useEvents({ category: eventCategories, limit: 5 }, Boolean(eventCategories));

  const upcomingEvents = eventCategories ? (eventsResult?.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <section className="rounded-3xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-agora-text">{title}</h1>
          <p className="mt-1 text-agora-muted">{description}</p>
        </section>

        <Feed
          items={(data?.data ?? []).map((post) => ({ post }))}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error instanceof Error ? error.message : undefined}
          pagination={data?.pagination}
          onPageChange={setPage}
          showReasons={false}
        />
      </div>

      {eventCategories && (
        <aside className="flex w-full flex-col gap-3 lg:w-80 lg:shrink-0">
          <h2 className="text-sm font-semibold text-agora-text">Upcoming events</h2>
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {upcomingEvents.length === 0 && <p className="text-sm text-agora-dim">No upcoming events in this category yet.</p>}
        </aside>
      )}
    </div>
  );
}
