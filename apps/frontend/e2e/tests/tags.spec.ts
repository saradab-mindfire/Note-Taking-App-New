import { expect } from '@playwright/test';
import { test, createNote, createTag, deleteNote, deleteTag } from '../fixtures';
import { NotesListPage } from '../pages/NotesListPage';

test.describe('Scenario 3 — Tag management and filtering', () => {
  test('filters notes by tag and shows only tagged notes', async ({
    authenticatedPage: page,
    request,
    accessToken,
  }) => {
    const tag = await createTag(request, accessToken, { name: `FilterTag-${Date.now()}`, color: '#10b981' });
    const taggedNote = await createNote(request, accessToken, {
      title: `Tagged Note ${Date.now()}`,
      tagIds: [tag.id],
    });
    const untaggedNote = await createNote(request, accessToken, {
      title: `Untagged Note ${Date.now()}`,
    });

    const notesListPage = new NotesListPage(page);
    await notesListPage.goto();

    await notesListPage.filterByTag(tag.name);

    const titles = await notesListPage.getNoteTitles();
    expect(titles.some((t) => t.includes('Tagged Note'))).toBe(true);
    expect(titles.some((t) => t.includes('Untagged Note'))).toBe(false);

    await deleteNote(request, accessToken, taggedNote.id);
    await deleteNote(request, accessToken, untaggedNote.id);
    await deleteTag(request, accessToken, tag.id);
  });

  test('untagged notes do not appear when filtering by a tag', async ({
    authenticatedPage: page,
    request,
    accessToken,
  }) => {
    const tag = await createTag(request, accessToken, { name: `ExcludeTag-${Date.now()}`, color: '#f59e0b' });
    const untaggedNote = await createNote(request, accessToken, {
      title: `ShouldBeExcluded ${Date.now()}`,
    });

    const notesListPage = new NotesListPage(page);
    await notesListPage.goto();
    await notesListPage.filterByTag(tag.name);

    const titles = await notesListPage.getNoteTitles();
    expect(titles.some((t) => t.includes('ShouldBeExcluded'))).toBe(false);

    await deleteNote(request, accessToken, untaggedNote.id);
    await deleteTag(request, accessToken, tag.id);
  });
});
