import type { PaginationMeta } from "../types";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-2 text-sm text-gray-600">
      <button
        type="button"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrevPage}
        className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 hover:bg-white disabled:opacity-40 disabled:hover:bg-white/70"
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
        className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 hover:bg-white disabled:opacity-40 disabled:hover:bg-white/70"
      >
        Next
      </button>
    </div>
  );
}
