import { useState } from "react";
import { Feed } from "../components/Feed";
import { useSavedPosts } from "../hooks/usePosts";

export function SavedPostsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useSavedPosts({ page });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <section className="rounded-3xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
        <h1 className="text-3xl font-semibold text-agora-text">Saved posts</h1>
        <p className="mt-1 text-agora-muted">Posts you've bookmarked, newest first.</p>
      </section>

      <Feed
        items={(data?.data ?? []).map((post) => ({ post }))}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        pagination={data?.pagination}
        onPageChange={setPage}
        showReasons={false}
      />
    </div>
  );
}
