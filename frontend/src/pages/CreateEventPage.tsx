import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateEvent } from "../hooks/useEvents";
import { useCommunity } from "../hooks/useCommunities";
import { useAuth } from "../context/AuthContext";
import { CameraIcon, CloseIcon } from "../components/icons";
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

const fieldClasses =
  "w-full rounded-xl border border-agora-border bg-agora-surface p-2.5 text-sm text-agora-text focus:ring-2 focus:ring-agora/30 focus:outline-none";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-agora-muted";

interface DetectedLocation {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Reverse-geocodes browser coordinates via Nominatim (OpenStreetMap's free,
// keyless geocoder) — no API key/billing setup needed, unlike Google's
// Geocoding API. Best-effort: any failure just leaves location undetected
// and the profile-city fallback below takes over.
const reverseGeocode = async (latitude: number, longitude: number): Promise<DetectedLocation | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    const address = body.address ?? {};
    const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county;
    const country = address.country;
    if (!city || !country) return null;
    return { city, country, latitude, longitude };
  } catch {
    return null;
  }
};

export function CreateEventPage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get("communityId") ?? undefined;
  const { data: communityResult } = useCommunity(communityId ?? "");
  const community = communityResult?.data;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("MUSIC");

  // Location is detected automatically rather than typed in — most events
  // are organized from wherever they'll happen, and asking for city/country/
  // venue/address manually was the single biggest source of create-event
  // friction. Falls back to the organizer's profile city/country (set in
  // their Profile page) if geolocation is denied or unavailable, so the
  // form still works without ever blocking on it.
  const [location, setLocation] = useState<DetectedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"detecting" | "detected" | "fallback" | "unavailable">(
    "detecting",
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus(user?.city && user?.country ? "fallback" : "unavailable");
      if (user?.city && user?.country) setLocation({ city: user.city, country: user.country });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const detected = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (detected) {
          setLocation(detected);
          setLocationStatus("detected");
        } else if (user?.city && user?.country) {
          setLocation({ city: user.city, country: user.country });
          setLocationStatus("fallback");
        } else {
          setLocationStatus("unavailable");
        }
      },
      () => {
        if (user?.city && user?.country) {
          setLocation({ city: user.city, country: user.country });
          setLocationStatus("fallback");
        } else {
          setLocationStatus("unavailable");
        }
      },
      { timeout: 8000 },
    );
    // Runs once on mount — re-detecting on every user-object refetch would
    // re-trigger a geolocation prompt/request unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A single combined date+time input instead of the old separate start/end
  // date and time fields — fewer fields to fill, and events in this app
  // don't otherwise use an end time anywhere (event cards/details only ever
  // show the start).
  const [startAt, setStartAt] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("Please fill in the title and description.");
      return;
    }
    if (!location) {
      setError("We couldn't detect your location. Set a city and country on your profile and try again.");
      return;
    }
    if (!startAt) {
      setError("Please pick a date and time.");
      return;
    }

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      setError("The date/time doesn't look valid.");
      return;
    }

    try {
      const created = await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        startDate: startDate.toISOString(),
        imageFile: imageFile ?? undefined,
        communityId,
      });
      navigate(`/events/${created.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className={`text-xl font-semibold text-agora-text ${community ? "mb-1" : "mb-4"}`}>Create event</h1>
      {community && (
        <p className="mb-4 text-sm text-agora-muted">
          Organizing for <span className="font-medium text-agora-text">{community.name}</span>
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl"
      >
        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Event title"
            className={fieldClasses}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What's happening?"
            rows={4}
            className={fieldClasses}
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as EventCategory)}
            className={fieldClasses}
          >
            {EVENT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {imagePreviewUrl ? (
          <div className="relative w-fit">
            <img src={imagePreviewUrl} alt="" className="max-h-48 rounded-xl object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove photo"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-agora-border py-4 text-sm text-agora-muted hover:bg-white/5"
          >
            <CameraIcon className="h-4.5 w-4.5" />
            Add a cover photo
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        <div className="flex flex-col gap-1 text-xs text-agora-muted">
          <span className="font-medium">Location</span>
          {locationStatus === "detecting" && "Detecting your location…"}
          {locationStatus === "detected" && location && `${location.city}, ${location.country} (detected)`}
          {locationStatus === "fallback" && location && `${location.city}, ${location.country} (from your profile)`}
          {locationStatus === "unavailable" &&
            "Couldn't detect your location. Add a city/country on your profile to create events."}
        </div>

        <label className={labelClasses}>
          Date & time
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            className={fieldClasses}
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={createEvent.isPending}
          className="self-start rounded-full bg-agora px-4 py-2 text-sm font-medium text-agora-on hover:bg-agora-hover disabled:opacity-50"
        >
          {createEvent.isPending ? "Creating..." : "Create event"}
        </button>
      </form>
    </div>
  );
}
