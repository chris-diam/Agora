import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEvent } from "../hooks/useEvents";
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

export function CreateEventPage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("MUSIC");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const created = await createEvent.mutateAsync({
        title,
        description,
        category,
        city,
        country,
        venueName: venueName || undefined,
        address: address || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      navigate(`/events/${created.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Create event</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm shadow-gray-900/5 backdrop-blur-xl"
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          required
          className="rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          required
          rows={4}
          className="rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as EventCategory)}
          className="rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        >
          {EVENT_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            required
            className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          />
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country"
            required
            className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={venueName}
            onChange={(event) => setVenueName(event.target.value)}
            placeholder="Venue (optional)"
            className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          />
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Address (optional)"
            className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <label className="flex w-full flex-col text-sm text-gray-600">
            Start
            <input
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
              className="rounded border border-gray-300 p-2"
            />
          </label>
          <label className="flex w-full flex-col text-sm text-gray-600">
            End (optional)
            <input
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded border border-gray-300 p-2"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={createEvent.isPending}
          className="self-start rounded-full bg-agora px-4 py-2 text-sm font-medium text-white hover:bg-agora-hover disabled:opacity-50"
        >
          Create event
        </button>
      </form>
    </div>
  );
}
