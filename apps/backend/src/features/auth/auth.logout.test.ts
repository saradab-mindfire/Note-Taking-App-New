import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

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
  refreshToken: { updateMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
});

describe('POST /api/auth/logout', () => {
  it('200 — revokes a valid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'some-valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ token: 'some-valid-token', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('200 — idempotent: already-revoked token returns success', async () => {
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 }); // no rows updated

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'already-revoked-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('200 — unknown token still returns success (prevents probing)', async () => {
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'token-not-in-db' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400 — missing refreshToken field', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
