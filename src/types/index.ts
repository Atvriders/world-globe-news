// ── News Article (single article from one source) ────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  source: NewsSourceInfo;
  author: string | null;
  category: NewsCategory;
  country: string;
}

export interface NewsSourceInfo {
  id: string;
  name: string;
}

// ── News Cluster (group of articles about the same topic) ────────────────────

export interface NewsCluster {
  id: string;
  title: string;
  summary: string;
  articles: NewsArticle[];
  location: GeoLocation;
  category: NewsCategory;
  importance: number; // 1-10 based on source count + recency
  firstPublished: string;
  lastUpdated: string;
  isBreaking: boolean;
}

// ── Globe Pin (what renders on the globe) ────────────────────────────────────

export interface GlobeNewsPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  size: number;
  color: string;
  category: NewsCategory;
  sourceCount: number;
  isBreaking: boolean;
  cluster: NewsCluster;
}

// ── Geographic Location ──────────────────────────────────────────────────────

export interface GeoLocation {
  lat: number;
  lng: number;
  country: string;
  countryCode: string;
  city?: string;
}

// ── News Categories ──────────────────────────────────────────────────────────

export type NewsCategory =
  | 'world'
  | 'politics'
  | 'business'
  | 'technology'
  | 'sports'
  | 'health'
  | 'science'
  | 'entertainment';

// ── Time Filter ──────────────────────────────────────────────────────────────

export type TimeFilter = '1h' | '6h' | '24h' | '7d';

// ── News Source (outlet metadata) ────────────────────────────────────────────

export type NewsBias = 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'independent';

export interface NewsSource {
  id: string;
  name: string;
  color: string;
  category: 'wire' | 'broadcast' | 'print' | 'digital' | 'state';
  country: string;
  reliabilityTier: 1 | 2 | 3;
  url: string;
  bias: NewsBias;
}

// ── App State (Zustand store) ────────────────────────────────────────────────

export interface AppState {
  // Data
  clusters: NewsCluster[];
  pins: GlobeNewsPin[];

  // Filters
  selectedCategory: NewsCategory | 'all';
  timeFilter: TimeFilter;
  searchQuery: string;

  // Selection
  selectedCluster: NewsCluster | null;
  sidebarOpen: boolean;

  // Loading
  isLoading: boolean;
  lastRefresh: number;
  error: string | null;

  // Actions
  setClusters: (clusters: NewsCluster[]) => void;
  setPins: (pins: GlobeNewsPin[]) => void;
  setSelectedCategory: (cat: NewsCategory | 'all') => void;
  setTimeFilter: (tf: TimeFilter) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCluster: (cluster: NewsCluster | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastRefresh: (ts: number) => void;
}

// ── API Response Types ───────────────────────────────────────────────────────

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: {
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }[];
}

export interface GNewsAPIResponse {
  totalArticles: number;
  articles: {
    title: string;
    description: string;
    content: string;
    url: string;
    image: string | null;
    publishedAt: string;
    source: { name: string; url: string };
  }[];
}

export interface RSSFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
  isoDate?: string;
}
