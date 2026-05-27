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
  hashPassword: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
  comparePassword: vi.fn(),
}));

import prisma from '../../lib/prisma.js';

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  passwordResetOtp: { upsert: ReturnType<typeof vi.fn> };
};

const MOCK_USER = { id: 'user-abc', email: 'alice@example.com', passwordHash: 'hash' };

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.passwordResetOtp.upsert.mockResolvedValue({});
});

describe('POST /api/auth/forgot-password', () => {
  it('200 — generates and logs OTP for registered email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[OTP]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('alice@example.com'));

    consoleSpy.mockRestore();
  });

  it('200 — unknown email returns success silently (anti-enumeration)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(mockPrisma.passwordResetOtp.upsert).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('OTP upserted with 15-min expiry for registered email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@example.com' });

    expect(mockPrisma.passwordResetOtp.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'alice@example.com' },
        create: expect.objectContaining({
          email: 'alice@example.com',
          code: expect.stringMatching(/^\d{6}$/),
          expiresAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          code: expect.stringMatching(/^\d{6}$/),
          usedAt: null,
        }),
      }),
    );
  });

  it('400 — missing email field', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
