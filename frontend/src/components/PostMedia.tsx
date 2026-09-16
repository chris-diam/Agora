import { resolveMediaUrl } from "../api/client";
import { getYouTubeVideoId } from "../utils/media";
import { LinkIcon } from "./icons";
import type { Post } from "../types";

interface PostMediaProps {
  mediaUrl: Post["mediaUrl"];
  mediaType: Post["mediaType"];
}

export function PostMedia({ mediaUrl, mediaType }: PostMediaProps) {
  if (!mediaUrl || !mediaType) return null;

  if (mediaType === "IMAGE") {
    return <img src={resolveMediaUrl(mediaUrl) ?? mediaUrl} alt="" className="mb-3 max-h-[32rem] w-full rounded-xl object-cover" />;
  }

  if (mediaType === "VIDEO") {
    return (
      <video src={resolveMediaUrl(mediaUrl) ?? mediaUrl} controls className="mb-3 max-h-[32rem] w-full rounded-xl" />
    );
  }

  const youTubeId = getYouTubeVideoId(mediaUrl);
  if (youTubeId) {
    return (
      <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${youTubeId}`}
          title="Embedded video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-3 flex items-center gap-2 truncate rounded-xl border border-agora-border bg-agora-surface px-3 py-2 text-sm text-agora hover:underline"
    >
      <LinkIcon className="h-4 w-4 shrink-0" />
      <span className="truncate">{mediaUrl}</span>
    </a>
  );
}
