import { PaginationMeta } from "./apiResponse";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Accepts req.query directly — Express types query values as
// string | ParsedQs | string[] | ParsedQs[] | undefined, so we coerce
// defensively rather than assuming plain strings.
export const getPaginationParams = (query: Record<string, unknown>): PaginationParams => {
  const rawPage = typeof query.page === "string" ? query.page : "1";
  const rawLimitInput = typeof query.limit === "string" ? query.limit : String(DEFAULT_LIMIT);

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const rawLimit = parseInt(rawLimitInput, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
