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

/** Gradient pairs per category for active pill backgrounds */
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  all:           ['#7c5cfc', '#00c6ff'],
  world:         ['#3b82f6', '#60a5fa'],
  politics:      ['#ef4444', '#f87171'],
  business:      ['#f59e0b', '#fbbf24'],
  technology:    ['#8b5cf6', '#a78bfa'],
  sports:        ['#22c55e', '#4ade80'],
  health:        ['#ec4899', '#f472b6'],
  science:       ['#06b6d4', '#22d3ee'],
  entertainment: ['#f97316', '#fb923c'],
};

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

  const pillLabel = (cat: NewsCategory | 'all'): string =>
    cat === 'all' ? 'All' : CATEGORY_LABELS[cat];

  const pillColor = (cat: NewsCategory | 'all'): string =>
    cat === 'all' ? UI.accent : CATEGORY_COLORS[cat];

  const pillGradient = (cat: NewsCategory | 'all'): string => {
    const [a, b] = CATEGORY_GRADIENTS[cat] || ['#7c5cfc', '#00c6ff'];
    return `linear-gradient(135deg, ${a}, ${b})`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 56,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(18, 18, 24, 0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Left: Brand ──────────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Animated gradient dot — "live" indicator */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'topbar-dot-cycle 3s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: 2,
            whiteSpace: 'nowrap',
            background: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } as React.CSSProperties}
        >
          WORLD GLOBE NEWS
        </span>
      </div>

      {/* ── Center: Category Pills ────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          const hovered = hoveredPill === cat;
          const color = pillColor(cat);

          const pillStyle: React.CSSProperties = {
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            padding: '6px 16px',
            borderRadius: 20,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            outline: 'none',
            lineHeight: '16px',
            border: active
              ? '1px solid transparent'
              : `1px solid ${hovered ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
            background: active ? pillGradient(cat) : 'transparent',
            color: active ? '#fff' : hovered ? color : 'rgba(255,255,255,0.55)',
            transform: hovered && !active ? 'scale(1.02)' : 'scale(1)',
            boxShadow: hovered && !active ? `0 0 12px ${color}30` : 'none',
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

      {/* ── Right: Clock + LIVE FEED ──────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
          gap: 2,
        }}
      >
        <span
          style={{
            color: '#f5f0e8',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'Inter', monospace",
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {clock}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            color: 'rgba(255,255,255,0.45)',
            animation: 'topbar-live-breathe 2.5s ease-in-out infinite',
          }}
        >
          LIVE FEED
        </span>
      </div>

      {/* ── Keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes topbar-dot-cycle {
          0%   { background: #7c5cfc; box-shadow: 0 0 6px #7c5cfc88; }
          33%  { background: #00c6ff; box-shadow: 0 0 6px #00c6ff88; }
          66%  { background: #ec4899; box-shadow: 0 0 6px #ec489988; }
          100% { background: #7c5cfc; box-shadow: 0 0 6px #7c5cfc88; }
        }
        @keyframes topbar-live-breathe {
          0%, 100% { opacity: 0.45; text-shadow: 0 0 4px transparent; }
          50%      { opacity: 1; text-shadow: 0 0 8px rgba(0,198,255,0.4); }
        }
      `}</style>
    </div>
  );
};

export default TopBar;
