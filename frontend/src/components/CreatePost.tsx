import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useCreatePost } from "../hooks/usePosts";
import { CameraIcon, CloseIcon, LinkIcon } from "./icons";

interface CreatePostProps {
  onCreated?: () => void;
  /** Publishes into this community's Discussions tab instead of the general feed. */
  communityId?: string;
  placeholder?: string;
}

export function CreatePost({ onCreated, communityId, placeholder = "What's happening?" }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLinkUrl("");
    setShowLinkInput(false);
    setMediaFile(file);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(URL.createObjectURL(file));
  };

  const handleToggleLinkInput = () => {
    clearMedia();
    setShowLinkInput((value) => !value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;

    await createPost.mutateAsync({
      content: content.trim(),
      mediaFile: mediaFile ?? undefined,
      linkUrl: linkUrl.trim() || undefined,
      communityId,
    });

    setContent("");
    clearMedia();
    setShowLinkInput(false);
    setLinkUrl("");
    onCreated?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl"
    >
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
      />

      {mediaFile && mediaPreviewUrl && (
        <div className="relative w-fit">
          {mediaFile.type.startsWith("video/") ? (
            <video src={mediaPreviewUrl} className="max-h-48 rounded-xl" controls />
          ) : (
            <img src={mediaPreviewUrl} alt="" className="max-h-48 rounded-xl" />
          )}
          <button
            type="button"
            onClick={clearMedia}
            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove attachment"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showLinkInput && (
        <input
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder="Paste a YouTube or other link"
          className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
      )}

      <div className="flex items-center gap-1">
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-agora-muted hover:bg-white/5"
          title="Add a photo or video"
        >
          <CameraIcon className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={handleToggleLinkInput}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm hover:bg-white/5 ${
            showLinkInput ? "text-agora" : "text-agora-muted"
          }`}
          title="Add a link"
        >
          <LinkIcon className="h-4.5 w-4.5" />
        </button>

        <button
          type="submit"
          disabled={createPost.isPending || !content.trim()}
          className="ml-auto rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-agora-on hover:bg-agora-hover disabled:opacity-50"
        >
          Post
        </button>
      </div>
      {createPost.isError && <p className="text-sm text-red-500">{createPost.error.message}</p>}
    </form>
  );
}
