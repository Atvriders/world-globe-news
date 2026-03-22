import React, { useState, useCallback, useMemo } from 'react';
import NewsGlobe from './components/Globe/NewsGlobe';
import TopBar from './components/UI/TopBar';
import NewsTicker from './components/UI/NewsTicker';
import NewsSidebar from './components/UI/NewsSidebar';
import NewsDetail from './components/UI/NewsDetail';
import SearchBar from './components/UI/SearchBar';
import LoadingScreen from './components/UI/LoadingScreen';
import RegionSelector from './components/UI/RegionSelector';
import { useStore } from './hooks/useStore';
import { useNewsFetch } from './hooks/useNewsFetch';
import { GLOBAL_CSS } from './data/theme';
import { NewsCluster } from './types';

const App: React.FC = () => {
  useNewsFetch();

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
  } = useStore();

  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

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
  }, [setSelectedCluster]);

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

  // Filter clusters for sidebar display
  const filteredClusters = useMemo(() => {
    let result = clusters;
    if (selectedCategory !== 'all') {
      result = result.filter(c => c.category === selectedCategory);
    }
    return result;
  }, [clusters, selectedCategory]);

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
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
      />

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

export default App;
