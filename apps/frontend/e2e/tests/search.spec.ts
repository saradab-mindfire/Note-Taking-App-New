import { expect } from '@playwright/test';
import { test, createNote, updateNote, deleteNote } from '../fixtures';
import { SearchPage } from '../pages/SearchPage';

test.describe('Scenario 4 — Full-text search', () => {
  test('finds a note by keyword and opens it', async ({
    authenticatedPage: page,
    request,
    accessToken,
  }) => {
    const keyword = `uniquekeyword${Date.now()}`;
    const note = await createNote(request, accessToken, {
      title: `Search Test Note ${Date.now()}`,
      content: `Content with ${keyword} inside`,
    });
    await updateNote(request, accessToken, note.id, {
      content: `Content with ${keyword} inside`,
    });

    const searchPage = new SearchPage(page);
    await searchPage.goto();
    await searchPage.search(keyword);

    await page.waitForTimeout(500);

    const results = await searchPage.getResults();
    const found = results.some((r) => r.includes('Search Test Note') || r.toLowerCase().includes(keyword));
    expect(found).toBe(true);

    await deleteNote(request, accessToken, note.id);
  });

  test('clicking a search result opens the note editor', async ({
    authenticatedPage: page,
    request,
    accessToken,
  }) => {
    const keyword = `opentest${Date.now()}`;
    const note = await createNote(request, accessToken, {
      title: `Open Search Note ${keyword}`,
      content: `Content ${keyword}`,
    });
    await updateNote(request, accessToken, note.id, { content: `Content ${keyword}` });

    const searchPage = new SearchPage(page);
    await searchPage.goto();
    await searchPage.search(keyword);
    await page.waitForTimeout(500);

    await page.getByText(`Open Search Note ${keyword}`).first().click();
    await page.waitForURL(/\/notes\/.+/);
    await page.waitForSelector('input[placeholder="Note title"]');

    await deleteNote(request, accessToken, note.id);
  });
});
