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
    <article className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Link to={`/events/${event.id}`} className="font-medium text-gray-900 hover:underline">
          {event.title}
        </Link>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
          {event.category}
        </span>
      </div>
      <p className="mb-2 text-xs text-gray-500">
        {start.toLocaleString()} · {event.venueName ? `${event.venueName}, ` : ""}
        {event.city}, {event.country}
      </p>
      <Link to={`/profile/${event.organizer.id}`} className="mb-2 flex w-fit items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
        <Avatar name={event.organizer.displayName} imageUrl={event.organizer.profileImageUrl} size="sm" />
        Organized by {event.organizer.displayName}
      </Link>
      <p className="mb-3 line-clamp-2 text-sm text-gray-700">{event.description}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">{event.attendeesCount} attending</span>
        {isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => setAttendance.mutate({ id: event.id, status: "INTERESTED" })}
              className={
                event.viewerAttendanceStatus === "INTERESTED"
                  ? "rounded-full bg-amber-100 px-2.5 py-1 text-amber-800"
                  : "rounded-full border border-gray-300 bg-white/70 px-2.5 py-1 hover:bg-white"
              }
            >
              Interested
            </button>
            <button
              type="button"
              onClick={() => setAttendance.mutate({ id: event.id, status: "GOING" })}
              className={
                event.viewerAttendanceStatus === "GOING"
                  ? "rounded-full bg-agora-light px-2.5 py-1 text-agora-dark"
                  : "rounded-full border border-gray-300 bg-white/70 px-2.5 py-1 hover:bg-white"
              }
            >
              Going
            </button>
            {event.viewerAttendanceStatus && (
              <button
                type="button"
                onClick={() => removeAttendance.mutate(event.id)}
                className="text-xs text-gray-400 underline"
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
