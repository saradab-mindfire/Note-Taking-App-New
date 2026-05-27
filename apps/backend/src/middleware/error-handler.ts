import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/app-error.js';

/**
 * Global Express error handler.
 * Catches AppError instances and maps them to the standard JSON envelope.
 * Unrecognised errors fall back to 500 Internal Server Error.
 *
 * Handles status codes including:
 *   400 Bad Request
 *   401 Unauthorized
 *   403 Forbidden
 *   404 Not Found
 *   409 Conflict
 *   410 Gone (e.g. restore window expired)
 *   500 Internal Server Error
 *
 * Register AFTER all routes:
 *   app.use(errorHandler);
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  // Unexpected error — don't leak internals
  console.error('[errorHandler] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}
