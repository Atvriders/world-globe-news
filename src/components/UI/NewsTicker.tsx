import React, { useMemo } from 'react';
import { NewsCluster } from '../../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, UI } from '../../data/theme';

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

  // Build the headline list once; duplicate it for seamless looping.
  const items = useMemo(() => {
    if (clusters.length === 0) return null;

    const buildItems = (keyPrefix: string) =>
      clusters.map((cluster, i) => (
        <React.Fragment key={`${keyPrefix}-${cluster.id}`}>
          {i > 0 && <span style={styles.separator}>&#x25C6;</span>}
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
                background: CATEGORY_COLORS[cluster.category],
              }}
            >
              {CATEGORY_LABELS[cluster.category].toUpperCase()}
            </span>
            <span style={styles.headline}>{cluster.title}</span>
          </span>
        </React.Fragment>
      ));

    return (
      <>
        {buildItems('a')}
        <span style={styles.separator}>&#x25C6;</span>
        {buildItems('b')}
      </>
    );
  }, [clusters, onHeadlineClick]);

  if (clusters.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      {/* Badge */}
      {hasBreaking ? (
        <div style={styles.badgeBreaking}>
          <span style={styles.badgeDot} />
          BREAKING
        </div>
      ) : (
        <div style={styles.badgeLatest}>LATEST</div>
      )}

      {/* Scrolling track */}
      <div className="news-ticker-track" style={styles.track}>
        <div className="news-ticker-scroll" style={styles.scroll}>{items}</div>
      </div>

      {/* Inline keyframes (injected once) */}
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
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
.news-ticker-track:hover .news-ticker-scroll {
  animation-play-state: paused;
}
.news-ticker-scroll span:hover {
  color: ${UI.accent} !important;
}
`;

// ── Styles ──────────────────────────────────────────────────────────────────────

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
    background: 'rgba(10, 15, 26, 0.96)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    overflow: 'hidden',
    userSelect: 'none',
  },

  /* ── Badges ─────────────────── */
  badgeBreaking: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    height: '100%',
    background: UI.breaking,
    color: '#fff',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.08em',
    animation: 'badge-pulse 1.5s ease-in-out infinite',
    whiteSpace: 'nowrap',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#fff',
    flexShrink: 0,
  },
  badgeLatest: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    height: '100%',
    background: UI.accent,
    color: '#fff',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.08em',
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
    paddingLeft: 24,
  },

  /* ── Items ──────────────────── */
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    padding: '0 4px',
  },
  categoryPill: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 3,
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: '16px',
    flexShrink: 0,
  },
  headline: {
    color: UI.text,
    fontSize: 12,
    fontWeight: 500,
    transition: 'color 0.15s',
  },
  separator: {
    color: UI.textMuted,
    fontSize: 8,
    margin: '0 14px',
    flexShrink: 0,
  },
};
