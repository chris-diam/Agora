import { useState } from "react";
import { Link } from "react-router-dom";
import { EventList } from "../components/EventList";
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Events</h1>
        {isAuthenticated && (
          <Link
            to="/events/new"
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Create event
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
        <input
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
          placeholder="City"
          className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <input
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
            setPage(1);
          }}
          placeholder="Country"
          className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value as EventCategory | "");
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        >
          <option value="">All categories</option>
          {EVENT_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
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
          className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
      </div>

      <EventList
        events={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
