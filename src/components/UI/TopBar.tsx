import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NewsCategory } from '../../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, UI } from '../../data/theme';
import { useIsMobile } from '../../hooks/useIsMobile';

interface TopBarProps {
  selectedCategory: NewsCategory | 'all';
  onCategoryChange: (cat: NewsCategory | 'all') => void;
  onRefresh?: () => void;
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

/** Gradient pairs per category for active/hover highlights */
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

/** Default story counts per category (updated at runtime) */
const STORY_COUNTS: Record<string, number> = {
  all: 142,
  world: 34,
  politics: 22,
  business: 18,
  technology: 16,
  sports: 19,
  health: 11,
  science: 9,
  entertainment: 13,
};

function formatUTCTime(): string {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m} UTC`;
}

function getCategoryIcon(cat: NewsCategory | 'all'): string {
  if (cat === 'all') return '🌐';
  return CATEGORY_ICONS[cat] || '📰';
}

function getCategoryLabel(cat: NewsCategory | 'all'): string {
  if (cat === 'all') return 'All Categories';
  return CATEGORY_LABELS[cat];
}

const TopBar: React.FC<TopBarProps> = ({ selectedCategory, onCategoryChange, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [clock, setClock] = useState(formatUTCTime);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setClock(formatUTCTime()), 1000);
    return () => clearInterval(id);
  }, []);

  // Click outside to close
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, handleClickOutside]);

  const handleSelect = (cat: NewsCategory | 'all') => {
    onCategoryChange(cat);
    setMenuOpen(false);
  };

  const totalStories = STORY_COUNTS.all;
  const totalSources = 17;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 52,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(18, 18, 24, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Left: Brand ──────────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Animated live dot */}
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'topbar-dot-cycle 3s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: 1.8,
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

      {/* ── Center: Category Dropdown ────────────────────── */}
      <div style={{ position: 'relative', flexShrink: isMobile ? 1 : 0, flex: isMobile ? 1 : 'none', margin: isMobile ? '0 8px' : undefined }}>
        <button
          ref={buttonRef}
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 10,
            width: isMobile ? '100%' : undefined,
            border: `1px solid ${menuOpen ? 'rgba(124, 92, 252, 0.4)' : 'rgba(255,255,255,0.1)'}`,
            background: menuOpen ? 'rgba(124, 92, 252, 0.12)' : 'rgba(255,255,255,0.05)',
            color: '#f5f0eb',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 14 }}>{getCategoryIcon(selectedCategory)}</span>
          <span>{getCategoryLabel(selectedCategory)}</span>
          <span
            style={{
              fontSize: 10,
              opacity: 0.5,
              marginLeft: 2,
              transition: 'transform 0.2s ease',
              transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            ▾
          </span>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              minWidth: 220,
              background: 'rgba(22, 22, 30, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
              padding: '6px 0',
              animation: 'topbar-dropdown-in 0.18s ease-out forwards',
              zIndex: 1200,
            }}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const hovered = hoveredItem === cat;
              const color = cat === 'all' ? UI.accent : CATEGORY_COLORS[cat];
              const [g1, g2] = CATEGORY_GRADIENTS[cat] || ['#7c5cfc', '#00c6ff'];
              const count = STORY_COUNTS[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => handleSelect(cat)}
                  onMouseEnter={() => setHoveredItem(cat)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    position: 'relative' as const,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 14px',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? '#fff' : hovered ? '#f5f0eb' : 'rgba(255,255,255,0.65)',
                    background: active
                      ? `linear-gradient(135deg, ${g1}30, ${g2}20)`
                      : hovered
                        ? 'rgba(255,255,255,0.06)'
                        : 'transparent',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>
                    {getCategoryIcon(cat)}
                  </span>

                  {/* Label */}
                  <span style={{ flex: 1 }}>{getCategoryLabel(cat)}</span>

                  {/* Story count badge */}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 8,
                      background: active ? 'rgba(255,255,255,0.18)' : `${color}18`,
                      color: active ? '#fff' : `${color}cc`,
                      lineHeight: '14px',
                    }}
                  >
                    {count}
                  </span>

                  {/* Active indicator bar */}
                  {active && (
                    <span
                      style={{
                        position: 'absolute' as const,
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 18,
                        borderRadius: '0 3px 3px 0',
                        background: `linear-gradient(180deg, ${g1}, ${g2})`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: Clock + LIVE + Stats ──────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}
      >
        {/* Clock */}
        <span
          style={{
            color: '#f5f0e8',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "'Inter', monospace",
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {clock}
        </span>

        {/* Divider */}
        <span
          style={{
            width: 1,
            height: 16,
            background: 'rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        />

        {/* LIVE badge */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#00e676',
              boxShadow: '0 0 6px rgba(0, 230, 118, 0.5)',
              animation: 'topbar-live-pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: 1.5,
              color: '#00e676',
              opacity: 0.85,
            }}
          >
            LIVE
          </span>
        </span>

        {/* Divider */}
        <span
          style={{
            width: 1,
            height: 16,
            background: 'rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        />

        {/* Stats */}
        {!isMobile && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              fontFamily: "'Inter', sans-serif",
              color: UI.textMuted,
              whiteSpace: 'nowrap',
            }}
          >
            {totalStories} stories · {totalSources} sources
          </span>
        )}

        {/* Update Sources button */}
        {onRefresh && !isMobile && (
          <>
            <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
            <button
              onClick={() => {
                setRefreshing(true);
                onRefresh();
                setTimeout(() => setRefreshing(false), 3000);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                background: refreshing ? 'rgba(124, 92, 252, 0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${refreshing ? 'rgba(124, 92, 252, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8,
                color: refreshing ? '#7c5cfc' : '#a8a3b3',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.04em',
                cursor: refreshing ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{
                display: 'inline-block',
                fontSize: 12,
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }}>
                ↻
              </span>
              {refreshing ? 'Updating...' : 'Update Sources'}
            </button>
          </>
        )}
      </div>

      {/* ── Keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes topbar-dot-cycle {
          0%   { background: #7c5cfc; box-shadow: 0 0 6px #7c5cfc88; }
          33%  { background: #00c6ff; box-shadow: 0 0 6px #00c6ff88; }
          66%  { background: #ec4899; box-shadow: 0 0 6px #ec489988; }
          100% { background: #7c5cfc; box-shadow: 0 0 6px #7c5cfc88; }
        }
        @keyframes topbar-live-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(0, 230, 118, 0.5); }
          50%      { opacity: 0.5; box-shadow: 0 0 12px rgba(0, 230, 118, 0.8); }
        }
        @keyframes topbar-dropdown-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TopBar;
