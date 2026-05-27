import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

vi.mock('../../lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordResetOtp: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2b$12$newhash'),
  comparePassword: vi.fn(),
}));

import prisma from '../../lib/prisma.js';

const mockPrisma = prisma as unknown as {
  user: { update: ReturnType<typeof vi.fn> };
  passwordResetOtp: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const VALID_OTP_RECORD = {
  email: 'alice@example.com',
  code: '123456',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
  usedAt: null,
};

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.user.update.mockResolvedValue({});
  mockPrisma.passwordResetOtp.update.mockResolvedValue({});
});

describe('POST /api/auth/reset-password', () => {
  it('200 — resets password with valid OTP', async () => {
    mockPrisma.passwordResetOtp.findUnique.mockResolvedValue(VALID_OTP_RECORD);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', otp: '123456', newPassword: 'newSecure123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('marks OTP as used after successful reset', async () => {
    mockPrisma.passwordResetOtp.findUnique.mockResolvedValue(VALID_OTP_RECORD);

    await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', otp: '123456', newPassword: 'newSecure123' });

    expect(mockPrisma.passwordResetOtp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'alice@example.com' },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
  });

  it('updates user passwordHash with bcrypt hash', async () => {
    mockPrisma.passwordResetOtp.findUnique.mockResolvedValue(VALID_OTP_RECORD);

    await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', otp: '123456', newPassword: 'newSecure123' });

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'alice@example.com' },
        data: { passwordHash: '$2b$12$newhash' },
      }),
    );
  });

  it('400 — expired OTP', async () => {
    mockPrisma.passwordResetOtp.findUnique.mockResolvedValue({
      ...VALID_OTP_RECORD,
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', otp: '123456', newPassword: 'newSecure123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('OTP is invalid or has expired');
  });

  it('400 — invalid (wrong) OTP code', async () => {
    mockPrisma.passwordResetOtp.findUnique.mockResolvedValue(VALID_OTP_RECORD);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', otp: '999999', newPassword: 'newSecure123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('OTP is invalid or has expired');
  });

  it('400 — already-used OTP', async () => {
    mockPrisma.passwordResetOtp.findUnique.mockResolvedValue({
      ...VALID_OTP_RECORD,
      usedAt: new Date(Date.now() - 5000),
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', otp: '123456', newPassword: 'newSecure123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('OTP is invalid or has expired');
  });

  it('400 — no OTP record for email', async () => {
    mockPrisma.passwordResetOtp.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'nobody@example.com', otp: '123456', newPassword: 'newSecure123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('OTP is invalid or has expired');
  });

  it('400 — missing otp field', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', newPassword: 'newSecure123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — new password too short', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'alice@example.com', otp: '123456', newPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
