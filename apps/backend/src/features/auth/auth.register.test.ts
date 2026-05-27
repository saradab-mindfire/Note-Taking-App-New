import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

// Mock Prisma singleton
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

// Mock password utils (speed up tests — skip real bcrypt)
vi.mock('../../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
  comparePassword: vi.fn(),
}));

import prisma from '../../lib/prisma.js';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
  process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
  process.env['REFRESH_TOKEN_EXPIRY'] = '7d';
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('201 — creates user and returns id + email (no passwordHash)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'cuid-abc', email: 'alice@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'securepass123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('cuid-abc');
    expect(res.body.data.email).toBe('alice@example.com');
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('409 — duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing',
      email: 'alice@example.com',
      passwordHash: 'hash',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'securepass123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Email already in use');
  });

  it('400 — missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'securepass123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'notanemail', password: 'securepass123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — password too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('stores email in lowercase', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'cuid-abc', email: 'alice@example.com' });

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'ALICE@EXAMPLE.COM', password: 'securepass123' });

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'alice@example.com' }),
      }),
    );
  });
});
