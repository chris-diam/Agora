import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useRemoveAttendance, useSetAttendance } from "../hooks/useEvents";
import { seededRange } from "../lib/deterministicRandom";
import { Avatar } from "./Avatar";
import type { EventItem } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: "Music",
  CONCERT: "Concert",
  ART: "Art",
  EXHIBITION: "Exhibition",
  THEATRE: "Theatre",
  CINEMA: "Cinema",
  FESTIVAL: "Festival",
  CULTURE: "Culture",
  OTHER: "Other",
};

// A pinned note on the Events corkboard — the deliberate alternative to
// another plain card list. Each note gets a small, stable tilt (seeded by
// the event's own id, not Math.random(), so it doesn't jitter on re-fetch)
// and straightens on hover, like picking it up off the board.
export function EventPinCard({ event }: { event: EventItem }) {
  const { isAuthenticated } = useAuth();
  const setAttendance = useSetAttendance();
  const removeAttendance = useRemoveAttendance();

  const start = new Date(event.startDate);
  const imageUrl = resolveMediaUrl(event.imageUrl);
  const tilt = seededRange(event.id, -5, 5).toFixed(2);
  const day = start.toLocaleDateString(undefined, { day: "numeric" });
  const month = start.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const weekday = start.toLocaleDateString(undefined, { weekday: "short" });
  const time = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <article
      className="group relative transition-transform duration-200 ease-out hover:z-10 hover:-translate-y-1 hover:rotate-0 motion-reduce:transition-none"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {/* The pin itself — a small glossy dot half-overlapping the card's
          top edge, colored from the theme accent so it stays on-brand
          across all six palettes. */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-agora shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
        style={{
          backgroundImage: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.75), transparent 55%)",
        }}
      />

      <div className="overflow-hidden rounded-lg border border-agora-border bg-agora-surface shadow-[0_6px_16px_-4px_rgba(0,0,0,0.35)] transition-shadow duration-200 group-hover:shadow-[0_14px_28px_-8px_rgba(0,0,0,0.45)]">
        {imageUrl ? (
          <Link to={`/events/${event.id}`} className="block">
            <img src={imageUrl} alt="" className="h-36 w-full object-cover" />
          </Link>
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-agora-light">
            <span className="font-serif text-4xl text-agora-dim" style={{ fontFamily: "Wellfleet, serif" }}>
              {CATEGORY_LABELS[event.category]?.charAt(0) ?? "?"}
            </span>
          </div>
        )}

        <div className="p-4">
          <div className="mb-2 flex items-start gap-3">
            {/* Torn-calendar date block — the "physical" detail that reads
                as editorial rather than scrapbook: no washi tape, no
                doodles, just typography. */}
            <div className="flex shrink-0 flex-col items-center rounded-md border border-agora-border bg-agora-bg px-2 py-1 leading-none">
              <span className="text-[10px] font-semibold tracking-wide text-agora-dim">{month}</span>
              <span className="text-xl font-bold text-agora-text">{day}</span>
            </div>
            <div className="min-w-0 flex-1">
              <Link
                to={`/events/${event.id}`}
                className="block truncate font-semibold text-agora-text hover:underline"
                style={{ fontFamily: "Wellfleet, serif" }}
              >
                {event.title}
              </Link>
              <p className="truncate text-xs text-agora-muted">
                {weekday} · {time}
              </p>
            </div>
          </div>

          <p className="mb-2 truncate text-xs text-agora-muted">
            {event.venueName ? `${event.venueName}, ` : ""}
            {event.city}, {event.country}
          </p>

          <div className="mb-2 flex items-center justify-between gap-2">
            <Link
              to={`/profile/${event.organizer.id}`}
              className="flex min-w-0 items-center gap-1.5 text-xs text-agora-muted hover:text-agora-text"
            >
              <Avatar name={event.organizer.displayName} imageUrl={event.organizer.profileImageUrl} size="sm" />
              <span className="truncate">{event.organizer.displayName}</span>
            </Link>
            <span className="shrink-0 text-[10px] font-medium tracking-wide text-agora-dim uppercase">
              {CATEGORY_LABELS[event.category] ?? event.category}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-agora-dim">{event.attendeesCount} attending</span>
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setAttendance.mutate({ id: event.id, status: "INTERESTED" })}
                  className={
                    event.viewerAttendanceStatus === "INTERESTED"
                      ? "rounded-full bg-amber-100 px-2 py-0.5 text-amber-800"
                      : "rounded-full border border-agora-border px-2 py-0.5 text-agora-muted hover:bg-agora-light"
                  }
                >
                  Interested
                </button>
                <button
                  type="button"
                  onClick={() => setAttendance.mutate({ id: event.id, status: "GOING" })}
                  className={
                    event.viewerAttendanceStatus === "GOING"
                      ? "rounded-full bg-agora px-2 py-0.5 text-agora-on"
                      : "rounded-full border border-agora-border px-2 py-0.5 text-agora-muted hover:bg-agora-light"
                  }
                >
                  Going
                </button>
                {event.viewerAttendanceStatus && (
                  <button
                    type="button"
                    onClick={() => removeAttendance.mutate(event.id)}
                    className="text-agora-dim underline"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
