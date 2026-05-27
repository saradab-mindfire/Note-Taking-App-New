import { z } from 'zod';
import { tagResponseSchema } from './tag.js';

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
