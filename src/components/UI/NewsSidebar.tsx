import React, { useMemo, useState } from 'react';
import { NewsCluster, NewsCategory, TimeFilter } from '../../types';
import {
  CATEGORY_COLORS,
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  UI,
} from '../../data/theme';

// ── Types ───────────────────────────────────────────────────────────────────

type SortMode = 'breaking' | 'newest' | 'sources' | 'category';

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

// ── Constants ───────────────────────────────────────────────────────────────

const TIME_OPTIONS: TimeFilter[] = ['1h', '6h', '24h', '7d'];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'breaking', label: 'Breaking First' },
  { value: 'newest', label: 'Newest' },
  { value: 'sources', label: 'Most Sources' },
  { value: 'category', label: 'Category' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

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

const sortClusters = (clusters: NewsCluster[], mode: SortMode): NewsCluster[] => {
  const sorted = [...clusters];
  switch (mode) {
    case 'breaking':
      return sorted.sort((a, b) => {
        if (a.isBreaking !== b.isBreaking) return a.isBreaking ? -1 : 1;
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );
    case 'sources':
      return sorted.sort((a, b) => b.articles.length - a.articles.length);
    case 'category':
      return sorted.sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category);
        if (catCmp !== 0) return catCmp;
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
    default:
      return sorted;
  }
};

const groupByCategory = (
  clusters: NewsCluster[],
): Record<NewsCategory, NewsCluster[]> => {
  const groups: Partial<Record<NewsCategory, NewsCluster[]>> = {};
  for (const c of clusters) {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category]!.push(c);
  }
  return groups as Record<NewsCategory, NewsCluster[]>;
};

