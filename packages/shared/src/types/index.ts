import type { z } from 'zod';
import type {
  createUserSchema,
  updateUserSchema,
  userResponseSchema,
} from '../schemas/user.js';
import type {
  createNoteSchema,
  updateNoteSchema,
  noteResponseSchema,
} from '../schemas/note.js';
import type {
  createTagSchema,
  updateTagSchema,
  tagResponseSchema,
} from '../schemas/tag.js';
import type {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  logoutSchema,
  authResponseSchema,
  tokenPayloadSchema,
} from '../schemas/auth.js';

// User types
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

// Note types
export type CreateNoteDto = z.infer<typeof createNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
export type NoteResponse = z.infer<typeof noteResponseSchema>;

// Tag types
export type CreateTagDto = z.infer<typeof createTagSchema>;
export type UpdateTagDto = z.infer<typeof updateTagSchema>;
export type TagResponse = z.infer<typeof tagResponseSchema>;

// Auth types
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

// API response envelope
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
