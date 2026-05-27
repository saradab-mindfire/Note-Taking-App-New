import type { Request, Response } from 'express';
import { RegisterSchema, LoginSchema, RefreshSchema, LogoutSchema } from '@notepad/shared';
import prisma from '../../lib/prisma.js';
import { hashPassword, comparePassword } from '../../lib/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';

// ─── Register ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account.
 * Returns 201 { success, data: { id, email } } on success.
 * Returns 400 on invalid input, 409 on duplicate email.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Email already in use' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash },
    select: { id: true, email: true },
  });

  res.status(201).json({ success: true, data: user });
}

// ─── Login ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticates user and issues access + refresh tokens.
 * Returns 200 { success, data: { accessToken, refreshToken } } on success.
 * Returns 400 on invalid input, 401 on wrong credentials.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Use constant-time comparison even when user is not found (prevents user enumeration)
  const isValid = user ? await comparePassword(password, user.passwordHash) : false;

  if (!user || !isValid) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  });

  res.status(200).json({ success: true, data: { accessToken, refreshToken } });
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Exchanges a valid refresh token for a new access token.
 * Returns 200 { success, data: { accessToken } } on success.
 * Returns 400 on missing field, 401 on invalid/expired/revoked token.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    });
    return;
  }

  const { refreshToken } = parsed.data;

  let payload: { userId: string; email: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ success: false, error: 'Refresh token expired or invalid' });
    return;
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

  if (!storedToken || storedToken.revokedAt !== null || storedToken.expiresAt < new Date()) {
    res.status(401).json({ success: false, error: 'Refresh token expired or invalid' });
    return;
  }

  const accessToken = generateAccessToken({ userId: payload.userId, email: payload.email });

  res.status(200).json({ success: true, data: { accessToken } });
}

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 * Revokes a refresh token. Idempotent — returns 200 even if token is unknown.
 * Returns 400 on missing field.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const parsed = LogoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    });
    return;
  }

  const { refreshToken } = parsed.data;

  // updateMany is safe — no-op if token not found, idempotent if already revoked
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  res.status(200).json({ success: true });
}
