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

  // Accent — warm indigo-violet
  accent:         '#6366f1',
  accentEnd:      '#a78bfa',
  accentGlow:     'rgba(99, 102, 241, 0.3)',
  accentGradient: 'linear-gradient(135deg, #6366f1, #a78bfa)',

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
  glowAccent:     '0 0 20px rgba(99, 102, 241, 0.25)',
  glowBreaking:   '0 0 20px rgba(255, 65, 108, 0.35)',

  // Transitions — smooth cubic-bezier
  transition:     'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transitionFast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  transitionSlow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
};

// ── Globe Settings ──────────────────────────────────────────────────────────

export const GLOBE = {
  atmosphereColor:    '#6366f1',  // warm indigo/purple glow
  atmosphereAltitude: 0.35,       // bigger, softer glow envelope
  globeImageUrl:      '/img/earth-blue-marble.jpg',
  bumpImageUrl:       '/img/earth-topology.png',
  backgroundImageUrl: '/img/night-sky.png',
  pinBaseSize:        0.35,
  pinBreakingSize:    0.7,
  arcStroke:          0.2,        // thinner, more delicate arcs
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

  /* ── News-style animations ──────────────────────────────────────────────── */

  /* Breaking news banner flash — bold red flash across element */
  @keyframes news-flash {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .news-flash {
    background: linear-gradient(90deg, transparent 0%, rgba(255,65,108,0.15) 45%, rgba(255,75,43,0.25) 50%, rgba(255,65,108,0.15) 55%, transparent 100%);
    background-size: 200% 100%;
    animation: news-flash 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* Urgent badge pulse — attention-grabbing for BREAKING labels */
  @keyframes news-urgent {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.5); }
    50%      { box-shadow: 0 0 0 6px rgba(255, 65, 108, 0); }
  }
  .news-urgent {
    animation: news-urgent 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* Live dot heartbeat — steady pulse for live indicators */
  @keyframes news-heartbeat {
    0%, 100% { transform: scale(1); opacity: 1; }
    25%      { transform: scale(1.3); opacity: 0.8; }
    50%      { transform: scale(1); opacity: 1; }
    75%      { transform: scale(1.15); opacity: 0.9; }
  }
  .news-heartbeat {
    animation: news-heartbeat 2s ease-in-out infinite;
  }

  /* Card entrance — staggered slide-in for news cards */
  @keyframes news-card-in {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .news-card-in {
    animation: news-card-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  /* Headline typewriter shimmer — subtle scan effect on headlines */
  @keyframes news-shimmer {
    0%   { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
  .news-shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
    background-size: 50% 100%;
    animation: news-shimmer 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* Source count pop — bounce effect when source count updates */
  @keyframes news-count-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.25); }
    70%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  .news-count-pop {
    animation: news-count-pop 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  }

  /* Category ribbon slide — gradient sweep on category indicators */
  @keyframes news-ribbon {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .news-ribbon {
    background-size: 200% 200%;
    animation: news-ribbon 4s ease infinite;
  }

  /* Notification bell ring — for new story alerts */
  @keyframes news-ring {
    0%   { transform: rotate(0deg); }
    10%  { transform: rotate(14deg); }
    20%  { transform: rotate(-14deg); }
    30%  { transform: rotate(10deg); }
    40%  { transform: rotate(-10deg); }
    50%  { transform: rotate(0deg); }
    100% { transform: rotate(0deg); }
  }
  .news-ring {
    animation: news-ring 2s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top center;
  }

  /* Ambient breathe — gentle scale for background elements */
  @keyframes news-breathe {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50%      { transform: scale(1.02); opacity: 1; }
  }
  .news-breathe {
    animation: news-breathe 4s ease-in-out infinite;
  }

  /* Wire flash — simulates a news wire transmission burst */
  @keyframes news-wire {
    0%   { opacity: 0; transform: scaleX(0); transform-origin: left; }
    30%  { opacity: 1; transform: scaleX(1); }
    70%  { opacity: 1; transform: scaleX(1); }
    100% { opacity: 0; transform: scaleX(0); transform-origin: right; }
  }
  .news-wire {
    animation: news-wire 2.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Spotlight — draws attention to important elements */
  @keyframes news-spotlight {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124, 92, 252, 0), 0 0 0 0 rgba(0, 198, 255, 0); }
    50%      { box-shadow: 0 0 16px 4px rgba(124, 92, 252, 0.15), 0 0 30px 8px rgba(0, 198, 255, 0.08); }
  }
  .news-spotlight {
    animation: news-spotlight 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* Slide-in from right — for panel transitions */
  @keyframes news-slide-right {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .news-slide-right {
    animation: news-slide-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  /* Ticker highlight — brief glow when a new story enters the ticker */
  @keyframes news-ticker-highlight {
    0%   { color: #ff416c; text-shadow: 0 0 8px rgba(255, 65, 108, 0.5); }
    100% { color: #f5f0eb; text-shadow: none; }
  }
  .news-ticker-highlight {
    animation: news-ticker-highlight 2s ease-out;
  }

  /* ── Holographic / Comfy Futuristic Animations ───────────────────────────── */

  /* Holographic glow — soft pulsing aura for the comfy future feel */
  @keyframes holo-glow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.2), 0 0 30px rgba(124, 92, 252, 0.1), 0 0 60px rgba(99, 102, 241, 0.05);
    }
    50% {
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(124, 92, 252, 0.15), 0 0 80px rgba(99, 102, 241, 0.08);
    }
  }
  .holo-glow {
    animation: holo-glow 4s ease-in-out infinite;
  }

  /* Soft particle float — for micro-particle ambient effects */
  @keyframes particle-float {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
    50% { transform: translateY(-8px) scale(1.1); opacity: 1; }
  }
  .particle-float {
    animation: particle-float 5s ease-in-out infinite;
  }

  /* Warm pulse — gentle warm color breathing */
  @keyframes warm-pulse {
    0%, 100% { opacity: 0.7; filter: hue-rotate(0deg); }
    50% { opacity: 1; filter: hue-rotate(10deg); }
  }
  .warm-pulse {
    animation: warm-pulse 6s ease-in-out infinite;
  }

  /* Glass shimmer — subtle light sweep across glass elements */
  @keyframes glass-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .glass-shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 100%);
    background-size: 200% 100%;
    animation: glass-shimmer 8s ease-in-out infinite;
  }
`;

// ── Reliability tier badges ─────────────────────────────────────────────────

export const RELIABILITY_TIERS = {
  1: { label: 'Tier 1', color: '#ffab40', bg: 'rgba(255, 171, 64, 0.15)' },
  2: { label: 'Tier 2', color: '#a8a3b3', bg: 'rgba(168, 163, 179, 0.12)' },
  3: { label: 'Tier 3', color: '#6b6578', bg: 'rgba(107, 101, 120, 0.10)' },
};
