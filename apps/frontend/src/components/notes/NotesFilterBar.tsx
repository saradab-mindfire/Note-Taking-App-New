import { useNotesFilterStore } from '@/store/notesFilterStore';
import type { TagResponse } from '@notepad/shared';

interface NotesFilterBarProps {
  tags: TagResponse[];
  tagsError: boolean;
}

export function NotesFilterBar({ tags, tagsError }: NotesFilterBarProps) {
  const { sortBy, sortOrder, tags: selectedTags, includeDeleted, setFilter } = useNotesFilterStore();

  function toggleTag(tagId: string) {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    setFilter({ tags: next });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      {/* Sort by */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-by" className="text-sm font-medium whitespace-nowrap text-muted-foreground">
          Sort
        </label>
        <select
          id="sort-by"
          value={sortBy}
          onChange={(e) =>
            setFilter({ sortBy: e.target.value as 'createdAt' | 'updatedAt' | 'title' })
          }
          className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="createdAt">Created</option>
          <option value="updatedAt">Updated</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* Sort order */}
      <select
        value={sortOrder}
        onChange={(e) => setFilter({ sortOrder: e.target.value as 'asc' | 'desc' })}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Sort order"
      >
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </select>

      {/* Tag filter */}
      {tags.length > 0 && !tagsError && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium">Tags:</span>
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-opacity ${
                  isSelected ? 'opacity-100 text-white' : 'opacity-50 bg-transparent'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: tag.color, borderColor: tag.color }
                    : { borderColor: tag.color, color: tag.color }
                }
                aria-pressed={isSelected}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      {tagsError && (
        <span className="text-xs text-muted-foreground">Tags unavailable</span>
      )}

      {/* Include deleted toggle */}
      <label className="flex items-center gap-2 cursor-pointer text-sm ml-auto">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => setFilter({ includeDeleted: e.target.checked })}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <span className="text-muted-foreground">Show deleted</span>
      </label>
    </div>
  );
}
