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
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Create community</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm shadow-gray-900/5 backdrop-blur-xl"
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          required
          className="rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category (optional)"
          className="rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City (optional)"
            className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          />
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country (optional)"
            className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={createCommunity.isPending}
          className="self-start rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Create community
        </button>
      </form>
    </div>
  );
}
