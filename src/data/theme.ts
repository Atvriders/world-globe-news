import { NewsCategory } from '../types';

// ── Comfy Futuristic Design System ──────────────────────────────────────────
// Apple Vision Pro meets premium news — soft, warm, inviting, high-tech.

// ── Category Gradient Pairs ─────────────────────────────────────────────────

export const CATEGORY_GRADIENTS: Record<NewsCategory, [string, string]> = {
  world:         ['#5b8def', '#3b5998'],
  politics:      ['#9b59b6', '#6c3483'],
  business:      ['#f39c12', '#e67e22'],
  technology:    ['#00d2ff', '#7b2ff7'],
  sports:        ['#00e676', '#00b248'],
  health:        ['#ff6b9d', '#c44569'],
  science:       ['#26d0ce', '#1a2980'],
  entertainment: ['#ff9a56', '#ff6348'],
};

// ── Category Colors (primary color from each gradient for backward compat) ──

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  world:         '#5b8def',
  politics:      '#9b59b6',
  business:      '#f39c12',
  technology:    '#00d2ff',
  sports:        '#00e676',
  health:        '#ff6b9d',
  science:       '#26d0ce',
  entertainment: '#ff9a56',
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

// ── UI Colors ───────────────────────────────────────────────────────────────

export const UI = {
  // Backgrounds — warm charcoal, not cold navy
  bg:             '#121218',
  bgPanel:        'rgba(255, 255, 255, 0.05)',
  bgCard:         'rgba(255, 255, 255, 0.06)',
  bgCardHover:    'rgba(255, 255, 255, 0.10)',
  bgGlass:        'rgba(255, 255, 255, 0.06)',
  bgOverlay:      'rgba(18, 18, 24, 0.85)',

  // Borders — subtle frosted edges
  border:         'rgba(255, 255, 255, 0.08)',
  borderActive:   'rgba(124, 92, 252, 0.5)',
  borderGlass:    'rgba(255, 255, 255, 0.08)',

  // Text — warm white hierarchy
  text:           '#f5f0eb',
  textSecondary:  '#a8a3b3',
  textMuted:      '#6b6578',

  // Accent — soft purple-blue
  accent:         '#7c5cfc',
  accentEnd:      '#00c6ff',
  accentGlow:     'rgba(124, 92, 252, 0.3)',
  accentGradient: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',

  // Breaking — animated warm red gradient
  breaking:       '#ff416c',
  breakingEnd:    '#ff4b2b',
  breakingGlow:   'rgba(255, 65, 108, 0.4)',
  breakingGradient: 'linear-gradient(90deg, #ff416c, #ff4b2b)',

  // Status
  success:        '#00e676',
  warning:        '#ffab40',
  error:          '#ff5252',

  // Glassmorphism tokens
  blur:           '20px',
  borderRadius:   '16px',
  borderRadiusSm: '10px',
  borderRadiusLg: '24px',

  // Spacing scale (generous, comfy)
  spacingXs:      '4px',
  spacingSm:      '8px',
  spacingMd:      '16px',
  spacingLg:      '24px',
  spacingXl:      '32px',
  spacing2xl:     '48px',

  // Shadows & glows
  shadowSm:       '0 2px 8px rgba(0, 0, 0, 0.3)',
  shadowMd:       '0 4px 16px rgba(0, 0, 0, 0.4)',
  shadowLg:       '0 8px 32px rgba(0, 0, 0, 0.5)',
  glowAccent:     '0 0 20px rgba(124, 92, 252, 0.25)',
  glowBreaking:   '0 0 20px rgba(255, 65, 108, 0.35)',

  // Transitions — smooth cubic-bezier
  transition:     'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transitionFast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  transitionSlow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
};

// ── Globe Settings ──────────────────────────────────────────────────────────

export const GLOBE = {
  atmosphereColor:    '#7c5cfc',
  atmosphereAltitude: 0.3,
  globeImageUrl:      '/img/earth-day.jpg',
  bumpImageUrl:       '/img/earth-topology.png',
  backgroundImageUrl: '/img/night-sky.png',
  pinBaseSize:        0.35,
  pinBreakingSize:    0.6,
  arcStroke:          0.3,
};

// ── Time filter labels ──────────────────────────────────────────────────────

export const TIME_FILTER_LABELS: Record<string, string> = {
  '1h':  'Last Hour',
  '6h':  'Last 6 Hours',
  '24h': 'Last 24 Hours',
  '7d':  'Last 7 Days',
};

// ── Breaking news threshold ─────────────────────────────────────────────────

export const BREAKING_SOURCE_THRESHOLD = 3; // 3+ sources = breaking

// ── CSS Animations & Utilities ──────────────────────────────────────────────

export const GLOBAL_CSS = `
  /* ── Glassmorphism utility ─────────────────────────────────────────────── */
  .glass {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
  }

  /* ── Scrollbar — thin, rounded, translucent ────────────────────────────── */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.22);
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
  }

  /* ── Breaking news gradient animation ──────────────────────────────────── */
  @keyframes breaking-gradient {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes breaking-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.85; transform: scale(1.03); }
  }
  .breaking-pulse {
    animation: breaking-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .breaking-gradient {
    background: linear-gradient(90deg, #ff416c, #ff4b2b, #ff416c);
    background-size: 200% 200%;
    animation: breaking-gradient 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* ── Pin pulse animation ───────────────────────────────────────────────── */
  @keyframes pin-pulse {
    0%   { box-shadow: 0 0 0 0 var(--glow-color, rgba(124, 92, 252, 0.6)); }
    70%  { box-shadow: 0 0 0 10px var(--glow-color, rgba(124, 92, 252, 0)); }
    100% { box-shadow: 0 0 0 0 var(--glow-color, rgba(124, 92, 252, 0)); }
  }
  @keyframes pin-glow {
    0%, 100% { box-shadow: 0 0 4px var(--glow-color, rgba(124, 92, 252, 0.5)); }
    50%      { box-shadow: 0 0 14px var(--glow-color, rgba(124, 92, 252, 0.8)); }
  }
  .pin-pulse {
    animation: pin-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* ── Fade-in animation ─────────────────────────────────────────────────── */
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in {
    animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* ── Slide-up animation ────────────────────────────────────────────────── */
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .slide-up {
    animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* ── Glow animation for accents ────────────────────────────────────────── */
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 8px rgba(124, 92, 252, 0.3); }
    50%      { box-shadow: 0 0 24px rgba(124, 92, 252, 0.6); }
  }
  @keyframes glow-text {
    0%, 100% { text-shadow: 0 0 6px rgba(124, 92, 252, 0.3); }
    50%      { text-shadow: 0 0 16px rgba(124, 92, 252, 0.6); }
  }
  .glow {
    animation: glow 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .glow-text {
    animation: glow-text 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* ── Ticker scroll ─────────────────────────────────────────────────────── */
  @keyframes ticker-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ── Spin ──────────────────────────────────────────────────────────────── */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

// ── Reliability tier badges ─────────────────────────────────────────────────

export const RELIABILITY_TIERS = {
  1: { label: 'Tier 1', color: '#ffab40', bg: 'rgba(255, 171, 64, 0.15)' },
  2: { label: 'Tier 2', color: '#a8a3b3', bg: 'rgba(168, 163, 179, 0.12)' },
  3: { label: 'Tier 3', color: '#6b6578', bg: 'rgba(107, 101, 120, 0.10)' },
};
