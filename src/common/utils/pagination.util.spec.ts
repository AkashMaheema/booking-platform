import { buildPaginationMeta, calcSkip, PaginationMeta } from './pagination.util';

describe('Pagination Utility', () => {
  // ─── buildPaginationMeta ────────────────────────────────────────────────────

  describe('buildPaginationMeta', () => {
    it('returns correct meta for first page with multiple pages', () => {
      const meta: PaginationMeta = buildPaginationMeta(1, 10, 45);

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.totalItems).toBe(45);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('returns correct meta for last page', () => {
      const meta = buildPaginationMeta(5, 10, 45);

      expect(meta.page).toBe(5);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('returns correct meta for middle page', () => {
      const meta = buildPaginationMeta(3, 10, 50);

      expect(meta.page).toBe(3);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('handles empty results (totalItems = 0)', () => {
      const meta = buildPaginationMeta(1, 10, 0);

      expect(meta.totalItems).toBe(0);
      expect(meta.totalPages).toBe(0);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('handles single page result (totalItems <= limit)', () => {
      const meta = buildPaginationMeta(1, 10, 7);

      expect(meta.totalPages).toBe(1);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('caps limit at 100', () => {
      // If limit = 200 is passed (shouldn't happen after DTO validation, but test the util)
      const meta = buildPaginationMeta(1, 200, 500);

      expect(meta.limit).toBe(100);
      expect(meta.totalPages).toBe(5);
    });

    it('handles exactly divisible total', () => {
      const meta = buildPaginationMeta(2, 10, 20);

      expect(meta.totalPages).toBe(2);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('calculates totalPages correctly with remainder', () => {
      const meta = buildPaginationMeta(1, 10, 21);

      expect(meta.totalPages).toBe(3); // ceil(21/10)
    });
  });

  // ─── calcSkip ───────────────────────────────────────────────────────────────

  describe('calcSkip', () => {
    it('returns 0 for page 1', () => {
      expect(calcSkip(1, 10)).toBe(0);
    });

    it('returns correct skip for page 2', () => {
      expect(calcSkip(2, 10)).toBe(10);
    });

    it('returns correct skip for page 3', () => {
      expect(calcSkip(3, 25)).toBe(50);
    });

    it('handles large page numbers', () => {
      expect(calcSkip(10, 10)).toBe(90);
    });

    it('caps limit at 100 for skip calculation', () => {
      // With limit=200 (invalid but test the utility), it should be capped
      expect(calcSkip(2, 200)).toBe(100); // (2-1) * min(200,100)
    });

    it('enforces minimum page of 1', () => {
      // Page 0 or negative defaults to 1
      expect(calcSkip(0, 10)).toBe(0); // max(1,0)-1 = 0
    });
  });

  // ─── Integration: meta structure ────────────────────────────────────────────

  describe('PaginationMeta shape', () => {
    it('always contains all 6 required fields', () => {
      const meta = buildPaginationMeta(1, 10, 100);

      expect(meta).toHaveProperty('page');
      expect(meta).toHaveProperty('limit');
      expect(meta).toHaveProperty('totalItems');
      expect(meta).toHaveProperty('totalPages');
      expect(meta).toHaveProperty('hasNextPage');
      expect(meta).toHaveProperty('hasPreviousPage');
    });

    it('hasNextPage and hasPreviousPage are always booleans', () => {
      const meta = buildPaginationMeta(2, 10, 30);

      expect(typeof meta.hasNextPage).toBe('boolean');
      expect(typeof meta.hasPreviousPage).toBe('boolean');
    });
  });
});
