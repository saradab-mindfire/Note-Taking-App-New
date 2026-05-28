import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { generateAccessToken } from '../../lib/jwt.js';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma.js', () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

import prisma from '../../lib/prisma.js';

type MockPrisma = { $queryRaw: ReturnType<typeof vi.fn> };
const mockPrisma = prisma as unknown as MockPrisma;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-search-1';
const OTHER_USER_ID = 'user-search-2';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'note-1',
  title: 'GraphQL Basics',
  snippet: 'Learn <b>GraphQL</b> from scratch.',
  score: 0.8,
  total_count: BigInt(1),
  ...overrides,
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

let validToken: string;
let otherToken: string;

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
  process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
  process.env['REFRESH_TOKEN_EXPIRY'] = '7d';

  validToken = generateAccessToken({ userId: USER_ID, email: 'alice@example.com' });
  otherToken = generateAccessToken({ userId: OTHER_USER_ID, email: 'bob@example.com' });
});

beforeEach(() => {
  vi.clearAllMocks();
});

const auth = (token = validToken) => ({ Authorization: `Bearer ${token}` });

// ─── GET /api/search ──────────────────────────────────────────────────────────

describe('GET /api/search', () => {
  it('200 — returns matching notes with paginated envelope', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([makeRow()]);

    const res = await request(app).get('/api/search?q=graphql').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.results[0].id).toBe('note-1');
    expect(res.body.data.results[0].title).toBe('GraphQL Basics');
    expect(res.body.data.results[0].snippet).toContain('<b>GraphQL</b>');
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(20);
  });

  it('200 — returns empty results when no matches', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const res = await request(app).get('/api/search?q=nonexistentterm').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it('200 — pagination params applied (page=2, limit=5)', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const res = await request(app).get('/api/search?q=test&page=2&limit=5').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.limit).toBe(5);
  });

  it('200 — soft-deleted notes excluded (query filters by deletedAt IS NULL)', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([makeRow()]);

    const res = await request(app).get('/api/search?q=test').set(auth());

    expect(res.status).toBe(200);
    const sqlArg = mockPrisma.$queryRaw.mock.calls[0];
    expect(JSON.stringify(sqlArg)).toContain('deletedAt');
  });

  it('200 — search is scoped to requesting user (userId in query)', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    await request(app).get('/api/search?q=secret').set(auth(otherToken));

    const sqlArg = mockPrisma.$queryRaw.mock.calls[0];
    expect(JSON.stringify(sqlArg)).toContain(OTHER_USER_ID);
    expect(JSON.stringify(sqlArg)).not.toContain(USER_ID);
  });

  it('401 — no auth token', async () => {
    const res = await request(app).get('/api/search?q=test');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('400 — missing q parameter', async () => {
    const res = await request(app).get('/api/search').set(auth());

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeTruthy();
  });

  it('400 — empty q parameter', async () => {
    const res = await request(app).get('/api/search?q=').set(auth());

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeTruthy();
  });

  it('400 — invalid page parameter (page=0)', async () => {
    const res = await request(app).get('/api/search?q=test&page=0').set(auth());

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — invalid limit parameter (limit=200)', async () => {
    const res = await request(app).get('/api/search?q=test&limit=200').set(auth());

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('relevance — title-match note ranks above content-only match', async () => {
    const titleMatch = makeRow({
      id: 'note-title',
      title: 'TypeScript Guide',
      score: 0.9,
      total_count: BigInt(2),
    });
    const contentMatch = makeRow({
      id: 'note-content',
      title: 'General Coding',
      score: 0.3,
      total_count: BigInt(2),
    });
    mockPrisma.$queryRaw.mockResolvedValue([titleMatch, contentMatch]);

    const res = await request(app).get('/api/search?q=typescript').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.results[0].id).toBe('note-title');
    expect(res.body.data.results[1].id).toBe('note-content');
  });
});
