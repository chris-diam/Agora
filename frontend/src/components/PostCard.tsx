import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useComments, useCreateComment, useDeleteComment } from "../hooks/useComments";
import { useDeletePost, useLikePost, useSavePost } from "../hooks/usePosts";
import { Avatar } from "./Avatar";
import { BookmarkIcon } from "./icons";
import { PostMedia } from "./PostMedia";
import type { Post } from "../types";

interface PostCardProps {
  post: Post;
  reason?: string;
}

export function PostCard({ post, reason }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const deleteMutation = useDeletePost();
  const [showComments, setShowComments] = useState(false);
  const isOwner = user?.id === post.authorId;

  return (
    <article className="rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl transition-transform duration-200 ease-out hover:scale-[1.015] hover:shadow-lg hover:shadow-black/30 motion-reduce:transition-none motion-reduce:hover:scale-100">
      {reason && (
        <p className="mb-3 flex items-center gap-1.5 rounded-full bg-agora-light px-3 py-1 text-xs font-medium text-agora-hover">
          {reason}
        </p>
      )}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-2.5">
          <Avatar name={post.author.displayName} imageUrl={post.author.profileImageUrl} size="sm" />
          <span>
            <span className="font-medium text-agora-text hover:underline">{post.author.displayName}</span>{" "}
            <span className="text-xs text-agora-dim">@{post.author.username}</span>
          </span>
        </Link>
        <span className="shrink-0 rounded-full bg-agora-light px-2.5 py-0.5 text-xs text-agora-muted">
          {post.category}
        </span>
      </div>
      <p className="mb-3 whitespace-pre-line text-agora-text">{post.content}</p>
      <PostMedia mediaUrl={post.mediaUrl} mediaType={post.mediaType} />
      {(post.city || post.country) && (
        <p className="mb-2 text-xs text-agora-dim">{[post.city, post.country].filter(Boolean).join(", ")}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-agora-muted">
        <button
          type="button"
          onClick={() => likeMutation.mutate({ id: post.id, liked: Boolean(post.likedByViewer) })}
          disabled={!isAuthenticated}
          className={post.likedByViewer ? "font-medium text-agora" : "disabled:opacity-50"}
        >
          {post.likedByViewer ? "Liked" : "Like"} ({post.likesCount})
        </button>
        <button type="button" onClick={() => setShowComments((value) => !value)}>
          Comments ({post.commentsCount})
        </button>
        <span className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => saveMutation.mutate({ id: post.id, saved: Boolean(post.savedByViewer) })}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1 ${post.savedByViewer ? "text-agora" : ""} disabled:opacity-50`}
            aria-label={post.savedByViewer ? "Unsave post" : "Save post"}
          >
            <BookmarkIcon className="h-4 w-4" filled={post.savedByViewer} />
            {post.savedByViewer ? "Saved" : "Save"}
          </button>
          {isOwner && (
            <button type="button" onClick={() => deleteMutation.mutate(post.id)} className="text-red-500 hover:text-red-600">
              Delete
            </button>
          )}
        </span>
      </div>
      {showComments && <CommentSection postId={post.id} />}
    </article>
  );
}

function CommentSection({ postId }: { postId: string }) {
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading } = useComments(postId, true);
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [content, setContent] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;
    await createComment.mutateAsync(content.trim());
    setContent("");
  };

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-agora-border pt-3">
      {isLoading && <p className="text-xs text-agora-dim">Loading comments...</p>}
      {(data?.data ?? []).map((comment) => (
        <div key={comment.id} className="flex items-start gap-2 text-sm">
          <Avatar name={comment.author.displayName} imageUrl={comment.author.profileImageUrl} size="sm" />
          <p className="flex-1">
            <span className="font-medium text-agora-text">{comment.author.displayName}</span>{" "}
            <span className="text-agora-muted">{comment.content}</span>
          </p>
          {user?.id === comment.authorId && (
            <button
              type="button"
              onClick={() => deleteComment.mutate(comment.id)}
              className="shrink-0 text-xs text-red-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
      ))}
      {(data?.data?.length ?? 0) === 0 && !isLoading && <p className="text-xs text-agora-dim">No comments yet.</p>}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mt-1 flex gap-2">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a comment..."
            className="w-full rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={createComment.isPending || !content.trim()}
            className="shrink-0 rounded-full bg-agora px-3 py-1.5 text-sm text-agora-on hover:bg-agora-hover disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
