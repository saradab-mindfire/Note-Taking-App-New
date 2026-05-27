import type { Request, Response, NextFunction } from 'express';
import type { ZodType, ZodTypeDef } from 'zod';

/**
 * Express middleware factory that validates req.query against a Zod schema.
 * Returns 400 with the first validation error message if validation fails.
 * Stores the parsed (coerced) value at res.locals.validatedQuery on success.
 *
 * Uses ZodType<O, D, unknown> so it accepts schemas with ZodDefault / coercion
 * (where input and output types differ).
 *
 * Usage:
 *   router.get('/', validateQuery(listNotesQuerySchema), listHandler);
 *   // then in handler: const query = res.locals.validatedQuery as ListNotesQuery;
 */
export function validateQuery<O>(schema: ZodType<O, ZodTypeDef, unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error.issues[0]?.message ?? 'Invalid query parameters',
      });
      return;
    }
    res.locals['validatedQuery'] = result.data;
    next();
  };
}
