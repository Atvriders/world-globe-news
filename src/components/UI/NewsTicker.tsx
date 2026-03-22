import React, { useMemo } from 'react';
import { NewsCluster } from '../../types';
import { CATEGORY_GRADIENTS, CATEGORY_LABELS } from '../../data/theme';

// ── Props ───────────────────────────────────────────────────────────────────────

interface NewsTickerProps {
  clusters: NewsCluster[];
  onHeadlineClick: (cluster: NewsCluster) => void;
}

// ── Component ───────────────────────────────────────────────────────────────────

const NewsTicker: React.FC<NewsTickerProps> = ({ clusters, onHeadlineClick }) => {
  const hasBreaking = useMemo(
    () => clusters.some((c) => c.isBreaking),
    [clusters],
  );

  const items = useMemo(() => {
    if (clusters.length === 0) return null;

    const buildItems = (keyPrefix: string) =>
      clusters.map((cluster, i) => {
        const grad = CATEGORY_GRADIENTS[cluster.category];
        return (
          <React.Fragment key={`${keyPrefix}-${cluster.id}`}>
            {i > 0 && <span style={styles.separator}>{'\u25C6'}</span>}
            <span
              style={styles.item}
              onClick={(e) => {
                e.stopPropagation();
                onHeadlineClick(cluster);
              }}
            >
              <span
                style={{
                  ...styles.categoryPill,
                  background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                }}
              >
                {CATEGORY_LABELS[cluster.category].toUpperCase()}
              </span>
              <span style={styles.headline}>{cluster.title}</span>
            </span>
          </React.Fragment>
        );
      });

    return (
      <>
        {buildItems('a')}
        <span style={styles.separator}>{'\u25C6'}</span>
        {buildItems('b')}
      </>
    );
  }, [clusters, onHeadlineClick]);

  if (clusters.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      {/* Badge */}
      {hasBreaking ? (
        <div className="news-ticker-badge-breaking" style={styles.badgeBreaking}>
          BREAKING
        </div>
      ) : (
        <div style={styles.badgeLatest}>LATEST</div>
      )}

      {/* Scrolling track */}
      <div className="news-ticker-track" style={styles.track}>
        <div className="news-ticker-scroll" style={styles.scroll}>{items}</div>
      </div>

      {/* Inline keyframes */}
      <style>{tickerCSS}</style>
    </div>
  );
};

export default NewsTicker;

// ── Inline keyframes ────────────────────────────────────────────────────────────

const tickerCSS = `
@keyframes ticker-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes badge-gradient-cycle {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.news-ticker-track {
  cursor: default;
}
.news-ticker-track:hover {
  cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='10' cy='10' r='8' fill='rgba(124,92,252,0.25)' stroke='rgba(124,92,252,0.6)' stroke-width='1.5'/></svg>") 10 10, pointer;
}
.news-ticker-track:hover .news-ticker-scroll {
  animation-play-state: paused;
}
.news-ticker-badge-breaking {
  animation: badge-gradient-cycle 3s ease infinite;
}
`;

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 40,
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(18, 18, 24, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: 12,
    overflow: 'hidden',
    userSelect: 'none',
  },

  /* ── Badges ─────────────────── */
  badgeBreaking: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 0 0 10px',
    padding: '4px 14px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #ff416c, #ff4b2b, #ff416c, #ff4b2b)',
    backgroundSize: '300% 300%',
    color: '#fff',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
  },
  badgeLatest: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 0 0 10px',
    padding: '4px 14px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
  },

  /* ── Scrolling track ────────── */
  track: {
    flex: 1,
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  scroll: {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    animation: 'ticker-scroll 60s linear infinite',
    paddingLeft: 20,
  },

  /* ── Items ──────────────────── */
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    cursor: 'pointer',
    padding: '0 4px',
    transition: 'opacity 0.2s ease',
  },
  categoryPill: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 8,
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: '16px',
    flexShrink: 0,
  },
  headline: {
    color: '#f5f0eb',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.03em',
    transition: 'color 0.2s ease, opacity 0.2s ease',
  },
  separator: {
    color: '#6b6578',
    opacity: 0.4,
    fontSize: 7,
    margin: '0 16px',
    flexShrink: 0,
  },
};
