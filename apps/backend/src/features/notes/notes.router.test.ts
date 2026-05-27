import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { generateAccessToken } from '../../lib/jwt.js';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const note = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const noteTag = {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  };
  return {
    default: {
      note,
      noteTag,
      $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb({ note, noteTag })),
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
};
type MockNoteTag = {
  createMany: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
};

const mockNote = (prisma as unknown as { note: MockNote }).note;
const mockNoteTag = (prisma as unknown as { noteTag: MockNoteTag }).noteTag;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const NOTE_ID = 'note-1';
const TAG_ID = 'tag-1';

const mockTag = { id: TAG_ID, userId: USER_ID, name: 'Work', color: '#6366f1' };

const mockNoteRow = {
  id: NOTE_ID,
  userId: USER_ID,
  title: 'Test Note',
  content: 'Hello world',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  tags: [{ tag: mockTag }],
};

const mockNoteNoTags = { ...mockNoteRow, tags: [] };

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

// ─── POST /api/notes ──────────────────────────────────────────────────────────

describe('POST /api/notes', () => {
  it('201 — creates note and returns it', async () => {
    mockNote.create.mockResolvedValue(mockNoteNoTags);

    const res = await request(app)
      .post('/api/notes')
      .set(auth())
      .send({ title: 'Test Note', content: 'Hello world' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(NOTE_ID);
    expect(res.body.data.title).toBe('Test Note');
    expect(res.body.data.tags).toEqual([]);
  });

  it('201 — creates note with tags', async () => {
    mockNote.create.mockResolvedValue(mockNoteNoTags);
    mockNoteTag.createMany.mockResolvedValue({ count: 1 });
    mockNote.findUnique.mockResolvedValue(mockNoteRow);

    const res = await request(app)
      .post('/api/notes')
      .set(auth())
      .send({ title: 'Tagged Note', content: '', tagIds: [TAG_ID] });

    expect(res.status).toBe(201);
    expect(res.body.data.tags).toHaveLength(1);
  });

  it('400 — missing title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(auth())
      .send({ content: 'No title here' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/title/i);
  });

  it('401 — no auth token', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Test', content: '' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/notes/:id ───────────────────────────────────────────────────────

describe('GET /api/notes/:id', () => {
  it('200 — returns note with full content', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);

    const res = await request(app).get(`/api/notes/${NOTE_ID}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(NOTE_ID);
    expect(res.body.data.content).toBe('Hello world');
    expect(res.body.data.tags).toHaveLength(1);
  });

  it('404 — note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/notes/no-such-note').set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Note not found');
  });

  it('404 — note belongs to another user (Prisma returns null)', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app).get(`/api/notes/${NOTE_ID}`).set(auth());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/notes ───────────────────────────────────────────────────────────

describe('GET /api/notes', () => {
  it('200 — returns notes list without content field', async () => {
    mockNote.findMany.mockResolvedValue([mockNoteRow]);

    const res = await request(app).get('/api/notes').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].content).toBeUndefined();
    expect(res.body.data[0].title).toBe('Test Note');
    expect(res.body.data[0].tags).toHaveLength(1);
  });

  it('200 — returns empty array when no notes', async () => {
    mockNote.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/notes').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('soft-deleted notes are excluded (Prisma filter)', async () => {
    // Prisma returns only active notes; we verify the where clause by returning one item
    mockNote.findMany.mockResolvedValue([mockNoteNoTags]);

    const res = await request(app).get('/api/notes').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(mockNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });
});

// ─── PATCH /api/notes/:id ─────────────────────────────────────────────────────

describe('PATCH /api/notes/:id', () => {
  it('200 — partial update (title only)', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteNoTags);
    mockNote.update.mockResolvedValue({ ...mockNoteNoTags, title: 'Updated Title' });

    const res = await request(app)
      .patch(`/api/notes/${NOTE_ID}`)
      .set(auth())
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('200 — replaces tags', async () => {
    const TAG_B = 'tag-b';
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNote.update.mockResolvedValue(mockNoteNoTags);
    mockNoteTag.deleteMany.mockResolvedValue({ count: 1 });
    mockNoteTag.createMany.mockResolvedValue({ count: 1 });
    mockNote.findUnique.mockResolvedValue({
      ...mockNoteNoTags,
      tags: [{ tag: { id: TAG_B, userId: USER_ID, name: 'Personal', color: '#ff0000' } }],
    });

    const res = await request(app)
      .patch(`/api/notes/${NOTE_ID}`)
      .set(auth())
      .send({ tagIds: [TAG_B] });

    expect(res.status).toBe(200);
    expect(res.body.data.tags[0].id).toBe(TAG_B);
  });

  it('404 — note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/notes/${NOTE_ID}`)
      .set(auth())
      .send({ title: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Note not found');
  });
});

// ─── DELETE /api/notes/:id ────────────────────────────────────────────────────

describe('DELETE /api/notes/:id', () => {
  it('204 — soft-deletes note', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteNoTags);
    mockNote.update.mockResolvedValue({ ...mockNoteNoTags, deletedAt: new Date() });

    const res = await request(app).delete(`/api/notes/${NOTE_ID}`).set(auth());

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('404 — note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const res = await request(app).delete(`/api/notes/${NOTE_ID}`).set(auth());

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Note not found');
  });
});

// ─── POST /api/notes/:id/restore ─────────────────────────────────────────────

describe('POST /api/notes/:id/restore', () => {
  it('200 — restores soft-deleted note within window', async () => {
    const recentlyDeleted = {
      ...mockNoteNoTags,
      deletedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    };
    mockNote.findFirst.mockResolvedValue(recentlyDeleted);
    mockNote.update.mockResolvedValue(mockNoteNoTags);

    const res = await request(app).post(`/api/notes/${NOTE_ID}/restore`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deletedAt).toBeNull();
  });

  it('410 — recovery window expired', async () => {
    const expiredNote = {
      ...mockNoteNoTags,
      deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
    };
    mockNote.findFirst.mockResolvedValue(expiredNote);

    const res = await request(app).post(`/api/notes/${NOTE_ID}/restore`).set(auth());

    expect(res.status).toBe(410);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Recovery window expired');
  });

  it('404 — note not soft-deleted', async () => {
    mockNote.findFirst.mockResolvedValue(null); // deletedAt: {not:null} filter returns nothing

    const res = await request(app).post(`/api/notes/${NOTE_ID}/restore`).set(auth());

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Note not found');
  });
});
