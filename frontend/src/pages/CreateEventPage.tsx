import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateEvent } from "../hooks/useEvents";
import { useCommunity } from "../hooks/useCommunities";
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

export function CreateEventPage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get("communityId") ?? undefined;
  const { data: communityResult } = useCommunity(communityId ?? "");
  const community = communityResult?.data;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("MUSIC");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [showLocationDetails, setShowLocationDetails] = useState(false);

  // Plain date + time inputs instead of a single datetime-local: browsers'
  // combined datetime-local widget is notoriously fussy to fill via keyboard
  // (locale-dependent segment order, easy to leave a segment blank) and,
  // being `required`, fails HTML5 validation completely silently — the form
  // just never submits, with no error shown anywhere. Two simple inputs are
  // far more reliable to fill correctly.
  const [startDateStr, setStartDateStr] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");

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

    // Explicit validation with a message the user actually sees, rather
    // than relying solely on native HTML5 validation (which can block
    // submission with zero visible feedback).
    if (!title.trim() || !description.trim() || !city.trim() || !country.trim()) {
      setError("Please fill in the title, description, city, and country.");
      return;
    }
    if (!startDateStr || !startTimeStr) {
      setError("Please pick a start date and time.");
      return;
    }

    const startDate = new Date(`${startDateStr}T${startTimeStr}`);
    if (Number.isNaN(startDate.getTime())) {
      setError("The start date/time doesn't look valid.");
      return;
    }

    let endDate: Date | undefined;
    if (endDateStr || endTimeStr) {
      if (!endDateStr || !endTimeStr) {
        setError("Please fill in both the end date and end time, or leave both empty.");
        return;
      }
      endDate = new Date(`${endDateStr}T${endTimeStr}`);
      if (Number.isNaN(endDate.getTime())) {
        setError("The end date/time doesn't look valid.");
        return;
      }
      if (endDate < startDate) {
        setError("The end time can't be before the start time.");
        return;
      }
    }

    try {
      const created = await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        city: city.trim(),
        country: country.trim(),
        venueName: venueName.trim() || undefined,
        address: address.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
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

        <div className="grid grid-cols-2 gap-3">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            className={fieldClasses}
          />
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country"
            className={fieldClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelClasses}>
            Start date
            <input
              type="date"
              value={startDateStr}
              onChange={(event) => setStartDateStr(event.target.value)}
              className={fieldClasses}
            />
          </label>
          <label className={labelClasses}>
            Start time
            <input
              type="time"
              value={startTimeStr}
              onChange={(event) => setStartTimeStr(event.target.value)}
              className={fieldClasses}
            />
          </label>
          <label className={labelClasses}>
            End date (optional)
            <input
              type="date"
              value={endDateStr}
              onChange={(event) => setEndDateStr(event.target.value)}
              className={fieldClasses}
            />
          </label>
          <label className={labelClasses}>
            End time (optional)
            <input
              type="time"
              value={endTimeStr}
              onChange={(event) => setEndTimeStr(event.target.value)}
              className={fieldClasses}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowLocationDetails((value) => !value)}
          className="self-start text-xs font-medium text-agora hover:underline"
        >
          {showLocationDetails ? "Hide venue details" : "+ Add venue details (optional)"}
        </button>
        {showLocationDetails && (
          <div className="grid grid-cols-2 gap-3">
            <input
              value={venueName}
              onChange={(event) => setVenueName(event.target.value)}
              placeholder="Venue name"
              className={fieldClasses}
            />
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Street address"
              className={fieldClasses}
            />
          </div>
        )}

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
