import { z } from 'zod';

export const createShareLinkSchema = z.object({
  expiresAt: z.string().datetime({ message: 'expiresAt must be a valid ISO datetime' }).optional(),
});

export const shareLinkResponseSchema = z.object({
  token: z.string(),
  shareUrl: z.string(),
  expiresAt: z.coerce.date().nullable(),
});

export const publicNoteResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  viewCount: z.number().int().nonnegative(),
});
