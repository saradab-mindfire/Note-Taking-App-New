import { z } from 'zod';

// ─── Search Query ─────────────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query is required' })
    .min(1, 'Search query must not be empty'),
  page: z.coerce
    .number({ invalid_type_error: 'page must be a number' })
    .int('page must be an integer')
    .min(1, 'page must be at least 1')
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'limit must be a number' })
    .int('limit must be an integer')
    .min(1, 'limit must be at least 1')
    .max(100, 'limit must be at most 100')
    .default(20),
});

// ─── Search Result ────────────────────────────────────────────────────────────

export const searchResultItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  snippet: z.string(),
  score: z.number(),
});

export const searchResultsResponseSchema = z.object({
  results: z.array(searchResultItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});
