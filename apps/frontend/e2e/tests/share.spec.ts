import { expect } from '@playwright/test';
import { test, createNote, createShareLink, deleteNote, API_URL } from '../fixtures';
import { NoteEditorPage } from '../pages/NoteEditorPage';
import { ShareModal } from '../pages/ShareModal';

test.describe('Scenario 5 — Share link generation and public access', () => {
  test('generates a share link and public API returns note content', async ({
    authenticatedPage: page,
    request,
    accessToken,
  }) => {
    const note = await createNote(request, accessToken, { title: `Shared Note ${Date.now()}` });

    const editorPage = new NoteEditorPage(page);
    await editorPage.goto(note.id);

    await editorPage.openShare();
    const modal = new ShareModal(page);
    const shareUrl = await modal.generateLink();

    // shareUrl now points to the frontend viewer (http://localhost:5173/share/:token)
    expect(shareUrl).toContain('/share/');

    // Extract the token and hit the backend public API directly
    const token = shareUrl.split('/share/')[1]?.trim();
    const res = await request.get(`${API_URL}/public/share/${token}`);
    const body = await res.json() as { success: boolean; data: { title: string } };
    expect(res.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe(note.title);

    await deleteNote(request, accessToken, note.id);
  });

  test('view count increments on public share access', async ({
    request,
    accessToken,
  }) => {
    const note = await createNote(request, accessToken, { title: `ViewCount Note ${Date.now()}` });
    const link = await createShareLink(request, accessToken, note.id);

    // Use the backend public API URL directly (shareUrl is now a frontend URL)
    const apiUrl = `${API_URL}/public/share/${link.token}`;

    const res1 = await request.get(apiUrl);
    const body1 = await res1.json() as { data: { viewCount: number } };
    const viewCount1 = body1.data.viewCount;

    const res2 = await request.get(apiUrl);
    const body2 = await res2.json() as { data: { viewCount: number } };
    expect(body2.data.viewCount).toBe(viewCount1 + 1);

    await deleteNote(request, accessToken, note.id);
  });

  test('expired share link returns error', async ({
    request,
    accessToken,
  }) => {
    const note = await createNote(request, accessToken, { title: `Expired Share ${Date.now()}` });
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const link = await createShareLink(request, accessToken, note.id, { expiresAt: pastDate });

    // Use the backend public API URL directly (shareUrl is now a frontend URL)
    const res = await request.get(`${API_URL}/public/share/${link.token}`);
    expect(res.status()).toBe(403);

    await deleteNote(request, accessToken, note.id);
  });
});
