import type { PaginationMeta } from "../types";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-2 text-sm text-agora-muted">
      <button
        type="button"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrevPage}
        className="rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1 hover:bg-agora-surface disabled:opacity-40 disabled:hover:bg-agora-surface/80"
      >
        Previous
      </button>
      <span>
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={!pagination.hasNextPage}
        className="rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1 hover:bg-agora-surface disabled:opacity-40 disabled:hover:bg-agora-surface/80"
      >
        Next
      </button>
    </div>
  );
}
