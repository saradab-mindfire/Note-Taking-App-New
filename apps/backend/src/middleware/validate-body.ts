import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with the first validation error message if validation fails.
 * Replaces req.body with the parsed (coerced) value on success.
 *
 * Usage:
 *   router.post('/register', validateBody(RegisterSchema), registerHandler);
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error.issues[0]?.message ?? 'Invalid input',
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
