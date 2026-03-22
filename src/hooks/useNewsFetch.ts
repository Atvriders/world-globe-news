import { useEffect, useCallback, useRef } from 'react';
import { useStore } from './useStore';
import { NewsCluster } from '../types';

const API_BASE = '/api';
const POLL_INTERVAL = 60_000; // 1 minute

export function useNewsFetch() {
  const {
    selectedCategory,
    timeFilter,
    searchQuery,
    setClusters,
    setIsLoading,
    setError,
    setLastRefresh,
  } = useStore();

  const isMounted = useRef(true);

  const fetchNews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (timeFilter) params.set('timeFilter', timeFilter);
      if (searchQuery) params.set('search', searchQuery);

      const url = `${API_BASE}/news?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (isMounted.current && data.clusters) {
        setClusters(data.clusters as NewsCluster[]);
        setLastRefresh(Date.now());
        setError(null);
      }
    } catch (err) {
      console.error('[Fetch] News fetch error:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [selectedCategory, timeFilter, searchQuery, setClusters, setIsLoading, setError, setLastRefresh]);

  // Initial fetch + polling
  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);
    fetchNews();

    const interval = setInterval(fetchNews, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchNews, setIsLoading]);

  return { refetch: fetchNews };
}
