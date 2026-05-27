import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authMiddleware } from './auth.middleware.js';
import { generateAccessToken } from '../lib/jwt.js';

// Build a minimal test app with one protected route
const testApp = express();
testApp.use(express.json());
testApp.get('/protected', authMiddleware, (req, res) => {
  res.json({ success: true, data: req.user });
});

const PAYLOAD = { userId: 'user-123', email: 'alice@example.com' };

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
  process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
  process.env['REFRESH_TOKEN_EXPIRY'] = '7d';
});

describe('authMiddleware', () => {
  it('passes and sets req.user for a valid Bearer token', async () => {
    const token = generateAccessToken(PAYLOAD);

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(PAYLOAD.userId);
    expect(res.body.data.email).toBe(PAYLOAD.email);
  });

  it('401 — missing Authorization header', async () => {
    const res = await request(testApp).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('401 — expired access token', async () => {
    process.env['ACCESS_TOKEN_EXPIRY'] = '-1s';
    const expiredToken = generateAccessToken(PAYLOAD);
    process.env['ACCESS_TOKEN_EXPIRY'] = '15m';

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('401 — wrong scheme (Token instead of Bearer)', async () => {
    const token = generateAccessToken(PAYLOAD);

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('401 — tampered token', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer header.tampered-payload.signature');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('401 — "Bearer" with no token', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
