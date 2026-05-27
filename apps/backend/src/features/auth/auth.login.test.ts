import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
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
  hashPassword: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
  comparePassword: vi.fn(),
}));

import prisma from '../../lib/prisma.js';
import { comparePassword } from '../../lib/password.js';

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  refreshToken: { create: ReturnType<typeof vi.fn> };
};
const mockCompare = comparePassword as ReturnType<typeof vi.fn>;

const MOCK_USER = {
  id: 'user-abc',
  email: 'alice@example.com',
  passwordHash: '$2b$12$hashedpassword',
};

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
  process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
  process.env['REFRESH_TOKEN_EXPIRY'] = '7d';
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.refreshToken.create.mockResolvedValue({});
});

describe('POST /api/auth/login', () => {
  it('200 — returns accessToken and refreshToken on valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockCompare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });

  it('persists refresh token to DB on login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockCompare.mockResolvedValue(true);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'correctpassword' });

    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: MOCK_USER.id }),
      }),
    );
  });

  it('401 — wrong password returns generic error (no user enumeration)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockCompare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('401 — unknown email returns same generic error', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'anypassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('400 — missing password field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — missing email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'somepassword' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
