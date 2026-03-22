import React, { useMemo } from 'react';
import { NewsCluster, TimeFilter } from '../../types';
import { CATEGORY_COLORS, TIME_FILTER_LABELS, UI } from '../../data/theme';

// ── Props ────────────────────────────────────────────────────────────────────

interface NewsSidebarProps {
  clusters: NewsCluster[];
  selectedCluster: NewsCluster | null;
  onSelectCluster: (cluster: NewsCluster) => void;
  open: boolean;
  onToggle: () => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (tf: TimeFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const TIME_OPTIONS: TimeFilter[] = ['1h', '6h', '24h', '7d'];

// ── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    top: 48,
    right: 0,
    height: 'calc(100vh - 84px)',
    zIndex: 900,
    display: 'flex',
    pointerEvents: 'none',
  },

  // Collapsed tab
  tab: {
    alignSelf: 'flex-start',
    marginTop: 24,
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    background: UI.bgPanel,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: UI.text,
    border: `1px solid ${UI.border}`,
    borderRight: 'none',
    borderRadius: '8px 0 0 8px',
    padding: '14px 8px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    pointerEvents: 'auto',
    userSelect: 'none',
    transition: 'background 0.2s ease',
  },

  // Main panel
  panel: {
    width: 360,
    height: '100%',
    background: UI.bgPanel,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderLeft: `1px solid ${UI.border}`,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    pointerEvents: 'auto',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: `1px solid ${UI.border}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: UI.text,
    margin: 0,
  },
  badge: {
    background: 'rgba(59, 130, 246, 0.18)',
    color: UI.accent,
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: UI.textSecondary,
    fontSize: 20,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    transition: 'color 0.15s',
  },

  // Time filter row
  filterRow: {
    display: 'flex',
    gap: 6,
    padding: '10px 16px 6px',
  },
  filterPill: {
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 12,
    border: `1px solid ${UI.border}`,
    background: 'transparent',
    color: UI.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterPillActive: {
    background: 'rgba(59, 130, 246, 0.18)',
    borderColor: UI.accent,
    color: UI.accent,
  },

  // Search
  searchWrap: {
    position: 'relative' as const,
    padding: '8px 16px 10px',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 28,
    top: '50%',
    transform: 'translateY(-50%)',
    color: UI.textMuted,
    fontSize: 13,
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${UI.border}`,
    borderRadius: 8,
    padding: '8px 12px 8px 32px',
    fontSize: 12,
    color: UI.text,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },

  // Scrollable list
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 12px',
  },

  // Card
  card: {
    position: 'relative' as const,
    display: 'flex',
    background: UI.bgCard,
    borderRadius: 8,
    border: `1px solid ${UI.border}`,
    marginBottom: 8,
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  },
  cardSelected: {
    borderColor: UI.borderActive,
    background: 'rgba(59, 130, 246, 0.08)',
  },
  categoryBar: {
    width: 3,
    flexShrink: 0,
    borderRadius: '8px 0 0 8px',
  },
  cardContent: {
    flex: 1,
    padding: '10px 12px',
    minWidth: 0,
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: UI.text,
    margin: 0,
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  breakingBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: '#fff',
    background: UI.breaking,
    padding: '2px 6px',
    borderRadius: 4,
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sourceBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: UI.textSecondary,
    background: 'rgba(255, 255, 255, 0.06)',
    padding: '1px 6px',
    borderRadius: 4,
  },
  timeText: {
    fontSize: 10,
    color: UI.textMuted,
  },
  summaryText: {
    fontSize: 11,
    color: UI.textSecondary,
    lineHeight: 1.4,
    marginTop: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  // Footer
  footer: {
    padding: '10px 16px',
    borderTop: `1px solid ${UI.border}`,
    fontSize: 10,
    color: UI.textMuted,
    textAlign: 'center' as const,
  },
};

// ── Component ────────────────────────────────────────────────────────────────

const NewsSidebar: React.FC<NewsSidebarProps> = ({
  clusters,
  selectedCluster,
  onSelectCluster,
  open,
  onToggle,
  timeFilter,
  onTimeFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clusters;
    const q = searchQuery.toLowerCase();
    return clusters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q),
    );
  }, [clusters, searchQuery]);

  return (
    <div style={styles.wrapper}>
      {/* Collapsed tab */}
      {!open && (
        <div
          style={styles.tab}
          onClick={onToggle}
          title="Open news sidebar"
        >
          📰 News
        </div>
      )}

      {/* Panel */}
      <div
        style={{
          ...styles.panel,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>Latest News</h2>
            <span style={styles.badge}>{filtered.length}</span>
          </div>
          <button
            style={styles.closeBtn}
            onClick={onToggle}
            onMouseEnter={(e) => (e.currentTarget.style.color = UI.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = UI.textSecondary)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* Time filter pills */}
        <div style={styles.filterRow}>
          {TIME_OPTIONS.map((tf) => (
            <button
              key={tf}
              style={{
                ...styles.filterPill,
                ...(timeFilter === tf ? styles.filterPillActive : {}),
              }}
              onClick={() => onTimeFilterChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = UI.borderActive)}
            onBlur={(e) => (e.currentTarget.style.borderColor = UI.border)}
          />
        </div>

        {/* Scrollable list */}
        <div style={styles.list}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: UI.textMuted, fontSize: 13 }}>
              No stories found
            </div>
          )}
          {filtered.map((cluster) => {
            const isSelected = selectedCluster?.id === cluster.id;
            const barColor = cluster.isBreaking
              ? UI.breaking
              : CATEGORY_COLORS[cluster.category];

            return (
              <div
                key={cluster.id}
                style={{
                  ...styles.card,
                  ...(isSelected ? styles.cardSelected : {}),
                }}
                onClick={() => onSelectCluster(cluster)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = UI.bgCardHover;
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = UI.bgCard;
                    e.currentTarget.style.borderColor = UI.border;
                  }
                }}
              >
                {/* Category color bar */}
                <div style={{ ...styles.categoryBar, background: barColor }} />

                {/* Content */}
                <div style={styles.cardContent}>
                  <div style={styles.cardTopRow}>
                    {cluster.isBreaking && (
                      <span style={styles.breakingBadge}>BREAKING</span>
                    )}
                  </div>
                  <p style={styles.cardTitle}>{cluster.title}</p>
                  <div style={styles.cardMeta}>
                    <span style={styles.sourceBadge}>
                      {cluster.articles.length} source{cluster.articles.length !== 1 ? 's' : ''}
                    </span>
                    <span style={styles.timeText}>
                      {timeAgo(cluster.lastUpdated)}
                    </span>
                  </div>
                  <p style={styles.summaryText}>{cluster.summary}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          Sources: Reuters, BBC, Al Jazeera, AP, AFP, CNN, The Guardian, NHK
        </div>
      </div>
    </div>
  );
};

export default NewsSidebar;
