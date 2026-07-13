import { create } from 'zustand';

interface CatalogState {
  searchQuery: string;
  selectedCategory: string | null;
  page: number;
  limit: number;
  sortBy: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
  
  // Actions
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string | null) => void;
  setPage: (p: number) => void;
  setSortBy: (s: 'price_asc' | 'price_desc' | 'name_asc' | 'newest') => void;
  resetFilters: () => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  searchQuery: '',
  selectedCategory: null,
  page: 1,
  limit: 6,
  sortBy: 'newest',

  setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory, page: 1 }),
  setPage: (page) => set({ page }),
  setSortBy: (sortBy) => set({ sortBy, page: 1 }),
  resetFilters: () => set({ searchQuery: '', selectedCategory: null, page: 1, sortBy: 'newest' }),
}));
