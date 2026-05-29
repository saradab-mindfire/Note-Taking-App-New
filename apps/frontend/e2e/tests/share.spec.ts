import { expect } from '@playwright/test';
import { test, createNote, createShareLink, deleteNote } from '../fixtures';
import { NoteEditorPage } from '../pages/NoteEditorPage';
import { ShareModal, fetchPublicShare } from '../pages/ShareModal';

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

    expect(shareUrl).toContain('/public/share/');

    const { status, body } = await fetchPublicShare(request, shareUrl);
    expect(status).toBe(200);
    expect((body as { success: boolean }).success).toBe(true);
    expect((body as { data: { title: string } }).data.title).toBe(note.title);

    await deleteNote(request, accessToken, note.id);
  });

  test('view count increments on public share access', async ({
    request,
    accessToken,
  }) => {
    const note = await createNote(request, accessToken, { title: `ViewCount Note ${Date.now()}` });
    const link = await createShareLink(request, accessToken, note.id);

    const res1 = await request.get(link.shareUrl);
    const body1 = await res1.json() as { data: { viewCount: number } };
    const viewCount1 = body1.data.viewCount;

    const res2 = await request.get(link.shareUrl);
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

    const res = await request.get(link.shareUrl);
    expect(res.status()).toBe(403);

    await deleteNote(request, accessToken, note.id);
  });
});
