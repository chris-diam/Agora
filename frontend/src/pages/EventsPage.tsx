import { useState } from "react";
import { Link } from "react-router-dom";
import { EventPinCard } from "../components/EventPinCard";
import { Pagination } from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../hooks/useEvents";
import type { EventCategory } from "../types";

const EVENT_CATEGORIES: EventCategory[] = [
  "MUSIC",
  "CONCERT",
  "ART",
  "EXHIBITION",
  "THEATRE",
  "CINEMA",
  "FESTIVAL",
  "CULTURE",
  "OTHER",
];

export function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useEvents({
    page,
    city: city || undefined,
    country: country || undefined,
    category: category || undefined,
    date: date || undefined,
  });

  const events = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-agora-text" style={{ fontFamily: "Wellfleet, serif" }}>
            Events
          </h1>
          <p className="mt-1 text-sm text-agora-muted">What's on, pinned as it comes in.</p>
        </div>
        {isAuthenticated && (
          <Link
            to="/events/new"
            className="shrink-0 rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-agora-on hover:bg-agora-hover"
          >
            Create event
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-agora-border bg-agora-surface/80 p-3 shadow-sm shadow-black/20 backdrop-blur-xl">
        <input
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
          placeholder="City"
          className="rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
        <input
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
            setPage(1);
          }}
          placeholder="Country"
          className="rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value as EventCategory | "");
            setPage(1);
          }}
          className="rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        >
          <option value="">All categories</option>
          {EVENT_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0) + option.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
      </div>

      <div className="bg-corkboard rounded-3xl border border-agora-border p-5 shadow-inner sm:p-8">
        {/* Fixed dark-brown text rather than theme-muted — this surface's
            background color is intentionally fixed (see .bg-corkboard), so
            theme-dependent text can't be relied on for contrast here. */}
        {isLoading && <p style={{ color: "#4a3419" }}>Loading events...</p>}
        {isError && <p className="font-medium text-red-900">Could not load events.</p>}
        {!isLoading && !isError && events.length === 0 && (
          <p style={{ color: "#4a3419" }}>No events found — be the first to pin one up.</p>
        )}

        {events.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventPinCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
