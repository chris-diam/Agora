import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useComments, useCreateComment, useDeleteComment } from "../hooks/useComments";
import { useDeletePost, useLikePost } from "../hooks/usePosts";
import { Avatar } from "./Avatar";
import type { Post } from "../types";

interface PostCardProps {
  post: Post;
  reason?: string;
}

export function PostCard({ post, reason }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();
  const [showComments, setShowComments] = useState(false);
  const isOwner = user?.id === post.authorId;

  return (
    <article className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
      {reason && (
        <p className="mb-3 flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {reason}
        </p>
      )}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-2.5">
          <Avatar name={post.author.displayName} imageUrl={post.author.profileImageUrl} size="sm" />
          <span>
            <span className="font-medium text-gray-900 hover:underline">{post.author.displayName}</span>{" "}
            <span className="text-xs text-gray-400">@{post.author.username}</span>
          </span>
        </Link>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
          {post.category}
        </span>
      </div>
      <p className="mb-3 whitespace-pre-line text-gray-800">{post.content}</p>
      {(post.city || post.country) && (
        <p className="mb-2 text-xs text-gray-400">{[post.city, post.country].filter(Boolean).join(", ")}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <button
          type="button"
          onClick={() => likeMutation.mutate({ id: post.id, liked: Boolean(post.likedByViewer) })}
          disabled={!isAuthenticated}
          className={post.likedByViewer ? "font-medium text-emerald-600" : "disabled:opacity-50"}
        >
          {post.likedByViewer ? "Liked" : "Like"} ({post.likesCount})
        </button>
        <button type="button" onClick={() => setShowComments((value) => !value)}>
          Comments ({post.commentsCount})
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={() => deleteMutation.mutate(post.id)}
            className="ml-auto text-red-500 hover:text-red-600"
          >
            Delete
          </button>
        )}
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
    <div className="mt-3 flex flex-col gap-2 border-t border-gray-900/10 pt-3">
      {isLoading && <p className="text-xs text-gray-400">Loading comments...</p>}
      {(data?.data ?? []).map((comment) => (
        <div key={comment.id} className="flex items-start gap-2 text-sm">
          <Avatar name={comment.author.displayName} imageUrl={comment.author.profileImageUrl} size="sm" />
          <p className="flex-1">
            <span className="font-medium text-gray-900">{comment.author.displayName}</span>{" "}
            <span className="text-gray-700">{comment.content}</span>
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
      {(data?.data?.length ?? 0) === 0 && !isLoading && <p className="text-xs text-gray-400">No comments yet.</p>}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mt-1 flex gap-2">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a comment..."
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          />
          <button
            type="submit"
            disabled={createComment.isPending || !content.trim()}
            className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
