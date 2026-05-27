import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name must be at most 50 characters'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #FF5733)')
    .default('#6366f1'),
});

export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be at most 50 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #FF5733)')
    .optional(),
});

export const tagResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  color: z.string(),
});
