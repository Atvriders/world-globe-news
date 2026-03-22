import { create } from 'zustand';
import { AppState, NewsCluster, GlobeNewsPin, NewsCategory, TimeFilter } from '../types';

export const useStore = create<AppState>((set) => ({
  // Data
  clusters: [],
  pins: [],

  // Filters
  selectedCategory: 'all',
  timeFilter: '24h',
  searchQuery: '',

  // Selection
  selectedCluster: null,
  sidebarOpen: false,

  // Loading
  isLoading: true,
  lastRefresh: 0,
  error: null,

  // Actions
  setClusters: (clusters: NewsCluster[]) => set({ clusters }),
  setPins: (pins: GlobeNewsPin[]) => set({ pins }),
  setSelectedCategory: (cat: NewsCategory | 'all') => set({ selectedCategory: cat }),
  setTimeFilter: (tf: TimeFilter) => set({ timeFilter: tf }),
  setSearchQuery: (q: string) => set({ searchQuery: q }),
  setSelectedCluster: (cluster: NewsCluster | null) => set({ selectedCluster: cluster }),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setLastRefresh: (ts: number) => set({ lastRefresh: ts }),
}));
