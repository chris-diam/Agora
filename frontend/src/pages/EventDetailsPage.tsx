import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDeleteEvent, useEvent, useRemoveAttendance, useSetAttendance } from "../hooks/useEvents";

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useEvent(id ?? "");
  const deleteMutation = useDeleteEvent();
  const setAttendance = useSetAttendance();
  const removeAttendance = useRemoveAttendance();

  if (isLoading) return <p className="text-gray-500">Loading event...</p>;
  if (isError || !data) return <p className="text-red-500">Event not found.</p>;

  const event = data.data;
  const isOwner = user?.id === event.organizerId;

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return;
    await deleteMutation.mutateAsync(event.id);
    navigate("/events");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">{event.title}</h1>
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {event.category}
          </span>
        </div>
        <p className="mb-1 text-sm text-gray-500">
          {new Date(event.startDate).toLocaleString()}
          {event.endDate ? ` – ${new Date(event.endDate).toLocaleString()}` : ""}
        </p>
        <p className="mb-3 text-sm text-gray-500">
          {[event.venueName, event.address, event.city, event.country].filter(Boolean).join(", ")}
        </p>
        <p className="mb-4 whitespace-pre-line text-gray-800">{event.description}</p>
        <p className="mb-4 text-sm text-gray-500">
          Organized by {event.organizer.displayName} · {event.attendeesCount} attending
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated && (
            <>
              <button
                type="button"
                onClick={() => setAttendance.mutate({ id: event.id, status: "INTERESTED" })}
                className={
                  event.viewerAttendanceStatus === "INTERESTED"
                    ? "rounded-full bg-amber-100 px-3 py-1.5 text-sm text-amber-800"
                    : "rounded-full border border-gray-300 bg-white/70 px-3 py-1.5 text-sm hover:bg-white"
                }
              >
                Interested
              </button>
              <button
                type="button"
                onClick={() => setAttendance.mutate({ id: event.id, status: "GOING" })}
                className={
                  event.viewerAttendanceStatus === "GOING"
                    ? "rounded-full bg-emerald-100 px-3 py-1.5 text-sm text-emerald-800"
                    : "rounded-full border border-gray-300 bg-white/70 px-3 py-1.5 text-sm hover:bg-white"
                }
              >
                Going
              </button>
              {event.viewerAttendanceStatus && (
                <button
                  type="button"
                  onClick={() => removeAttendance.mutate(event.id)}
                  className="text-sm text-gray-400 underline"
                >
                  Clear
                </button>
              )}
            </>
          )}
          {isOwner && (
            <button type="button" onClick={handleDelete} className="ml-auto text-sm text-red-500 hover:text-red-600">
              Delete event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
