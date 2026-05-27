import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
}

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

/**
 * Signs a short-lived access token (default 15 min).
 * Signed with JWT_SECRET.
 */
export function generateAccessToken(payload: JwtPayload): string {
  const secret = getEnv('JWT_SECRET');
  const expiresIn = (process.env['ACCESS_TOKEN_EXPIRY'] ?? '15m') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Signs a long-lived refresh token (default 7 days).
 * Signed with JWT_REFRESH_SECRET.
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const secret = getEnv('JWT_REFRESH_SECRET');
  const expiresIn = (process.env['REFRESH_TOKEN_EXPIRY'] ?? '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies an access token. Throws if expired or tampered.
 */
export function verifyAccessToken(token: string): JwtPayload {
  const secret = getEnv('JWT_SECRET');
  const decoded = jwt.verify(token, secret) as JwtPayload & jwt.JwtPayload;
  return { userId: decoded.userId, email: decoded.email };
}

/**
 * Verifies a refresh token. Throws if expired or tampered.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const secret = getEnv('JWT_REFRESH_SECRET');
  const decoded = jwt.verify(token, secret) as JwtPayload & jwt.JwtPayload;
  return { userId: decoded.userId, email: decoded.email };
}
