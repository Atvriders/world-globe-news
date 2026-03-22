import React, { useMemo, useState, useCallback } from 'react';
import { NewsCluster, TimeFilter } from '../../types';
import { CATEGORY_COLORS, CATEGORY_GRADIENTS, CATEGORY_LABELS, TIME_FILTER_LABELS, UI } from '../../data/theme';

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

// ── Scrollbar style injection ────────────────────────────────────────────────

const SCROLLBAR_CLASS = 'news-sidebar-scroll';
const scrollbarStyleId = 'news-sidebar-scrollbar-css';

const injectScrollbarStyle = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(scrollbarStyleId)) return;
  const style = document.createElement('style');
  style.id = scrollbarStyleId;
  style.textContent = `
    .${SCROLLBAR_CLASS}::-webkit-scrollbar { width: 4px; }
    .${SCROLLBAR_CLASS}::-webkit-scrollbar-track { background: transparent; }
    .${SCROLLBAR_CLASS}::-webkit-scrollbar-thumb {
      background: rgba(124, 92, 252, 0.3);
      border-radius: 999px;
    }
    .${SCROLLBAR_CLASS}::-webkit-scrollbar-thumb:hover {
      background: rgba(124, 92, 252, 0.5);
    }
    .${SCROLLBAR_CLASS} {
      scrollbar-width: thin;
      scrollbar-color: rgba(124, 92, 252, 0.3) transparent;
    }
    @keyframes news-sidebar-breaking-border {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(style);
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState(false);
  const [hoveredClose, setHoveredClose] = useState(false);
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Inject scrollbar styles once
  React.useEffect(() => { injectScrollbarStyle(); }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clusters;
    const q = searchQuery.toLowerCase();
    return clusters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q),
    );
  }, [clusters, searchQuery]);

  // ── Wrapper ──
  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    top: 56,
    right: 0,
    height: 'calc(100vh - 92px)',
    zIndex: 900,
    display: 'flex',
    pointerEvents: 'none',
  };

  // ── Collapsed Tab ──
  const tabStyle: React.CSSProperties = {
    alignSelf: 'flex-start',
    marginTop: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    background: hoveredTab ? 'rgba(18, 18, 24, 0.95)' : 'rgba(18, 18, 24, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRight: 'none',
    borderRadius: '12px 0 0 12px',
    padding: '14px 10px',
    cursor: 'pointer',
    pointerEvents: 'auto',
    userSelect: 'none',
    transition: 'all 0.2s ease',
    boxShadow: hoveredTab
      ? '-8px 0 40px rgba(0,0,0,0.5), 0 0 16px rgba(124,92,252,0.15)'
      : '-4px 0 20px rgba(0,0,0,0.3)',
  };

  const tabIconStyle: React.CSSProperties = {
    fontSize: 18,
    lineHeight: 1,
  };

  const tabCountStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: UI.accent,
    background: 'rgba(124,92,252,0.15)',
    padding: '2px 6px',
    borderRadius: 8,
    lineHeight: 1.2,
  };

  const tabTextStyle: React.CSSProperties = {
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    color: UI.textSecondary,
    textTransform: 'uppercase',
  };

  // ── Panel ──
  const panelStyle: React.CSSProperties = {
    width: 380,
    height: '100%',
    background: 'rgba(18, 18, 24, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
  };

  // ── Header ──
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #9b59b6, #00c6ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const countBadgeStyle: React.CSSProperties = {
    background: 'rgba(124, 92, 252, 0.12)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(124, 92, 252, 0.2)',
    color: UI.accent,
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 12,
    boxShadow: '0 0 12px rgba(124, 92, 252, 0.15)',
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: hoveredClose ? UI.text : UI.textSecondary,
    fontSize: 22,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    transition: 'color 0.2s ease, transform 0.2s ease',
    transform: hoveredClose ? 'scale(1.1)' : 'scale(1)',
  };

  // ── Filter pills ──
  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    padding: '12px 20px 8px',
  };

  const getFilterPillStyle = (tf: TimeFilter): React.CSSProperties => {
    const isActive = timeFilter === tf;
    const isHovered = hoveredPill === tf;
    return {
      fontSize: 11,
      fontWeight: 600,
      padding: '5px 12px',
      borderRadius: 16,
      border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
      background: isActive
        ? 'linear-gradient(135deg, #7c5cfc, #00c6ff)'
        : isHovered
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.04)',
      color: isActive ? '#fff' : isHovered ? UI.text : UI.textSecondary,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
    };
  };

  // ── Search ──
  const searchWrapStyle: React.CSSProperties = {
    position: 'relative',
    padding: '8px 20px 12px',
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 32,
    top: '50%',
    transform: 'translateY(-50%)',
    color: UI.textMuted,
    fontSize: 13,
    pointerEvents: 'none',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: `1px solid ${searchFocused ? 'rgba(124, 92, 252, 0.4)' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 12,
    padding: '9px 14px 9px 34px',
    fontSize: 12,
    color: UI.text,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: searchFocused ? '0 0 12px rgba(124, 92, 252, 0.1)' : 'none',
  };

  // ── List ──
  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 14px',
  };

  // ── Card builder ──
  const getCardStyle = (cluster: NewsCluster, isSelected: boolean, isHovered: boolean): React.CSSProperties => {
    const isBreaking = cluster.isBreaking;
    return {
      position: 'relative',
      display: 'flex',
      background: isSelected
        ? 'rgba(124, 92, 252, 0.1)'
        : isHovered
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.04)',
      borderRadius: 12,
      border: isBreaking
        ? '1px solid transparent'
        : isSelected
          ? '1px solid rgba(124, 92, 252, 0.4)'
          : '1px solid rgba(255,255,255,0.06)',
      marginBottom: 8,
      cursor: 'pointer',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      transform: isHovered ? 'scale(1.01)' : 'scale(1)',
      boxShadow: isSelected
        ? '0 0 20px rgba(124, 92, 252, 0.2)'
        : isHovered
          ? '0 4px 16px rgba(0,0,0,0.3)'
          : 'none',
      ...(isBreaking ? {
        backgroundImage: 'linear-gradient(rgba(18,18,24,0.85), rgba(18,18,24,0.85)), linear-gradient(90deg, #ff416c, #ff4b2b, #ff416c)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        backgroundSize: isBreaking ? '100% 100%, 200% 200%' : undefined,
        animation: isBreaking ? 'news-sidebar-breaking-border 3s ease infinite' : undefined,
      } : {}),
    };
  };

  const categoryBarStyle = (color: string, gradients?: [string, string]): React.CSSProperties => ({
    width: 4,
    flexShrink: 0,
    borderRadius: '12px 0 0 12px',
    background: gradients
      ? `linear-gradient(180deg, ${gradients[0]}, ${gradients[1]})`
      : color,
  });

  const cardContentStyle: React.CSSProperties = {
    flex: 1,
    padding: 14,
    minWidth: 0,
  };

  const cardTopRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  };

  const getCategoryPillStyle = (category: string): React.CSSProperties => {
    const gradients = CATEGORY_GRADIENTS[category as keyof typeof CATEGORY_GRADIENTS];
    return {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '2px 8px',
      borderRadius: 8,
      background: gradients
        ? `linear-gradient(135deg, ${gradients[0]}, ${gradients[1]})`
        : 'rgba(255,255,255,0.1)',
      color: '#fff',
      lineHeight: 1.4,
    };
  };

  const breakingBadgeStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: '#fff',
    background: UI.breakingGradient,
    padding: '2px 8px',
    borderRadius: 8,
    letterSpacing: '0.5px',
    flexShrink: 0,
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#f5f0eb',
    margin: 0,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const summaryTextStyle: React.CSSProperties = {
    fontSize: 12,
    color: UI.textSecondary,
    lineHeight: 1.4,
    marginTop: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: '4px 0 0 0',
  };

  const cardBottomRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  };

  const timeTextStyle: React.CSSProperties = {
    fontSize: 11,
    color: UI.textMuted,
  };

  const sourceBadgeStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: UI.textSecondary,
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    padding: '2px 8px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.04)',
  };

  // ── Empty state ──
  const emptyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 12,
  };

  const emptyIconStyle: React.CSSProperties = {
    fontSize: 36,
    opacity: 0.4,
  };

  const emptyTextStyle: React.CSSProperties = {
    fontSize: 13,
    color: UI.textMuted,
    textAlign: 'center',
    lineHeight: 1.5,
  };

  // ── Footer ──
  const footerStyle: React.CSSProperties = {
    padding: '12px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: 10,
    color: UI.textMuted,
    textAlign: 'center',
  };

  return (
    <div style={wrapperStyle}>
      {/* Collapsed tab */}
      {!open && (
        <div
          style={tabStyle}
          onClick={onToggle}
          onMouseEnter={() => setHoveredTab(true)}
          onMouseLeave={() => setHoveredTab(false)}
          title="Open news sidebar"
        >
          <span style={tabIconStyle}>📰</span>
          <span style={tabCountStyle}>{clusters.length}</span>
          <span style={tabTextStyle}>News Feed</span>
        </div>
      )}

      {/* Panel */}
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={titleStyle}>News Feed</h2>
            <span style={countBadgeStyle}>{filtered.length}</span>
          </div>
          <button
            style={closeBtnStyle}
            onClick={onToggle}
            onMouseEnter={() => setHoveredClose(true)}
            onMouseLeave={() => setHoveredClose(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* Time filter pills */}
        <div style={filterRowStyle}>
          {TIME_OPTIONS.map((tf) => (
            <button
              key={tf}
              style={getFilterPillStyle(tf)}
              onClick={() => onTimeFilterChange(tf)}
              onMouseEnter={() => setHoveredPill(tf)}
              onMouseLeave={() => setHoveredPill(null)}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={searchWrapStyle}>
          <span style={searchIconStyle}>🔍</span>
          <input
            type="text"
            style={searchInputStyle}
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Scrollable list */}
        <div style={listStyle} className={SCROLLBAR_CLASS}>
          {filtered.length === 0 && (
            <div style={emptyStyle}>
              <span style={emptyIconStyle}>📭</span>
              <span style={emptyTextStyle}>
                No stories found.<br />Try adjusting your filters.
              </span>
            </div>
          )}
          {filtered.map((cluster) => {
            const isSelected = selectedCluster?.id === cluster.id;
            const isHovered = hoveredCard === cluster.id;
            const barColor = cluster.isBreaking
              ? UI.breaking
              : CATEGORY_COLORS[cluster.category];
            const gradients = cluster.isBreaking
              ? [UI.breaking, UI.breakingEnd] as [string, string]
              : CATEGORY_GRADIENTS[cluster.category];

            return (
              <div
                key={cluster.id}
                style={getCardStyle(cluster, isSelected, isHovered)}
                onClick={() => onSelectCluster(cluster)}
                onMouseEnter={() => setHoveredCard(cluster.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Category gradient bar */}
                <div style={categoryBarStyle(barColor, gradients)} />

                {/* Content */}
                <div style={cardContentStyle}>
                  <div style={cardTopRowStyle}>
                    <span style={getCategoryPillStyle(cluster.category)}>
                      {CATEGORY_LABELS[cluster.category]}
                    </span>
                    {cluster.isBreaking && (
                      <span style={breakingBadgeStyle}>BREAKING</span>
                    )}
                  </div>
                  <p style={cardTitleStyle}>{cluster.title}</p>
                  <p style={summaryTextStyle}>{cluster.summary}</p>
                  <div style={cardBottomRowStyle}>
                    <span style={timeTextStyle}>
                      {timeAgo(cluster.lastUpdated)}
                    </span>
                    <span style={sourceBadgeStyle}>
                      {cluster.articles.length} source{cluster.articles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          Sources: Reuters, BBC, Al Jazeera, AP, AFP, CNN, The Guardian, NHK
        </div>
      </div>
    </div>
  );
};

export default NewsSidebar;
