import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { generateAccessToken } from '../../lib/jwt.js';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const note = {
    findFirst: vi.fn(),
  };
  const sharedLink = {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  };
  return {
    default: { note, sharedLink },
  };
});

import prisma from '../../lib/prisma.js';

type MockNote = { findFirst: ReturnType<typeof vi.fn> };
type MockSharedLink = {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const mockNote = (prisma as unknown as { note: MockNote }).note;
const mockSharedLink = (prisma as unknown as { sharedLink: MockSharedLink }).sharedLink;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const NOTE_ID = 'note-1';
const TOKEN = 'a'.repeat(64);

const mockNoteRow = {
  id: NOTE_ID,
  userId: USER_ID,
  title: 'Test Note',
  content: 'Hello world',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockSharedLinkRow = {
  id: 'link-1',
  noteId: NOTE_ID,
  token: TOKEN,
  expiresAt: null,
  revokedAt: null,
  viewCount: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  note: mockNoteRow,
};

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

// ─── POST /api/notes/:id/share ────────────────────────────────────────────────

describe('POST /api/notes/:id/share', () => {
  it('201 — generates share link without expiry', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockSharedLink.create.mockResolvedValue(mockSharedLinkRow);

    const res = await request(app).post(`/api/notes/${NOTE_ID}/share`).set(auth()).send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toHaveLength(64);
    expect(res.body.data.shareUrl).toContain('/share/');
    expect(res.body.data.expiresAt).toBeNull();
  });

  it('201 — generates share link with expiry', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockSharedLink.create.mockResolvedValue({ ...mockSharedLinkRow, expiresAt: new Date(future) });

    const res = await request(app)
      .post(`/api/notes/${NOTE_ID}/share`)
      .set(auth())
      .send({ expiresAt: future });

    expect(res.status).toBe(201);
    expect(res.body.data.expiresAt).not.toBeNull();
  });

  it('403 — sharing another user note', async () => {
    mockNote.findFirst.mockResolvedValue({ ...mockNoteRow, userId: OTHER_USER_ID });

    const res = await request(app).post(`/api/notes/${NOTE_ID}/share`).set(auth()).send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('404 — note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app).post(`/api/notes/no-such/share`).set(auth()).send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('404 — soft-deleted note', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app).post(`/api/notes/${NOTE_ID}/share`).set(auth()).send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('401 — no auth', async () => {
    const res = await request(app).post(`/api/notes/${NOTE_ID}/share`).send({});
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/share/:token ─────────────────────────────────────────────────

describe('DELETE /api/share/:token', () => {
  it('204 — owner revokes link', async () => {
    mockSharedLink.findUnique.mockResolvedValue(mockSharedLinkRow);
    mockSharedLink.update.mockResolvedValue({ ...mockSharedLinkRow, revokedAt: new Date() });

    const res = await request(app).delete(`/api/share/${TOKEN}`).set(auth());

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('403 — non-owner tries to revoke', async () => {
    mockSharedLink.findUnique.mockResolvedValue(mockSharedLinkRow);

    const res = await request(app).delete(`/api/share/${TOKEN}`).set(auth(otherToken));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('404 — unknown token', async () => {
    mockSharedLink.findUnique.mockResolvedValue(null);

    const res = await request(app).delete(`/api/share/no-such-token`).set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('401 — no auth', async () => {
    const res = await request(app).delete(`/api/share/${TOKEN}`);
    expect(res.status).toBe(401);
  });
});

// ─── GET /public/share/:token ─────────────────────────────────────────────────

describe('GET /public/share/:token', () => {
  it('200 — valid token returns note with viewCount', async () => {
    mockSharedLink.findUnique.mockResolvedValue(mockSharedLinkRow);
    mockSharedLink.update.mockResolvedValue({ ...mockSharedLinkRow, viewCount: 1 });

    const res = await request(app).get(`/public/share/${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(NOTE_ID);
    expect(res.body.data.title).toBe('Test Note');
    expect(res.body.data.content).toBe('Hello world');
    expect(res.body.data.viewCount).toBe(1);
  });

  it('403 — expired token', async () => {
    const pastDate = new Date(Date.now() - 1000);
    mockSharedLink.findUnique.mockResolvedValue({ ...mockSharedLinkRow, expiresAt: pastDate });

    const res = await request(app).get(`/public/share/${TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Link has expired');
  });

  it('403 — revoked token', async () => {
    mockSharedLink.findUnique.mockResolvedValue({
      ...mockSharedLinkRow,
      revokedAt: new Date(Date.now() - 1000),
    });

    const res = await request(app).get(`/public/share/${TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Link has been revoked');
  });

  it('403 — soft-deleted note', async () => {
    mockSharedLink.findUnique.mockResolvedValue({
      ...mockSharedLinkRow,
      note: { ...mockNoteRow, deletedAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app).get(`/public/share/${TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Note is no longer available');
  });

  it('404 — unknown token', async () => {
    mockSharedLink.findUnique.mockResolvedValue(null);

    const res = await request(app).get(`/public/share/no-such-token`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/notes/:id/shares ────────────────────────────────────────────────

describe('GET /api/notes/:id/shares', () => {
  it('200 — owner gets list of active links', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockSharedLink.findMany.mockResolvedValue([mockSharedLinkRow]);

    const res = await request(app).get(`/api/notes/${NOTE_ID}/shares`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].token).toBe(TOKEN);
    expect(res.body.data[0].viewCount).toBe(0);
  });

  it('200 — owner gets empty list when no links exist', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockSharedLink.findMany.mockResolvedValue([]);

    const res = await request(app).get(`/api/notes/${NOTE_ID}/shares`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('403 — non-owner cannot list links', async () => {
    mockNote.findFirst.mockResolvedValue({ ...mockNoteRow, userId: OTHER_USER_ID });

    const res = await request(app).get(`/api/notes/${NOTE_ID}/shares`).set(auth());

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('404 — note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app).get(`/api/notes/no-such/shares`).set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('401 — no auth', async () => {
    const res = await request(app).get(`/api/notes/${NOTE_ID}/shares`);
    expect(res.status).toBe(401);
  });
});

// ─── Concurrent view count ────────────────────────────────────────────────────

describe('Atomic view count increment', () => {
  it('increments viewCount atomically for two concurrent requests', async () => {
    mockSharedLink.findUnique.mockResolvedValue(mockSharedLinkRow);
    let count = 0;
    mockSharedLink.update.mockImplementation(() => {
      count += 1;
      return Promise.resolve({ ...mockSharedLinkRow, viewCount: count });
    });

    const [res1, res2] = await Promise.all([
      request(app).get(`/public/share/${TOKEN}`),
      request(app).get(`/public/share/${TOKEN}`),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(mockSharedLink.update).toHaveBeenCalledTimes(2);
    expect(
      mockSharedLink.update.mock.calls.every((call: unknown[]) => {
        const arg = call[0] as { data: { viewCount: { increment: number } } };
        return arg.data.viewCount.increment === 1;
      }),
    ).toBe(true);
  });
});