// ── Scrollbar style injection ───────────────────────────────────────────────

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
    @keyframes news-sidebar-pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.5; transform: scale(1.4); }
    }
  `;
  document.head.appendChild(style);
};

// ── Component ───────────────────────────────────────────────────────────────

const NewsSidebar: React.FC<NewsSidebarProps> = ({
  clusters,
  selectedCluster,
  onSelectCluster,
  open,
  onToggle,
  timeFilter,
  onTimeFilterChange,
  searchQuery,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState(false);
  const [hoveredClose, setHoveredClose] = useState(false);
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('breaking');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [hoveredSort, setHoveredSort] = useState(false);

  React.useEffect(() => { injectScrollbarStyle(); }, []);

  // ── Derived data ──

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clusters;
    const q = searchQuery.toLowerCase();
    return clusters.filter(
      (c) => c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q),
    );
  }, [clusters, searchQuery]);

  const sorted = useMemo(() => sortClusters(filtered, sortMode), [filtered, sortMode]);

  const breakingCount = useMemo(() => filtered.filter((c) => c.isBreaking).length, [filtered]);

  const activeSourceCount = useMemo(() => {
    const sources = new Set<string>();
    filtered.forEach((c) => c.articles.forEach((a) => sources.add(a.source.name)));
    return sources.size;
  }, [filtered]);

  const categoryGroups = useMemo(() => {
    if (sortMode !== 'category') return null;
    return groupByCategory(sorted);
  }, [sorted, sortMode]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // ── Styles ──

  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    top: 56,
    right: 0,
    height: 'calc(100vh - 92px)',
    zIndex: 900,
    pointerEvents: 'none',
  };

  const tabStyle: React.CSSProperties = {
    position: 'absolute',
    top: 24,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    background: hoveredTab ? 'rgba(18, 18, 24, 0.95)' : 'rgba(18, 18, 24, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
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

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 380,
    height: '100%',
    background: 'rgba(18, 18, 24, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    transition:
      'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    willChange: 'transform, opacity',
  };

  // ── Render helpers ──

  const renderCard = (cluster: NewsCluster) => {
    const isSelected = selectedCluster?.id === cluster.id;
    const isHovered = hoveredCard === cluster.id;
    const icon = CATEGORY_ICONS[cluster.category] || '📰';

    const cardStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: 12,
      borderRadius: 10,
      background: isSelected
        ? 'rgba(124, 92, 252, 0.1)'
        : isHovered
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.04)',
      border: isSelected
        ? '1px solid rgba(124, 92, 252, 0.4)'
        : '1px solid rgba(255,255,255,0.06)',
      marginBottom: 6,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      boxShadow: isSelected
        ? '0 0 16px rgba(124, 92, 252, 0.2)'
        : isHovered
          ? '0 4px 20px rgba(0,0,0,0.35), 0 0 8px rgba(124,92,252,0.08)'
          : 'none',
    };

    const iconWrapStyle: React.CSSProperties = {
      fontSize: 18,
      lineHeight: 1,
      flexShrink: 0,
      marginTop: 2,
    };

    const titleStyle: React.CSSProperties = {
      fontSize: 13,
      fontWeight: 600,
      color: '#f5f0eb',
      margin: 0,
      lineHeight: 1.4,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    };

    const metaRowStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    };

    const sourceBadgeStyle: React.CSSProperties = {
      fontSize: 10,
      fontWeight: 600,
      color: UI.textSecondary,
      background: 'rgba(255, 255, 255, 0.06)',
      padding: '2px 7px',
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.04)',
    };

    const timeStyle: React.CSSProperties = {
      fontSize: 10,
      color: UI.textMuted,
    };

    const breakingDotStyle: React.CSSProperties = {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: UI.breaking,
      boxShadow: `0 0 6px ${UI.breakingGlow}`,
      animation: 'news-sidebar-pulse-dot 2s ease-in-out infinite',
    };

    return (
      <div
        key={cluster.id}
        style={cardStyle}
        onClick={() => onSelectCluster(cluster)}
        onMouseEnter={() => setHoveredCard(cluster.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {cluster.isBreaking && <div style={breakingDotStyle} />}
        <span style={iconWrapStyle}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={titleStyle}>{cluster.title}</p>
          <div style={metaRowStyle}>
            <span style={sourceBadgeStyle}>
              {cluster.articles.length} source{cluster.articles.length !== 1 ? 's' : ''}
            </span>
            <span style={timeStyle}>{timeAgo(cluster.lastUpdated)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryGroup = (cat: NewsCategory, items: NewsCluster[]) => {
    const isCollapsed = collapsedCategories.has(cat);
    const gradients = CATEGORY_GRADIENTS[cat];
    const icon = CATEGORY_ICONS[cat] || '📰';
    const label = CATEGORY_LABELS[cat] || cat;

    const headerBarStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      marginBottom: 6,
      marginTop: 8,
      borderRadius: 8,
      background: gradients
        ? `linear-gradient(135deg, ${gradients[0]}22, ${gradients[1]}11)`
        : 'rgba(255,255,255,0.04)',
      borderLeft: `3px solid ${gradients ? gradients[0] : 'rgba(255,255,255,0.1)'}`,
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.2s ease',
    };

    const headerLabelStyle: React.CSSProperties = {
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: gradients ? gradients[0] : UI.textSecondary,
      flex: 1,
    };

    const headerCountStyle: React.CSSProperties = {
      fontSize: 10,
      fontWeight: 700,
      color: UI.textMuted,
    };

    const chevronStyle: React.CSSProperties = {
      fontSize: 10,
      color: UI.textMuted,
      transition: 'transform 0.2s ease',
      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    };

    return (
      <div key={cat}>
        <div style={headerBarStyle} onClick={() => toggleCategory(cat)}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={headerLabelStyle}>{label.toUpperCase()}</span>
          <span style={headerCountStyle}>({items.length})</span>
          <span style={chevronStyle}>▼</span>
        </div>
        {!isCollapsed && items.map(renderCard)}
      </div>
    );
  };

  // ── Glass badge helper ──
  const glassBadge = (
    content: React.ReactNode,
    extraStyle?: React.CSSProperties,
  ): React.ReactNode => (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: UI.textSecondary,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '3px 8px',
        borderRadius: 8,
        whiteSpace: 'nowrap',
        ...extraStyle,
      }}
    >
      {content}
    </span>
  );

  // ── Render ──

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
          <span style={{ fontSize: 18, lineHeight: 1 }}>📰</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: UI.accent,
              background: 'rgba(124,92,252,0.15)',
              padding: '2px 6px',
              borderRadius: 8,
              lineHeight: 1.2,
            }}
          >
            {clusters.length}
          </span>
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1px',
              color: UI.textSecondary,
              textTransform: 'uppercase',
            }}
          >
            News Feed
          </span>
        </div>
      )}

      {/* Panel */}
      <div style={panelStyle}>
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #9b59b6, #00c6ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              News Feed
            </h2>
            <span
              style={{
                background: 'rgba(124, 92, 252, 0.12)',
                border: '1px solid rgba(124, 92, 252, 0.2)',
                color: UI.accent,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10,
              }}
            >
              {filtered.length}
            </span>
            <span
              style={{
                fontSize: 9,
                color: UI.textMuted,
                fontWeight: 500,
              }}
            >
              {activeSourceCount} sources
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sort dropdown */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              onMouseEnter={() => setHoveredSort(true)}
              onMouseLeave={() => setHoveredSort(false)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: UI.textSecondary,
                background: hoveredSort
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '4px 6px',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none' as any,
                paddingRight: 18,
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\' viewBox=\'0 0 8 5\'%3E%3Cpath d=\'M0 0l4 5 4-5z\' fill=\'%236b6578\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 5px center',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Close button */}
            <button
              style={{
                background: 'none',
                border: 'none',
                color: hoveredClose ? UI.text : UI.textSecondary,
                fontSize: 20,
                cursor: 'pointer',
                padding: '0 2px',
                lineHeight: 1,
                transition: 'color 0.2s ease, transform 0.2s ease',
                transform: hoveredClose ? 'scale(1.1)' : 'scale(1)',
              }}
              onClick={onToggle}
              onMouseEnter={() => setHoveredClose(true)}
              onMouseLeave={() => setHoveredClose(false)}
              aria-label="Close sidebar"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {glassBadge(<>{filtered.length} stories</>)}
          {breakingCount > 0 &&
            glassBadge(
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: UI.breaking,
                    marginRight: 4,
                    verticalAlign: 'middle',
                  }}
                />
                {breakingCount} breaking
              </>,
              {
                color: UI.breaking,
                background: 'rgba(255, 65, 108, 0.1)',
                border: '1px solid rgba(255, 65, 108, 0.15)',
              },
            )}
          {glassBadge(<>{activeSourceCount} active</>)}
        </div>

        {/* ── Time filter pills ── */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px 6px' }}>
          {TIME_OPTIONS.map((tf) => {
            const isActive = timeFilter === tf;
            const isHover = hoveredPill === tf;
            return (
              <button
                key={tf}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive
                    ? 'linear-gradient(135deg, #7c5cfc, #00c6ff)'
                    : isHover
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#fff' : isHover ? UI.text : UI.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onClick={() => onTimeFilterChange(tf)}
                onMouseEnter={() => setHoveredPill(tf)}
                onMouseLeave={() => setHoveredPill(null)}
              >
                {tf}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable list ── */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}
          className={SCROLLBAR_CLASS}
        >
          {filtered.length === 0 ? (
            /* ── Empty state ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                margin: '24px 0',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                gap: 10,
              }}
            >
              <span style={{ fontSize: 32, opacity: 0.4 }}>📭</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: UI.textSecondary,
                  textAlign: 'center',
                }}
              >
                No stories found
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: UI.textMuted,
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Try adjusting your time filter
                <br />
                or broadening your search.
              </span>
            </div>
          ) : sortMode === 'category' && categoryGroups ? (
            /* ── Category-grouped view ── */
            Object.entries(categoryGroups).map(([cat, items]) =>
              items.length > 0
                ? renderCategoryGroup(cat as NewsCategory, items)
                : null,
            )
          ) : (
            /* ── Flat sorted list ── */
            sorted.map(renderCard)
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 10,
            color: UI.textMuted,
            textAlign: 'center',
          }}
        >
          Sources: Reuters, BBC, Al Jazeera, AP, AFP, CNN, The Guardian, NHK
        </div>
      </div>
    </div>
  );
};

export default NewsSidebar;
