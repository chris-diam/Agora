import { Pagination } from "./Pagination";
import { PostCard } from "./PostCard";
import type { PaginationMeta, Post } from "../types";

export interface FeedEntry {
  post: Post;
  reason?: string;
}

interface FeedProps {
  items: FeedEntry[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  /** The "Explain recommendations" toggle — hides the reason line when off. */
  showReasons?: boolean;
}

export function Feed({
  items,
  isLoading,
  isError,
  errorMessage,
  pagination,
  onPageChange,
  showReasons = true,
}: FeedProps) {
  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (isError) return <p className="text-red-500">{errorMessage ?? "Something went wrong."}</p>;
  if (items.length === 0) return <p className="text-gray-500">Nothing to show yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      {items.map(({ post, reason }) => (
        <PostCard key={post.id} post={post} reason={showReasons ? reason : undefined} />
      ))}
      {pagination && onPageChange && <Pagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
}
