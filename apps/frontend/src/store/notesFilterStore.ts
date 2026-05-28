import { create } from 'zustand';

interface NotesFilterState {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  tags: string[];
  includeDeleted: boolean;
  setFilter: (updates: Partial<Omit<NotesFilterState, 'setFilter' | 'resetFilters'>>) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
  tags: [] as string[],
  includeDeleted: false,
};

export const useNotesFilterStore = create<NotesFilterState>((set) => ({
  ...defaultFilters,

  setFilter: (updates) =>
    set((state) => {
      const hasNonPageChange = Object.keys(updates).some((k) => k !== 'page');
      return {
        ...state,
        ...updates,
        page: hasNonPageChange ? 1 : (updates.page ?? state.page),
      };
    }),

  resetFilters: () => set(defaultFilters),
}));
