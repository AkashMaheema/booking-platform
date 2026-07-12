/**
 * Standardised pagination metadata — identical shape on every list endpoint.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standardised paginated response wrapper.
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Build pagination metadata from the current query + total count.
 *
 * Handles the edge case where total = 0 (returns totalPages = 0,
 * not Math.ceil(0/limit) = 0, which is correct already).
 */
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    page: safePage,
    limit: safeLimit,
    totalItems: total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

/**
 * Calculate the Prisma `skip` value from page + limit.
 */
export function calcSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * Math.min(Math.max(1, limit), 100);
}
