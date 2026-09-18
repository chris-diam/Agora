import { useNavigate, useParams } from "react-router-dom";
import { resolveMediaUrl } from "../api/client";
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

  if (isLoading) return <p className="text-agora-muted">Loading event...</p>;
  if (isError || !data) return <p className="text-red-500">Event not found.</p>;

  const event = data.data;
  const isOwner = user?.id === event.organizerId;
  const imageUrl = resolveMediaUrl(event.imageUrl);

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return;
    await deleteMutation.mutateAsync(event.id);
    navigate("/events");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="overflow-hidden rounded-3xl border border-agora-border bg-agora-surface/80 shadow-sm shadow-black/20 backdrop-blur-xl">
        {imageUrl && <img src={imageUrl} alt="" className="h-64 w-full object-cover" />}
        <div className="p-6">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold text-agora-text">{event.title}</h1>
          <span className="shrink-0 rounded-full bg-agora-light px-2.5 py-0.5 text-xs text-agora-muted">
            {event.category}
          </span>
        </div>
        <p className="mb-1 text-sm text-agora-muted">
          {new Date(event.startDate).toLocaleString()}
          {event.endDate ? ` – ${new Date(event.endDate).toLocaleString()}` : ""}
        </p>
        <p className="mb-3 text-sm text-agora-muted">
          {[event.venueName, event.address, event.city, event.country].filter(Boolean).join(", ")}
        </p>
        <p className="mb-4 whitespace-pre-line text-agora-text">{event.description}</p>
        <p className="mb-4 text-sm text-agora-muted">
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
                    : "rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1.5 text-sm hover:bg-agora-surface"
                }
              >
                Interested
              </button>
              <button
                type="button"
                onClick={() => setAttendance.mutate({ id: event.id, status: "GOING" })}
                className={
                  event.viewerAttendanceStatus === "GOING"
                    ? "rounded-full bg-agora px-3 py-1.5 text-sm text-agora-on"
                    : "rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1.5 text-sm hover:bg-agora-surface"
                }
              >
                Going
              </button>
              {event.viewerAttendanceStatus && (
                <button
                  type="button"
                  onClick={() => removeAttendance.mutate(event.id)}
                  className="text-sm text-agora-dim underline"
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
    </div>
  );
}
