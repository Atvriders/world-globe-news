import { NewsCategory } from '../types';

// ── Category Colors ──────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  world:         '#3b82f6', // blue
  politics:      '#ef4444', // red
  business:      '#f59e0b', // amber
  technology:    '#8b5cf6', // violet
  sports:        '#22c55e', // green
  health:        '#ec4899', // pink
  science:       '#06b6d4', // cyan
  entertainment: '#f97316', // orange
};

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  world:         'World',
  politics:      'Politics',
  business:      'Business',
  technology:    'Technology',
  sports:        'Sports',
  health:        'Health',
  science:       'Science',
  entertainment: 'Entertainment',
};

export const CATEGORY_ICONS: Record<NewsCategory, string> = {
  world:         '🌍',
  politics:      '🏛️',
  business:      '📈',
  technology:    '💻',
  sports:        '⚽',
  health:        '🏥',
  science:       '🔬',
  entertainment: '🎬',
};

// ── UI Colors ────────────────────────────────────────────────────────────────

export const UI = {
  bg:             '#0a0f1a',
  bgPanel:        'rgba(10, 15, 26, 0.95)',
  bgCard:         'rgba(255, 255, 255, 0.04)',
  bgCardHover:    'rgba(255, 255, 255, 0.08)',
  border:         'rgba(255, 255, 255, 0.08)',
  borderActive:   'rgba(59, 130, 246, 0.5)',
  text:           '#e2e8f0',
  textSecondary:  '#94a3b8',
  textMuted:      '#475569',
  accent:         '#3b82f6',
  accentGlow:     'rgba(59, 130, 246, 0.3)',
  breaking:       '#ef4444',
  breakingGlow:   'rgba(239, 68, 68, 0.4)',
  success:        '#22c55e',
  warning:        '#f59e0b',
};

// ── Globe Settings ───────────────────────────────────────────────────────────

export const GLOBE = {
  atmosphereColor: '#3b82f6',
  atmosphereAltitude: 0.2,
  globeImageUrl: '/img/earth-blue-marble.jpg',
  bumpImageUrl: '/img/earth-topology.png',
  backgroundImageUrl: '/img/night-sky.png',
  pinBaseSize: 0.4,
  pinBreakingSize: 0.7,
  arcStroke: 0.5,
};

// ── Time filter labels ───────────────────────────────────────────────────────

export const TIME_FILTER_LABELS: Record<string, string> = {
  '1h':  'Last Hour',
  '6h':  'Last 6 Hours',
  '24h': 'Last 24 Hours',
  '7d':  'Last 7 Days',
};

// ── Breaking news threshold ──────────────────────────────────────────────────

export const BREAKING_SOURCE_THRESHOLD = 3; // 3+ sources = breaking

// ── CSS Animations ───────────────────────────────────────────────────────────

export const GLOBAL_CSS = `
  @keyframes breaking-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
  @keyframes pin-glow {
    0%, 100% { box-shadow: 0 0 4px var(--glow-color); }
    50% { box-shadow: 0 0 12px var(--glow-color); }
  }
  @keyframes ticker-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .breaking-pulse {
    animation: breaking-pulse 1.5s ease-in-out infinite;
  }
  ::-webkit-scrollbar {
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

// ── Reliability tier badges ──────────────────────────────────────────────────

export const RELIABILITY_TIERS = {
  1: { label: 'Tier 1', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  2: { label: 'Tier 2', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
  3: { label: 'Tier 3', color: '#78716c', bg: 'rgba(120, 113, 108, 0.10)' },
};
