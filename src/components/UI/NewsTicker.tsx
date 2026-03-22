import React, { useMemo, useRef, useState, useEffect } from 'react';
import { NewsCluster } from '../../types';
import { CATEGORY_ICONS } from '../../data/theme';

// ── Props ────────────────────────────────────────────────────────────────────

interface NewsTickerProps {
  clusters: NewsCluster[];
  onHeadlineClick: (cluster: NewsCluster) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const NewsTicker: React.FC<NewsTickerProps> = ({ clusters, onHeadlineClick }) => {
  const hasBreaking = useMemo(
    () => clusters.some((c) => c.isBreaking),
    [clusters],
  );

  // ── New-news badge ──────────────────────────────────────────────────────
  const prevCountRef = useRef(clusters.length);
  const [showNewBadge, setShowNewBadge] = useState(false);

  useEffect(() => {
    if (clusters.length > prevCountRef.current) {
      setShowNewBadge(true);
      const timer = setTimeout(() => setShowNewBadge(false), 5000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = clusters.length;
  }, [clusters.length]);

  useEffect(() => {
    prevCountRef.current = clusters.length;
  }, [clusters.length]);

  const items = useMemo(() => {
    if (clusters.length === 0) return null;

    const buildItems = (keyPrefix: string) =>
      clusters.map((cluster, i) => {
        const emoji = CATEGORY_ICONS[cluster.category] ?? '📰';
        const source = cluster.articles?.[0]?.source?.name;

        return (
          <React.Fragment key={`${keyPrefix}-${cluster.id}`}>
            {i > 0 && <span style={styles.separator}>|</span>}
            <span
              className="news-ticker-item"
              style={styles.item}
              onClick={(e) => {
                e.stopPropagation();
                onHeadlineClick(cluster);
              }}
            >
              <span style={styles.emoji}>{emoji}</span>
              <span style={styles.headline}>{cluster.title}</span>
              {source && <span style={styles.source}>({source})</span>}
            </span>
          </React.Fragment>
        );
      });

    return (
      <>
        {buildItems('a')}
        <span style={styles.separator}>|</span>
        {buildItems('b')}
      </>
    );
  }, [clusters, onHeadlineClick]);

  if (clusters.length === 0) return null;

  return (
    <div style={{...styles.wrapper, animation: 'ticker-slide-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'}}>
      {/* Badge */}
      {hasBreaking ? (
        <div style={styles.badge}>
          <span style={styles.dotRed} />
          <span style={styles.badgeTextRed}>BREAKING</span>
          {showNewBadge && <span className="new-news-badge" style={styles.newBadge}>NEW</span>}
        </div>
      ) : (
        <div style={styles.badge}>
          <span style={styles.dotBlue} />
          <span style={styles.badgeTextBlue}>LATEST</span>
          {showNewBadge && <span className="new-news-badge" style={styles.newBadge}>NEW</span>}
        </div>
      )}

      {/* Scrolling track */}
      <div className="news-ticker-track" style={styles.track}>
        <div className="news-ticker-scroll" style={styles.scroll}>
          {items}
        </div>
      </div>

      {/* Inline keyframes + hover rules */}
      <style>{tickerCSS}</style>
    </div>
  );
};

export default NewsTicker;

// ── Inline keyframes ─────────────────────────────────────────────────────────

const tickerCSS = `
@keyframes ticker-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes ticker-slide-in {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes new-badge-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(124,92,252,0.4); }
  50%      { box-shadow: 0 0 12px rgba(0,198,255,0.8); }
}
.news-ticker-track:hover .news-ticker-scroll {
  animation-play-state: paused;
}
.news-ticker-item:hover {
  filter: brightness(1.25);
}
.new-news-badge {
  animation: new-badge-pulse 1s ease-in-out infinite;
}
`;

// ── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 36,
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(18, 18, 24, 0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: 12,
    overflow: 'hidden',
    userSelect: 'none',
  },

  /* ── Badge ──────────────────── */
  badge: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '0 0 0 12px',
    whiteSpace: 'nowrap',
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#ef4444',
    flexShrink: 0,
  },
  dotBlue: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#7c5cfc',
    flexShrink: 0,
  },
  badgeTextRed: {
    color: '#ef4444',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.08em',
  },
  badgeTextBlue: {
    color: '#7c5cfc',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.08em',
  },

  /* ── Scrolling track ────────── */
  track: {
    flex: 1,
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'default',
  },
  scroll: {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    animation: 'ticker-scroll 7040s linear infinite',
    paddingLeft: 16,
  },

  /* ── Items ──────────────────── */
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    padding: '0 4px',
    transition: 'filter 0.2s ease',
  },
  emoji: {
    fontSize: 12,
    lineHeight: 1,
    flexShrink: 0,
  },
  headline: {
    color: '#f5f0eb',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  source: {
    color: '#6b6578',
    fontSize: 11,
    fontWeight: 400,
    marginLeft: 2,
  },
  separator: {
    color: 'rgba(107, 101, 120, 0.3)',
    fontSize: 12,
    margin: '0 14px',
    flexShrink: 0,
    fontWeight: 300,
  },

  /* ── New-news badge ────────── */
  newBadge: {
    background: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '1px 6px',
    borderRadius: 8,
    marginLeft: 6,
    lineHeight: '14px',
    flexShrink: 0,
  },
};
