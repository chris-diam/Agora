import { useState } from "react";
import type { FormEvent } from "react";
import { useCreatePost } from "../hooks/usePosts";
import type { PostCategory } from "../types";

const CATEGORIES: PostCategory[] = [
  "GENERAL",
  "LOCAL_NEWS",
  "NATIONAL_NEWS",
  "WORLD_NEWS",
  "MUSIC",
  "ART",
  "CULTURE",
  "THEATRE",
  "CINEMA",
  "TECHNOLOGY",
  "SCIENCE",
];

interface CreatePostProps {
  onCreated?: () => void;
}

export function CreatePost({ onCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("GENERAL");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const createPost = useCreatePost();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;

    await createPost.mutateAsync({
      content: content.trim(),
      category,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
    });

    setContent("");
    setCity("");
    setCountry("");
    setCategory("GENERAL");
    onCreated?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl"
    >
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What's happening?"
        rows={3}
        maxLength={5000}
        className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as PostCategory)}
          className="rounded-xl border border-gray-200 bg-white/80 p-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City (optional)"
          className="rounded-xl border border-gray-200 bg-white/80 p-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
        <input
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder="Country (optional)"
          className="rounded-xl border border-gray-200 bg-white/80 p-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        />
      </div>
      {createPost.isError && <p className="text-sm text-red-500">{createPost.error.message}</p>}
      <button
        type="submit"
        disabled={createPost.isPending || !content.trim()}
        className="self-end rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Post
      </button>
    </form>
  );
}
