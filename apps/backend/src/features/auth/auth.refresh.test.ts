import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { generateRefreshToken } from '../../lib/jwt.js';

vi.mock('../../lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../lib/password.js', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

import prisma from '../../lib/prisma.js';

const mockPrisma = prisma as unknown as {
  refreshToken: { findUnique: ReturnType<typeof vi.fn> };
};

const PAYLOAD = { userId: 'user-abc', email: 'alice@example.com' };

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
  process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
  process.env['REFRESH_TOKEN_EXPIRY'] = '7d';
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/refresh', () => {
  it('200 — returns new accessToken for valid refresh token', async () => {
    const refreshToken = generateRefreshToken(PAYLOAD);
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      token: refreshToken,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  it('new access token has ~15 min expiry', async () => {
    const refreshToken = generateRefreshToken(PAYLOAD);
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      token: refreshToken,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    // Decode the new access token to check exp
    const [, payload] = res.body.data.accessToken.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const expectedExp = Math.floor(Date.now() / 1000) + 15 * 60;
    expect(decoded.exp).toBeGreaterThan(expectedExp - 5);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
  });

  it('401 — expired refresh token (JWT exp)', async () => {
    process.env['REFRESH_TOKEN_EXPIRY'] = '-1s';
    const expiredToken = generateRefreshToken(PAYLOAD);
    process.env['REFRESH_TOKEN_EXPIRY'] = '7d';

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Refresh token expired or invalid');
  });

  it('401 — revoked refresh token (revokedAt set)', async () => {
    const refreshToken = generateRefreshToken(PAYLOAD);
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      token: refreshToken,
      revokedAt: new Date(Date.now() - 1000),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Refresh token expired or invalid');
  });

  it('401 — tampered token (invalid signature)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'totally.fake.token' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Refresh token expired or invalid');
  });

  it('400 — missing refreshToken field', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
