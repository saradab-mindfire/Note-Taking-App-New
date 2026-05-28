import { z } from 'zod';

export const noteVersionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
});

export const noteVersionListSchema = z.object({
  versions: z.array(noteVersionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});

export const noteVersionListQuerySchema = z.object({
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
