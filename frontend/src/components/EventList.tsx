import { EventCard } from "./EventCard";
import { Pagination } from "./Pagination";
import type { EventItem, PaginationMeta } from "../types";

interface EventListProps {
  events: EventItem[];
  isLoading: boolean;
  isError: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

export function EventList({ events, isLoading, isError, pagination, onPageChange }: EventListProps) {
  if (isLoading) return <p className="text-agora-muted">Loading events...</p>;
  if (isError) return <p className="text-red-500">Could not load events.</p>;
  if (events.length === 0) return <p className="text-agora-muted">No events found.</p>;

  return (
    <div className="flex flex-col gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
      {pagination && onPageChange && <Pagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
}
