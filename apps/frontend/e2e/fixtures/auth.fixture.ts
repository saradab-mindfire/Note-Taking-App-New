import { test as base, type Page, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'crypto';

export const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export interface TestUser {
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

export async function createTestUser(request: APIRequestContext): Promise<TestUser> {
  const id = randomUUID();
  const email = `test-${id}@e2e.test`;
  const password = 'TestPassword123!';

  const regRes = await request.post(`${API_URL}/api/auth/register`, {
    data: { email, password },
  });
  if (!regRes.ok()) {
    throw new Error(`Register failed: ${await regRes.text()}`);
  }

  const loginRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });
  if (!loginRes.ok()) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  const loginBody = await loginRes.json() as { success: boolean; data: { accessToken: string; refreshToken: string } };
  return { email, password, accessToken: loginBody.data.accessToken, refreshToken: loginBody.data.refreshToken };
}

export async function injectAuth(page: Page, user: TestUser): Promise<void> {
  await page.goto('/');
  await page.evaluate((refreshToken) => {
    localStorage.setItem('refresh_token', refreshToken);
  }, user.refreshToken);
  await page.goto('/notes');
  await page.waitForURL('/notes');
  await page.waitForSelector('h1:has-text("My Notes")', { timeout: 10000 });
}

interface AuthFixtures {
  user: TestUser;
  authenticatedPage: Page;
  accessToken: string;
}

export const test = base.extend<AuthFixtures>({
  user: async ({ request }, apply) => {
    const user = await createTestUser(request);
    await apply(user);
  },

  accessToken: async ({ user }, apply) => {
    await apply(user.accessToken);
  },

  authenticatedPage: async ({ page, user }, apply) => {
    await injectAuth(page, user);
    await apply(page);
  },
});

export const expect = base.expect;
