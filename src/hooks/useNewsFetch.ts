import { useEffect, useCallback, useRef } from 'react';
import { useStore } from './useStore';
import { NewsCluster } from '../types';

const API_BASE = '/api';
const POLL_INTERVAL = 30_000; // 30 seconds — more active updates

export function useNewsFetch() {
  const {
    setClusters,
    setIsLoading,
    setError,
    setLastRefresh,
  } = useStore();

  const isMounted = useRef(true);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/news`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (isMounted.current && data.clusters && data.clusters.length > 0) {
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
  }, [setClusters, setIsLoading, setError, setLastRefresh]);

  // Trigger server-side RSS refresh + then fetch updated data
  const triggerRefresh = useCallback(async () => {
    try {
      // Tell server to re-fetch all RSS feeds
      await fetch(`${API_BASE}/news/refresh`, { method: 'POST' });
      // Wait a few seconds for server to get some data, then fetch
      setTimeout(() => fetchNews(), 5000);
    } catch (err) {
      console.error('[Refresh] Trigger failed:', err);
    }
  }, [fetchNews]);

  // Initial rapid polling (every 1s for 10s) then normal 30s interval
  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);
    fetchNews();

    // Rapid poll: fetch every second for 10 seconds to pick up data quickly
    let rapidCount = 0;
    const rapidInterval = setInterval(() => {
      rapidCount++;
      fetchNews();
      if (rapidCount >= 10) clearInterval(rapidInterval);
    }, 1000);

    // Normal polling starts after rapid phase
    const normalInterval = setInterval(fetchNews, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      clearInterval(rapidInterval);
      clearInterval(normalInterval);
    };
  }, [fetchNews, setIsLoading]);

  return { refetch: fetchNews, triggerRefresh };
}
