import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePost } from "../hooks/usePosts";
import { CameraIcon, CloseIcon } from "../components/icons";
import type { PostCategory } from "../types";

const NEWS_CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "LOCAL_NEWS", label: "Local" },
  { value: "NATIONAL_NEWS", label: "National" },
  { value: "WORLD_NEWS", label: "World" },
];

const fieldClasses =
  "w-full rounded-xl border border-agora-border bg-agora-surface p-2.5 text-sm text-agora-text focus:ring-2 focus:ring-agora/30 focus:outline-none";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-agora-muted";

// A dedicated composer for article-style News posts — title + thumbnail +
// body — distinct from the quick "what's happening" composer, which has no
// title field and treats any attached image as inline media rather than a
// cover photo. Presence of a title is what PostCard uses to render the
// article card treatment.
export function WriteArticlePage() {
  const navigate = useNavigate();
  const createPost = useCreatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PostCategory>("LOCAL_NEWS");
  const [body, setBody] = useState("");
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

    if (!title.trim() || !body.trim()) {
      setError("Please fill in a title and the article body.");
      return;
    }

    try {
      const created = await createPost.mutateAsync({
        title: title.trim(),
        content: body.trim(),
        category,
        mediaFile: imageFile ?? undefined,
      });
      navigate(`/news#post-${created.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish the article");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-semibold text-agora-text">Write an article</h1>
      <p className="mb-4 text-sm text-agora-muted">Published to the News page under the category you pick below.</p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl"
      >
        <label className={labelClasses}>
          Headline
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What happened?"
            className={`${fieldClasses} text-base font-semibold`}
            style={{ fontFamily: "Wellfleet, serif" }}
          />
        </label>

        <label className={labelClasses}>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value as PostCategory)} className={fieldClasses}>
            {NEWS_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {imagePreviewUrl ? (
          <div className="relative w-full">
            <img src={imagePreviewUrl} alt="" className="max-h-56 w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove thumbnail"
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
            Add a thumbnail
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        <label className={labelClasses}>
          Article
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write the full story…"
            rows={10}
            className={fieldClasses}
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={createPost.isPending}
          className="self-start rounded-full bg-agora px-4 py-2 text-sm font-medium text-agora-on hover:bg-agora-hover disabled:opacity-50"
        >
          {createPost.isPending ? "Publishing..." : "Publish article"}
        </button>
      </form>
    </div>
  );
}
