import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.js';

const PAYLOAD = { userId: 'user-123', email: 'test@example.com' };

beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-access-secret-32-chars-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
  process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
  process.env['REFRESH_TOKEN_EXPIRY'] = '7d';
});

// ─── Access Token ─────────────────────────────────────────────────────────────

describe('generateAccessToken / verifyAccessToken', () => {
  it('generates a token that verifies successfully', () => {
    const token = generateAccessToken(PAYLOAD);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT structure

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(PAYLOAD.userId);
    expect(decoded.email).toBe(PAYLOAD.email);
  });

  it('throws on a tampered token', () => {
    const token = generateAccessToken(PAYLOAD);
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ userId: 'hacker', email: 'evil@x.com' })).toString(
      'base64url',
    );
    const tampered = parts.join('.');
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('throws on an expired access token', () => {
    // Sign a token that expired 1 second ago
    process.env['ACCESS_TOKEN_EXPIRY'] = '-1s';
    const token = generateAccessToken(PAYLOAD);
    process.env['ACCESS_TOKEN_EXPIRY'] = '15m';
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('throws when signed with a different secret', () => {
    const originalSecret = process.env['JWT_SECRET'];
    process.env['JWT_SECRET'] = 'wrong-secret-for-testing-purposes!';
    const wrongToken = generateAccessToken(PAYLOAD);
    process.env['JWT_SECRET'] = originalSecret!;
    expect(() => verifyAccessToken(wrongToken)).toThrow();
  });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────

describe('generateRefreshToken / verifyRefreshToken', () => {
  it('generates a token that verifies successfully', () => {
    const token = generateRefreshToken(PAYLOAD);
    expect(typeof token).toBe('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(PAYLOAD.userId);
    expect(decoded.email).toBe(PAYLOAD.email);
  });

  it('throws on an expired refresh token', () => {
    process.env['REFRESH_TOKEN_EXPIRY'] = '-1s';
    const token = generateRefreshToken(PAYLOAD);
    process.env['REFRESH_TOKEN_EXPIRY'] = '7d';
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});
