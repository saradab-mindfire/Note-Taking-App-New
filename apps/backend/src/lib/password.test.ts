import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.js';

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('mypassword123');
    expect(hash).toMatch(/^\$2b\$/);
  });

  it('two hashes of the same password are different (salted)', async () => {
    const hash1 = await hashPassword('same-password');
    const hash2 = await hashPassword('same-password');
    expect(hash1).not.toBe(hash2);
  });
});

describe('comparePassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('correct-horse-battery');
    const result = await comparePassword('correct-horse-battery', hash);
    expect(result).toBe(true);
  });

  it('returns false for incorrect password', async () => {
    const hash = await hashPassword('correct-horse-battery');
    const result = await comparePassword('wrong-password', hash);
    expect(result).toBe(false);
  });
});
