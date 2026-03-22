import React, { useState, useCallback, useMemo } from 'react';
import NewsGlobe from './components/Globe/NewsGlobe';
import TopBar from './components/UI/TopBar';
import NewsTicker from './components/UI/NewsTicker';
import NewsSidebar from './components/UI/NewsSidebar';
import NewsDetail from './components/UI/NewsDetail';
import SearchBar from './components/UI/SearchBar';
import LoadingScreen from './components/UI/LoadingScreen';
import RegionSelector from './components/UI/RegionSelector';
import StatsOverlay from './components/UI/StatsOverlay';
import { useStore } from './hooks/useStore';
import { useNewsFetch } from './hooks/useNewsFetch';
import { GLOBAL_CSS } from './data/theme';
import { NewsCluster } from './types';

// Error boundary to catch crashes and show error instead of black screen
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#121218', color: '#ff5252', padding: 40, fontFamily: 'monospace', height: '100vh' }}>
          <h2 style={{ color: '#f5f0eb', marginBottom: 16 }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#6b6578', marginTop: 12 }}>{this.state.error.stack}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 20, padding: '8px 16px', background: '#7c5cfc', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { refetch } = useNewsFetch();

  const {
    clusters,
    selectedCategory,
    setSelectedCategory,
    timeFilter,
    setTimeFilter,
    searchQuery,
    setSearchQuery,
    selectedCluster,
    setSelectedCluster,
    sidebarOpen,
    setSidebarOpen,
    isLoading,
    setClusters,
  } = useStore();

  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [urlSearchTitle, setUrlSearchTitle] = useState<string | null>(null);
  const [savedClusters, setSavedClusters] = useState<NewsCluster[] | null>(null);

  // Handle pin click on globe
  const handlePinClick = useCallback((cluster: NewsCluster) => {
    setSelectedCluster(cluster);
    setSidebarOpen(false); // Close sidebar when detail opens
  }, [setSelectedCluster, setSidebarOpen]);

  // Handle headline click in ticker
  const handleHeadlineClick = useCallback((cluster: NewsCluster) => {
    setSelectedCluster(cluster);
    if (cluster.location) {
      setFlyTo({ lat: cluster.location.lat, lng: cluster.location.lng });
    }
  }, [setSelectedCluster, setFlyTo]);

  // Handle fly to from detail panel
  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng });
    // Reset after animation
    setTimeout(() => setFlyTo(null), 1500);
  }, []);

  // Handle region fly to
  const handleRegionFlyTo = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng });
    setTimeout(() => setFlyTo(null), 1500);
  }, []);

  // Close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedCluster(null);
  }, [setSelectedCluster]);

  // Handle search
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
  }, [setSearchQuery]);

  // Handle URL search — fetch similar stories from backend
  const handleUrlSearch = useCallback(async (url: string) => {
    try {
      // Save current clusters so we can restore them later
      if (!savedClusters) {
        setSavedClusters(clusters);
      }
      const res = await fetch('/api/news/similar?url=' + encodeURIComponent(url));
      const data = await res.json();
      if (data.clusters) {
        setClusters(data.clusters as NewsCluster[]);
      }
      const title = data.title || url;
      setUrlSearchTitle(title);
    } catch (err) {
      console.error('URL search failed:', err);
    }
  }, [clusters, savedClusters, setClusters]);

  // Dismiss URL search banner and restore original clusters
  const handleDismissUrlSearch = useCallback(() => {
    setUrlSearchTitle(null);
    setSearchQuery('');
    if (savedClusters) {
      setClusters(savedClusters);
      setSavedClusters(null);
    }
  }, [savedClusters, setClusters, setSearchQuery]);

  // Filter clusters for sidebar display
  const filteredClusters = useMemo(() => {
    let result = clusters;
    if (selectedCategory !== 'all') {
      result = result.filter(c => c.category === selectedCategory);
    }
    if (searchQuery && !urlSearchTitle) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.location?.city?.toLowerCase().includes(q) ||
        c.location?.country?.toLowerCase().includes(q) ||
        c.articles.some(a => a.title.toLowerCase().includes(q)) ||
        c.articles.some(a => a.source.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [clusters, selectedCategory, searchQuery, urlSearchTitle]);

  const urlBannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 108,
    left: 170,
    zIndex: 1100,
    maxWidth: 280,
    background: 'rgba(124, 92, 252, 0.15)',
    border: '1px solid rgba(124, 92, 252, 0.3)',
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'rgba(245, 240, 235, 0.85)',
    fontFamily: "'Inter', sans-serif",
    animation: 'searchClearFadeIn 0.3s ease forwards',
  };

  const urlBannerDismissStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: '50%',
    marginLeft: 4,
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#121218', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* 3D Globe — always renders */}
      <NewsGlobe
        clusters={filteredClusters}
        selectedCluster={selectedCluster}
        onPinClick={handlePinClick}
        onFlyTo={flyTo}
      />

      {/* UI Overlay */}
      <TopBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onRefresh={refetch}
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        onUrlSearch={handleUrlSearch}
      />

      {urlSearchTitle && (
        <div style={urlBannerStyle}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            Similar to: {urlSearchTitle}
          </span>
          <button
            style={urlBannerDismissStyle}
            onClick={handleDismissUrlSearch}
            aria-label="Dismiss URL search"
          >
            ×
          </button>
        </div>
      )}

      <StatsOverlay clusters={filteredClusters} />

      <RegionSelector onFlyTo={handleRegionFlyTo} />

      <NewsSidebar
        clusters={filteredClusters}
        selectedCluster={selectedCluster}
        onSelectCluster={handlePinClick}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <NewsDetail
        cluster={selectedCluster}
        onClose={handleCloseDetail}
        onFlyTo={handleFlyTo}
      />

      <NewsTicker
        clusters={filteredClusters}
        onHeadlineClick={handleHeadlineClick}
      />

      {/* Loading overlay */}
      <LoadingScreen isVisible={isLoading && clusters.length === 0} />
    </div>
  );
};

const WrappedApp: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default WrappedApp;
