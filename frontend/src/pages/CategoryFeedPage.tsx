import { EventCard } from "../components/EventCard";
import { Feed } from "../components/Feed";
import { useEvents } from "../hooks/useEvents";
import { usePosts } from "../hooks/usePosts";
import { useState } from "react";
import type { EventCategory, PostCategory } from "../types";
import type { ComponentType, SVGProps } from "react";

interface CategoryFeedPageProps {
  title: string;
  description: string;
  postCategories: PostCategory[];
  eventCategories?: EventCategory[];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  // Each category page gets its own header mood rather than sharing one
  // look — "wire" (News) reads like a dispatch column, "masthead" (Music,
  // Arts & Culture) reads like an editorial section front. Still built
  // from the same theme tokens either way.
  mood: "wire" | "masthead";
}

// Shared data-fetching shell for News, Music, and Arts & Culture — each is
// "posts in these categories, plus upcoming events in these categories"
// with real data, so the query logic lives in one place. The header
// treatment (icon, mood) is per-page so the three don't read as the same
// screen with a different label.
export function CategoryFeedPage({
  title,
  description,
  postCategories,
  eventCategories,
  Icon,
  mood,
}: CategoryFeedPageProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = usePosts({ category: postCategories, page });
  const { data: eventsResult } = useEvents({ category: eventCategories, limit: 5 }, Boolean(eventCategories));

  const upcomingEvents = eventCategories ? (eventsResult?.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {mood === "wire" ? (
          <section className="flex items-start gap-4 border-l-4 border-agora py-1 pl-5">
            <Icon className="mt-1 h-7 w-7 shrink-0 text-agora" />
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-agora-dim uppercase">Dispatch</p>
              <h1 className="text-3xl font-semibold text-agora-text">{title}</h1>
              <p className="mt-1 text-agora-muted">{description}</p>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-3xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
            <div
              aria-hidden
              className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
              style={{ background: "var(--color-agora)" }}
            />
            <Icon className="mb-3 h-8 w-8 text-agora" />
            <h1 className="text-3xl font-semibold text-agora-text" style={{ fontFamily: "Wellfleet, serif" }}>
              {title}
            </h1>
            <p className="mt-1 text-agora-muted">{description}</p>
          </section>
        )}

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
