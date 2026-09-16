import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRemoveAttendance, useSetAttendance } from "../hooks/useEvents";
import { Avatar } from "./Avatar";
import type { EventItem } from "../types";

export function EventCard({ event }: { event: EventItem }) {
  const { isAuthenticated } = useAuth();
  const setAttendance = useSetAttendance();
  const removeAttendance = useRemoveAttendance();

  const start = new Date(event.startDate);

  return (
    <article className="rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl transition-transform duration-200 ease-out hover:scale-[1.015] hover:shadow-lg hover:shadow-black/30 motion-reduce:transition-none motion-reduce:hover:scale-100">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Link to={`/events/${event.id}`} className="font-medium text-agora-text hover:underline">
          {event.title}
        </Link>
        <span className="shrink-0 rounded-full bg-agora-light px-2.5 py-0.5 text-xs text-agora-muted">
          {event.category}
        </span>
      </div>
      <p className="mb-2 text-xs text-agora-muted">
        {start.toLocaleString()} · {event.venueName ? `${event.venueName}, ` : ""}
        {event.city}, {event.country}
      </p>
      <Link to={`/profile/${event.organizer.id}`} className="mb-2 flex w-fit items-center gap-1.5 text-xs text-agora-muted hover:text-agora-muted">
        <Avatar name={event.organizer.displayName} imageUrl={event.organizer.profileImageUrl} size="sm" />
        Organized by {event.organizer.displayName}
      </Link>
      <p className="mb-3 line-clamp-2 text-sm text-agora-muted">{event.description}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-agora-muted">{event.attendeesCount} attending</span>
        {isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => setAttendance.mutate({ id: event.id, status: "INTERESTED" })}
              className={
                event.viewerAttendanceStatus === "INTERESTED"
                  ? "rounded-full bg-amber-100 px-2.5 py-1 text-amber-800"
                  : "rounded-full border border-agora-border bg-agora-surface/80 px-2.5 py-1 hover:bg-agora-surface"
              }
            >
              Interested
            </button>
            <button
              type="button"
              onClick={() => setAttendance.mutate({ id: event.id, status: "GOING" })}
              className={
                event.viewerAttendanceStatus === "GOING"
                  ? "rounded-full bg-agora px-2.5 py-1 text-agora-on"
                  : "rounded-full border border-agora-border bg-agora-surface/80 px-2.5 py-1 hover:bg-agora-surface"
              }
            >
              Going
            </button>
            {event.viewerAttendanceStatus && (
              <button
                type="button"
                onClick={() => removeAttendance.mutate(event.id)}
                className="text-xs text-agora-dim underline"
              >
                Clear
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}
