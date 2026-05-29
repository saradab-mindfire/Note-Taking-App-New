import { expect } from '@playwright/test';
import { test, createNote, deleteNote, createTestUser } from '../fixtures';
import { API_URL } from '../fixtures/auth.fixture';

test.describe('Unauthorized access', () => {
  test('cross-user note access returns 403 or 404', async ({
    request,
    accessToken,
  }) => {
    const note = await createNote(request, accessToken, { title: `Private Note ${Date.now()}` });

    const otherUser = await createTestUser(request);

    const res = await request.get(`${API_URL}/api/notes/${note.id}`, {
      headers: { Authorization: `Bearer ${otherUser.accessToken}` },
    });

    expect([403, 404]).toContain(res.status());

    await deleteNote(request, accessToken, note.id);
  });

  test('accessing notes API without a token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/notes`);
    expect(res.status()).toBe(401);
  });
});
