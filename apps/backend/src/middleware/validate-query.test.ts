import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateQuery } from './validate-query.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(query: Record<string, unknown>): Request {
  return { query } as unknown as Request;
}

function makeRes(): { res: Response; locals: Record<string, unknown>; json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> } {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const locals: Record<string, unknown> = {};
  const res = { json, status, locals } as unknown as Response;
  return { res, locals, json, status };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tag: z.string().optional(),
});

describe('validateQuery middleware', () => {
  it('calls next and stores parsed value in res.locals when query is valid', () => {
    const req = makeReq({ page: '2', limit: '10' });
    const { res, locals } = makeRes();
    const next: NextFunction = vi.fn();

    validateQuery(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(locals['validatedQuery']).toEqual({ page: 2, limit: 10 });
  });

  it('applies schema defaults when query params are absent', () => {
    const req = makeReq({});
    const { res, locals } = makeRes();
    const next: NextFunction = vi.fn();

    validateQuery(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(locals['validatedQuery']).toEqual({ page: 1, limit: 20 });
  });

  it('returns 400 and does NOT call next when validation fails', () => {
    const req = makeReq({ page: '0' }); // min is 1
    const { res, json, status } = makeRes();
    const next: NextFunction = vi.fn();

    validateQuery(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.any(String) }),
    );
  });

  it('returns 400 with the first validation error message', () => {
    const req = makeReq({ limit: '999' }); // max is 100
    const { res, json, status } = makeRes();
    const next: NextFunction = vi.fn();

    validateQuery(schema)(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0]?.[0] as { error: string };
    expect(body.error).toBeTruthy();
  });

  it('passes through optional params that are present', () => {
    const req = makeReq({ tag: 'work' });
    const { res, locals } = makeRes();
    const next: NextFunction = vi.fn();

    validateQuery(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((locals['validatedQuery'] as Record<string, unknown>)['tag']).toBe('work');
  });
});
