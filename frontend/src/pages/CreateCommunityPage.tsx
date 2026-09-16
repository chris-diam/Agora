import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateCommunity } from "../hooks/useCommunities";

export function CreateCommunityPage() {
  const navigate = useNavigate();
  const createCommunity = useCreateCommunity();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createCommunity.mutateAsync({
        name,
        description: description || undefined,
        category: category || undefined,
        city: city || undefined,
        country: country || undefined,
      });
      navigate("/communities");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create community");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-semibold text-agora-text">Create community</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl"
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          required
          className="rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category (optional)"
          className="rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City (optional)"
            className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
          />
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country (optional)"
            className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={createCommunity.isPending}
          className="self-start rounded-full bg-agora px-4 py-2 text-sm font-medium text-agora-on hover:bg-agora-hover disabled:opacity-50"
        >
          Create community
        </button>
      </form>
    </div>
  );
}
