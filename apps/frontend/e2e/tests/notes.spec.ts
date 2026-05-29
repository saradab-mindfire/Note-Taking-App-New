import { expect } from '@playwright/test';
import { test } from '../fixtures';
import { NoteEditorPage } from '../pages/NoteEditorPage';

test.describe('Scenario 2 — Note creation, editing, and autosave', () => {
  test('creates a note, types content, autosaves, and persists after reload', async ({
    authenticatedPage: page,
  }) => {
    const editorPage = new NoteEditorPage(page);

    await page.goto('/notes/new');
    await page.waitForSelector('input[placeholder="Note title"]');

    const title = `Autosave Test ${Date.now()}`;
    await editorPage.setTitle(title);

    const content = 'This content should be autosaved.';
    await editorPage.typeContent(content);

    await editorPage.waitForAutosave();

    await page.reload();
    await page.waitForSelector('.tiptap[contenteditable="true"]');

    const savedContent = await editorPage.getContent();
    expect(savedContent).toContain('This content should be autosaved');
  });

  test('autosave is triggered by typing without manual save', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/notes/new');
    await page.waitForSelector('input[placeholder="Note title"]');

    const editorPage = new NoteEditorPage(page);
    await editorPage.setTitle(`Trigger Test ${Date.now()}`);
    await editorPage.typeContent('Typing triggers autosave');

    const saveRequest = page.waitForResponse(
      (res) =>
        res.url().includes('/api/notes') &&
        res.request().method() === 'PATCH' &&
        res.status() === 200,
      { timeout: 5000 },
    );
    await saveRequest;
  });
});
