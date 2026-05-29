import { expect } from '@playwright/test';
import { test, createNote, updateNote, deleteNote } from '../fixtures';
import { NoteEditorPage } from '../pages/NoteEditorPage';
import { VersionHistoryDrawer } from '../pages/VersionHistoryDrawer';

test.describe('Scenario 6 — Version history and restore', () => {
  test('version history drawer lists saved versions', async ({
    authenticatedPage: page,
    request,
    accessToken,
  }) => {
    const note = await createNote(request, accessToken, {
      title: `Version Test ${Date.now()}`,
      content: 'Version 1',
    });

    await updateNote(request, accessToken, note.id, { content: 'Version 2' });
    await updateNote(request, accessToken, note.id, { content: 'Version 3' });

    const editorPage = new NoteEditorPage(page);
    await editorPage.goto(note.id);

    await editorPage.openHistory();
    const drawer = new VersionHistoryDrawer(page);
    await drawer.waitForOpen();

    const count = await drawer.getVersionCount();
    expect(count).toBeGreaterThanOrEqual(1);

    await deleteNote(request, accessToken, note.id);
  });

  test('restoring a version updates editor content', async ({
    authenticatedPage: page,
    request,
    accessToken,
  }) => {
    const note = await createNote(request, accessToken, {
      title: `Restore Test ${Date.now()}`,
      content: 'Original content',
    });

    await updateNote(request, accessToken, note.id, { content: 'Updated content' });
    await updateNote(request, accessToken, note.id, { content: 'Latest content' });

    const editorPage = new NoteEditorPage(page);
    await editorPage.goto(note.id);

    await editorPage.openHistory();
    const drawer = new VersionHistoryDrawer(page);
    await drawer.waitForOpen();

    await drawer.restoreVersion(0);

    await page.waitForSelector('.tiptap[contenteditable="true"]');
    const content = await editorPage.getContent();
    expect(content).not.toContain('Latest content');

    await deleteNote(request, accessToken, note.id);
  });
});
