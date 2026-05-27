import { randomInt } from 'node:crypto';
import type { Request, Response } from 'express';
import { ForgotPasswordSchema, ResetPasswordSchema } from '@notepad/shared';
import prisma from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';

const OTP_EXPIRY_MINUTES = 15;

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit OTP for the given email and logs it to console.
 * Always returns 200 to prevent user enumeration.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    });
    return;
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Check whether the user exists — but do NOT reveal this in the response
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    const code = String(randomInt(100000, 1000000)); // 6-digit: 100000–999999
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert: replace any existing OTP for this email
    await prisma.passwordResetOtp.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, code, expiresAt },
      update: { code, expiresAt, usedAt: null },
    });

    // Log OTP to console (email delivery deferred to a future ticket)
    console.log(`[OTP] Reset code for ${normalizedEmail}: ${code}`);
  }

  // Always 200 — do not reveal whether email is registered
  res.status(200).json({ success: true });
}

// ─── Reset Password ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/reset-password
 * Validates the OTP, updates the user's password, and marks the OTP as used.
 * Returns 400 for expired, invalid, or already-used OTPs.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    });
    return;
  }

  const { email, otp, newPassword } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const record = await prisma.passwordResetOtp.findUnique({
    where: { email: normalizedEmail },
  });

  const isInvalid =
    !record ||
    record.code !== otp ||
    record.expiresAt < new Date() ||
    record.usedAt !== null;

  if (isInvalid) {
    res.status(400).json({ success: false, error: 'OTP is invalid or has expired' });
    return;
  }

  const passwordHash = await hashPassword(newPassword);

  // Update password and mark OTP as used in parallel
  await Promise.all([
    prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    }),
    prisma.passwordResetOtp.update({
      where: { email: normalizedEmail },
      data: { usedAt: new Date() },
    }),
  ]);

  res.status(200).json({ success: true });
}
