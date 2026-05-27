import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';

/**
 * Validates the Authorization: Bearer <token> header.
 * On success: sets req.user = { userId, email } and calls next().
 * On failure: returns 401 { success: false, error: "Unauthorized" }.
 *
 * Rejects:
 * - Missing Authorization header
 * - Wrong scheme (not "Bearer")
 * - Empty token after "Bearer "
 * - Expired JWT
 * - Tampered / invalid JWT
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}
