/**
 * Standalone verification for fix-version-restore-dialog-loop.
 * Uses TipTap-compatible JSON content to avoid the pre-existing crash in NoteEditorPage
 * when notes are created with plain-string content via API.
 */
import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000';
const randomSuffix = () => Math.random().toString(36).slice(2, 8);

const tiptapContent = (text: string) =>
  JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });

async function apiCall(method: string, url: string, body: object, token?: string) {
  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json() as { success: boolean; data: Record<string, unknown> };
  if (!res.ok) throw new Error(`${method} ${url} failed: ${JSON.stringify(json)}`);
  return json.data;
}

test.describe('Restore dialog loop fix — standalone verification', () => {
  test('dialog closes immediately on confirm, API called once, success toast shown, no re-open loop', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Setup: register + login + create note with two versions
    const email = `verify-${randomSuffix()}@e2e.test`;
    const password = 'TestPass123!';

    await apiCall('POST', '/api/auth/register', { email, password });
    const loginData = await apiCall('POST', '/api/auth/login', { email, password }) as { accessToken: string; refreshToken: string };
    const { accessToken, refreshToken } = loginData;

    const noteData = await apiCall('POST', '/api/notes', {
      title: `Restore Fix Test ${randomSuffix()}`,
      content: tiptapContent('Original content'),
      tagIds: [],
    }, accessToken) as { id: string };
    const noteId = noteData.id as string;

    // Patch to create a second version
    await apiCall('PATCH', `/api/notes/${noteId}`, {
      content: tiptapContent('Updated content'),
    }, accessToken);

    // Inject auth into browser
    await page.goto('http://localhost:5173/');
    await page.evaluate((rt) => localStorage.setItem('refresh_token', rt), refreshToken);
    await page.goto('http://localhost:5173/notes');
    await page.waitForSelector('h1:has-text("My Notes")', { timeout: 10000 });

    // Navigate to the note
    await page.goto(`http://localhost:5173/notes/${noteId}`);
    await page.waitForSelector('input[placeholder="Note title"]', { timeout: 15000 });

    await page.screenshot({ path: 'test-results/verify-01-editor.png' });
    console.log('✓ Step 1: Note editor loaded');

    // Open History drawer
    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForTimeout(1500); // allow versions to load
    await page.screenshot({ path: 'test-results/verify-02-drawer.png' });

    // Select first version — use max-h-64 container which is unique to the version list
    const versionBtns = page.locator('.max-h-64 button');
    const vCount = await versionBtns.count();
    console.log(`Version count in drawer: ${vCount}`);
    expect(vCount).toBeGreaterThan(0);
    await versionBtns.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/verify-03-version-selected.png' });

    // Click Restore
    const restoreBtn = page.getByRole('button', { name: 'Restore this version' });
    await expect(restoreBtn).toBeVisible({ timeout: 3000 });
    await restoreBtn.click();

    // Confirmation dialog should appear exactly once
    const confirmDialog = page.getByRole('dialog').filter({ hasText: 'Restore this version?' });
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: 'test-results/verify-04-confirm-dialog.png' });
    console.log('✓ Step 2: Confirmation dialog appeared');

    // Track restore API calls
    let restoreCallCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/restore') && req.method() === 'POST') {
        restoreCallCount++;
        console.log(`  Restore API call #${restoreCallCount}`);
      }
    });

    // Register response listener BEFORE clicking (Playwright only catches future responses)
    const restoreResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/restore') && res.status() === 200,
      { timeout: 10000 },
    );

    // Confirm — dialog must close IMMEDIATELY (before API resolves)
    const confirmBtn = confirmDialog.getByRole('button', { name: 'Restore' }).last();
    await confirmBtn.click();

    // Dialog must close within 500ms (synchronous state update)
    await expect(confirmDialog).not.toBeVisible({ timeout: 500 });
    await page.screenshot({ path: 'test-results/verify-05-dialog-closed.png' });
    console.log('✓ Step 3: Dialog closed immediately on confirm (< 500ms)');

    // Now await the response (may already be done or in-flight)
    await restoreResponsePromise;
    expect(restoreCallCount).toBe(1);
    console.log('✓ Step 4: Restore API called exactly once');

    // Success toast
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    const toastText = await toast.textContent();
    await page.screenshot({ path: 'test-results/verify-06-toast.png' });
    console.log(`✓ Step 5: Success toast visible — "${toastText}"`);

    // Confirm dialog must NOT reappear
    await page.waitForTimeout(1000);
    await expect(confirmDialog).not.toBeVisible();
    console.log('✓ Step 6: Confirm dialog did NOT reappear after success');

    // Re-open drawer — confirm dialog must NOT auto-appear (the core bug scenario)
    const historyBtn = page.getByRole('button', { name: 'History' });
    if (await historyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyBtn.click();
      await page.waitForSelector('[data-state="open"]', { timeout: 5000 });
      await page.waitForTimeout(1000);
      const confirmAgain = page.getByRole('dialog').filter({ hasText: 'Restore this version?' });
      await expect(confirmAgain).not.toBeVisible();
      await page.screenshot({ path: 'test-results/verify-07-reopen-clean.png' });
      console.log('✓ Step 7: Re-opened drawer — confirm dialog did NOT auto-appear (bug fixed)');
    }

    // No JS errors throughout
    const criticalErrors = errors.filter((e) => !e.includes('DevTools'));
    if (criticalErrors.length > 0) {
      console.warn('JS errors during test:', criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
  });

  test('cancel: no API call, drawer stays open', async ({ page }) => {
    const email = `verify-cancel-${randomSuffix()}@e2e.test`;
    const password = 'TestPass123!';

    await apiCall('POST', '/api/auth/register', { email, password });
    const loginData = await apiCall('POST', '/api/auth/login', { email, password }) as { accessToken: string; refreshToken: string };
    const { accessToken, refreshToken } = loginData;

    const noteData = await apiCall('POST', '/api/notes', {
      title: `Cancel Test ${randomSuffix()}`,
      content: tiptapContent('Content v1'),
      tagIds: [],
    }, accessToken) as { id: string };
    const noteId = noteData.id as string;
    await apiCall('PATCH', `/api/notes/${noteId}`, { content: tiptapContent('Content v2') }, accessToken);

    await page.goto('http://localhost:5173/');
    await page.evaluate((rt) => localStorage.setItem('refresh_token', rt), refreshToken);
    await page.goto('http://localhost:5173/notes');
    await page.waitForSelector('h1:has-text("My Notes")', { timeout: 10000 });

    await page.goto(`http://localhost:5173/notes/${noteId}`);
    await page.waitForSelector('input[placeholder="Note title"]', { timeout: 15000 });

    let restoreCallCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/restore') && req.method() === 'POST') restoreCallCount++;
    });

    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForTimeout(1500);

    const versionBtns = page.locator('.max-h-64 button');
    await expect(versionBtns.first()).toBeVisible({ timeout: 5000 });
    await versionBtns.first().click();

    await page.getByRole('button', { name: 'Restore this version' }).click();
    const confirmDialog = page.getByRole('dialog').filter({ hasText: 'Restore this version?' });
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });

    await confirmDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirmDialog).not.toBeVisible({ timeout: 2000 });
    expect(restoreCallCount).toBe(0);
    console.log('✓ Cancel: no restore API call made');

    const sheet = page.locator('[data-state="open"]').first();
    await expect(sheet).toBeVisible({ timeout: 2000 });
    console.log('✓ Cancel: drawer remains open');
  });
});
