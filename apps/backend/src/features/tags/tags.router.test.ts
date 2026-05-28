import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { generateAccessToken } from '../../lib/jwt.js';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const tag = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
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
      tag,
      note,
      noteTag,
      $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb({ note, noteTag })),
    },
  };
});

import prisma from '../../lib/prisma.js';

type MockTag = {
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockTag = (prisma as unknown as { tag: MockTag }).tag;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const TAG_ID = 'tag-1';

const mockTagRow = {
  id: TAG_ID,
  userId: USER_ID,
  name: 'Work',
  color: '#6B7280',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { notes: 0 },
};

const mockTagWithNotes = { ...mockTagRow, _count: { notes: 3 } };

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

// ─── POST /api/tags ───────────────────────────────────────────────────────────

describe('POST /api/tags', () => {
  it('201 — creates tag with name only (uses default color)', async () => {
    mockTag.findFirst.mockResolvedValue(null);
    mockTag.create.mockResolvedValue(mockTagRow);

    const res = await request(app)
      .post('/api/tags')
      .set(auth())
      .send({ name: 'Work' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(TAG_ID);
    expect(res.body.data.name).toBe('Work');
    expect(res.body.data.noteCount).toBe(0);
  });

  it('201 — creates tag with name and color', async () => {
    const coloredTag = { ...mockTagRow, color: '#3B82F6' };
    mockTag.findFirst.mockResolvedValue(null);
    mockTag.create.mockResolvedValue(coloredTag);

    const res = await request(app)
      .post('/api/tags')
      .set(auth())
      .send({ name: 'Personal', color: '#3B82F6' });

    expect(res.status).toBe(201);
    expect(res.body.data.color).toBe('#3B82F6');
  });

  it('409 — duplicate tag name for same user', async () => {
    mockTag.findFirst.mockResolvedValue(mockTagRow);

    const res = await request(app)
      .post('/api/tags')
      .set(auth())
      .send({ name: 'work' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Tag name already exists');
  });

  it('400 — missing name', async () => {
    const res = await request(app)
      .post('/api/tags')
      .set(auth())
      .send({ color: '#FF0000' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/name/i);
  });

  it('401 — no auth token', async () => {
    const res = await request(app).post('/api/tags').send({ name: 'Work' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/tags ────────────────────────────────────────────────────────────

describe('GET /api/tags', () => {
  it('200 — returns tags list with noteCount', async () => {
    mockTag.findMany.mockResolvedValue([mockTagWithNotes, mockTagRow]);

    const res = await request(app).get('/api/tags').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].noteCount).toBe(3);
    expect(res.body.data[1].noteCount).toBe(0);
  });

  it('200 — returns empty array when user has no tags', async () => {
    mockTag.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/tags').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('filters by userId (Prisma where clause)', async () => {
    mockTag.findMany.mockResolvedValue([mockTagRow]);

    await request(app).get('/api/tags').set(auth());

    expect(mockTag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
  });

  it('401 — no auth token', async () => {
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── PATCH /api/tags/:id ──────────────────────────────────────────────────────

describe('PATCH /api/tags/:id', () => {
  it('200 — renames tag', async () => {
    const renamed = { ...mockTagRow, name: 'Renamed' };
    mockTag.findFirst
      .mockResolvedValueOnce(mockTagRow)   // ownership check
      .mockResolvedValueOnce(null);         // duplicate check
    mockTag.update.mockResolvedValue({ ...renamed, _count: { notes: 0 } });

    const res = await request(app)
      .patch(`/api/tags/${TAG_ID}`)
      .set(auth())
      .send({ name: 'Renamed' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed');
  });

  it('200 — recolors tag', async () => {
    const recolored = { ...mockTagRow, color: '#EF4444' };
    mockTag.findFirst.mockResolvedValueOnce(mockTagRow);
    mockTag.update.mockResolvedValue({ ...recolored, _count: { notes: 0 } });

    const res = await request(app)
      .patch(`/api/tags/${TAG_ID}`)
      .set(auth())
      .send({ color: '#EF4444' });

    expect(res.status).toBe(200);
    expect(res.body.data.color).toBe('#EF4444');
  });

  it('409 — rename to duplicate name', async () => {
    const otherTag = { ...mockTagRow, id: 'tag-2', name: 'Personal' };
    mockTag.findFirst
      .mockResolvedValueOnce(mockTagRow)   // ownership check
      .mockResolvedValueOnce(otherTag);     // duplicate check finds existing tag

    const res = await request(app)
      .patch(`/api/tags/${TAG_ID}`)
      .set(auth())
      .send({ name: 'personal' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Tag name already exists');
  });

  it('404 — tag not found or unowned', async () => {
    mockTag.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/tags/no-such-tag')
      .set(auth())
      .send({ name: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Tag not found');
  });

  it('401 — no auth token', async () => {
    const res = await request(app)
      .patch(`/api/tags/${TAG_ID}`)
      .send({ name: 'x' });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/tags/:id ─────────────────────────────────────────────────────

describe('DELETE /api/tags/:id', () => {
  it('204 — deletes owned tag', async () => {
    mockTag.findFirst.mockResolvedValue(mockTagRow);
    mockTag.delete.mockResolvedValue(mockTagRow);

    const res = await request(app).delete(`/api/tags/${TAG_ID}`).set(auth());

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(mockTag.delete).toHaveBeenCalledWith({ where: { id: TAG_ID } });
  });

  it('204 — delete cascades (Prisma onDelete: Cascade on NoteTag)', async () => {
    mockTag.findFirst.mockResolvedValue(mockTagWithNotes);
    mockTag.delete.mockResolvedValue(mockTagWithNotes);

    const res = await request(app).delete(`/api/tags/${TAG_ID}`).set(auth());

    expect(res.status).toBe(204);
    expect(mockTag.delete).toHaveBeenCalledWith({ where: { id: TAG_ID } });
  });

  it('404 — tag not found or unowned', async () => {
    mockTag.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/tags/no-such-tag').set(auth());

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Tag not found');
  });

  it('401 — no auth token', async () => {
    const res = await request(app).delete(`/api/tags/${TAG_ID}`);

    expect(res.status).toBe(401);
  });
});
