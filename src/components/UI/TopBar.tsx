import React, { useState, useEffect } from 'react';
import { NewsCategory } from '../../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, UI } from '../../data/theme';

interface TopBarProps {
  selectedCategory: NewsCategory | 'all';
  onCategoryChange: (cat: NewsCategory | 'all') => void;
}

const CATEGORIES: (NewsCategory | 'all')[] = [
  'all',
  'world',
  'politics',
  'business',
  'technology',
  'sports',
  'health',
  'science',
  'entertainment',
];

function formatUTCTime(): string {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  return `${h}:${m}:${s} UTC`;
}

const TopBar: React.FC<TopBarProps> = ({ selectedCategory, onCategoryChange }) => {
  const [clock, setClock] = useState(formatUTCTime);
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setClock(formatUTCTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const pillColor = (cat: NewsCategory | 'all'): string =>
    cat === 'all' ? UI.accent : CATEGORY_COLORS[cat];

  const pillLabel = (cat: NewsCategory | 'all'): string =>
    cat === 'all' ? 'All' : CATEGORY_LABELS[cat];

  return (
    <div style={styles.bar}>
      {/* ── Left: Title ─────────────────────────────────── */}
      <div style={styles.left}>
        <span style={styles.title}>WORLD GLOBE NEWS</span>
      </div>

      {/* ── Center: Category Pills ──────────────────────── */}
      <div style={styles.center}>
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          const color = pillColor(cat);
          const hovered = hoveredPill === cat;

          const pillStyle: React.CSSProperties = {
            ...styles.pill,
            background: active ? color : hovered ? `${color}22` : 'transparent',
            border: `1px solid ${active ? color : `${color}66`}`,
            color: active ? '#fff' : color,
          };

          return (
            <button
              key={cat}
              style={pillStyle}
              onClick={() => onCategoryChange(cat)}
              onMouseEnter={() => setHoveredPill(cat)}
              onMouseLeave={() => setHoveredPill(null)}
            >
              {pillLabel(cat)}
            </button>
          );
        })}
      </div>

      {/* ── Right: Clock + LIVE badge ───────────────────── */}
      <div style={styles.right}>
        <span style={styles.clock}>{clock}</span>
        <span style={styles.liveBadge}>
          <span style={styles.liveDot} />
          LIVE
        </span>
      </div>

      {/* Inline keyframes for the pulsing dot */}
      <style>{`
        @keyframes topbar-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: 48,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: 'rgba(10, 15, 26, 0.95)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${UI.border}`,
    boxSizing: 'border-box',
  },
  left: {
    flexShrink: 0,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  center: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  pill: {
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    padding: '3px 10px',
    borderRadius: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s ease',
    outline: 'none',
    lineHeight: '18px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  clock: {
    color: UI.textSecondary,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "'Inter', monospace",
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.35)',
    borderRadius: 10,
    padding: '2px 8px',
    color: UI.success,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: UI.success,
    display: 'inline-block',
    animation: 'topbar-pulse 1.5s ease-in-out infinite',
  },
};

export default TopBar;
