import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { generateAccessToken } from '../../lib/jwt.js';

// ─── Mock node-cron (prevent cron from running in tests) ──────────────────────

vi.mock('node-cron', () => ({ default: { schedule: vi.fn() } }));

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const note = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  };
  const noteTag = {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  };
  const noteVersion = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  };
  return {
    default: {
      note,
      noteTag,
      noteVersion,
      $transaction: vi.fn((cbOrQueries: unknown) => {
        if (Array.isArray(cbOrQueries)) {
          return Promise.all(cbOrQueries);
        }
        return (cbOrQueries as (tx: unknown) => unknown)({ note, noteTag, noteVersion });
      }),
    },
  };
});

import prisma from '../../lib/prisma.js';

type MockNote = {
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
};
type MockNoteVersion = {
  findMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
};

const mockNote = (prisma as unknown as { note: MockNote }).note;
const mockNoteVersion = (prisma as unknown as { noteVersion: MockNoteVersion }).noteVersion;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const NOTE_ID = 'note-1';
const VERSION_ID = 'version-1';

const mockNoteRow = {
  id: NOTE_ID,
  userId: USER_ID,
  title: 'Test Note',
  content: 'Hello world',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockVersionRow = {
  id: VERSION_ID,
  noteId: NOTE_ID,
  title: 'Old Title',
  content: 'Old content',
  createdAt: new Date('2026-01-01'),
};

const mockNoteWithTags = { ...mockNoteRow, tags: [] };

// ─── Auth helpers ─────────────────────────────────────────────────────────────

let validToken: string;

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
  process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
  process.env['REFRESH_TOKEN_EXPIRY'] = '7d';

  validToken = generateAccessToken({ userId: USER_ID, email: 'alice@example.com' });
});

beforeEach(() => {
  vi.clearAllMocks();
});

const auth = () => ({ Authorization: `Bearer ${validToken}` });

// ─── GET /api/notes/:id/versions ──────────────────────────────────────────────

describe('GET /api/notes/:id/versions', () => {
  it('200 — returns paginated version list', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findMany.mockResolvedValue([mockVersionRow]);
    mockNoteVersion.count.mockResolvedValue(1);

    const res = await request(app).get(`/api/notes/${NOTE_ID}/versions`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.versions).toHaveLength(1);
    expect(res.body.data.versions[0].id).toBe(VERSION_ID);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(20);
  });

  it('200 — returns empty list when note has no versions', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findMany.mockResolvedValue([]);
    mockNoteVersion.count.mockResolvedValue(0);

    const res = await request(app).get(`/api/notes/${NOTE_ID}/versions`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.versions).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it('404 — note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app).get(`/api/notes/no-such/versions`).set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Note not found');
  });

  it('404 — note belongs to another user', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const otherToken = generateAccessToken({ userId: OTHER_USER_ID, email: 'bob@example.com' });
    const res = await request(app)
      .get(`/api/notes/${NOTE_ID}/versions`)
      .set({ Authorization: `Bearer ${otherToken}` });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('401 — no auth', async () => {
    const res = await request(app).get(`/api/notes/${NOTE_ID}/versions`);
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/notes/:id/versions/:versionId ───────────────────────────────────

describe('GET /api/notes/:id/versions/:versionId', () => {
  it('200 — returns a single version', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(mockVersionRow);

    const res = await request(app)
      .get(`/api/notes/${NOTE_ID}/versions/${VERSION_ID}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(VERSION_ID);
    expect(res.body.data.title).toBe('Old Title');
    expect(res.body.data.content).toBe('Old content');
  });

  it('404 — version not found', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/notes/${NOTE_ID}/versions/no-such-version`)
      .set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Version not found');
  });

  it('404 — note belongs to another user', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/notes/${NOTE_ID}/versions/${VERSION_ID}`)
      .set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Note not found');
  });

  it('401 — no auth', async () => {
    const res = await request(app).get(`/api/notes/${NOTE_ID}/versions/${VERSION_ID}`);
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/notes/:id/versions/:versionId/restore ─────────────────────────

describe('POST /api/notes/:id/versions/:versionId/restore', () => {
  it('200 — restores note content from version', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(mockVersionRow);
    mockNoteVersion.create.mockResolvedValue({});
    mockNote.update.mockResolvedValue(mockNoteWithTags);

    const res = await request(app)
      .post(`/api/notes/${NOTE_ID}/versions/${VERSION_ID}/restore`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(NOTE_ID);
  });

  it('404 — version not found', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/notes/${NOTE_ID}/versions/no-such/restore`)
      .set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Version not found');
  });

  it('404 — note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/notes/no-such/versions/${VERSION_ID}/restore`)
      .set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Note not found');
  });

  it('401 — no auth', async () => {
    const res = await request(app)
      .post(`/api/notes/${NOTE_ID}/versions/${VERSION_ID}/restore`);
    expect(res.status).toBe(401);
  });
});
