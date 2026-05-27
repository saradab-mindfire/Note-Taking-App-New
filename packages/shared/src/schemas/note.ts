import { z } from 'zod';
import { tagResponseSchema } from './tag.js';

// ─── List Notes Query ─────────────────────────────────────────────────────────

export const listNotesQuerySchema = z.object({
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
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title'], {
      errorMap: () => ({ message: "sortBy must be 'createdAt', 'updatedAt', or 'title'" }),
    })
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: "sortOrder must be 'asc' or 'desc'" }),
    })
    .default('desc'),
  tags: z
    .string()
    .transform((s) => s.split(',').filter(Boolean))
    .optional(),
  includeDeleted: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .default('false'),
});

// ─── Notes List Response ──────────────────────────────────────────────────────

export const noteListItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  tags: z.array(tagResponseSchema),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const notesListResponseSchema = z.object({
  notes: z.array(noteListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});

// ─── Note CRUD ────────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title is required')
    .max(500, 'Title must be at most 500 characters'),
  content: z.string().default(''),
  tagIds: z.string().array().optional(),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be at most 500 characters')
    .optional(),
  content: z.string().optional(),
  tagIds: z.string().array().optional(),
});

export const noteResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(tagResponseSchema),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
