import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { NewsCluster } from '../../types';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_GRADIENTS,
} from '../../data/theme';
import { getSourceByName, BIAS_COLORS, BIAS_LABELS } from '../../data/newsSources';

// ── Props ───────────────────────────────────────────────────────────────────

interface NewsDetailProps {
  cluster: NewsCluster | null;
  onClose: () => void;
  onFlyTo: (lat: number, lng: number) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

/** Deterministic brand color derived from source name */
function sourceColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

// ── Keyframe injection (once) ───────────────────────────────────────────────

const STYLE_ID = 'news-detail-keyframes';
function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes nd-breaking-gradient {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes nd-card-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ── Component ───────────────────────────────────────────────────────────────

const NewsDetail: React.FC<NewsDetailProps> = ({ cluster, onClose, onFlyTo }) => {
  const [visible, setVisible] = useState(false);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [flyHover, setFlyHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryHover, setSummaryHover] = useState(false);

  useEffect(() => ensureKeyframes(), []);

  // Animate in when cluster changes; reset summary
  useEffect(() => {
    if (cluster) {
      setSummaryOpen(false);
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [cluster]);

  if (!cluster) return null;

  const catLabel = CATEGORY_LABELS[cluster.category];
  const catIcon = CATEGORY_ICONS[cluster.category];
  const gradient = CATEGORY_GRADIENTS[cluster.category];
  const locationText = [cluster.location.city, cluster.location.country]
    .filter(Boolean)
    .join(', ');

  const sortedArticles = useMemo(
    () =>
      [...cluster.articles].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    [cluster.articles],
  );

  // ── Styles ──────────────────────────────────────────────────────────────

  const panel: React.CSSProperties = {
    position: 'fixed',
    top: 56,
    right: 0,
    width: 420,
    height: 'calc(100vh - 56px)',
    zIndex: 1200,
    background: 'rgba(14, 14, 20, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.55)',
    transform: visible ? 'translateX(0)' : 'translateX(100%)',
    willChange: 'transform',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.15, 1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  // ── Header ──────────────────────────────────────────────────────────────

  const headerStyle: React.CSSProperties = {
    padding: 20,
    flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const backBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: backHover ? '#ddd' : '#8a8494',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 0',
    marginBottom: 14,
    transition: 'color 0.2s ease',
    fontFamily: 'inherit',
  };

  const categoryPill: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: '#fff',
    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    textTransform: 'uppercase',
  };

  const breakingBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: '#fff',
    background: 'linear-gradient(90deg, #ff416c, #ff4b2b, #ff416c)',
    backgroundSize: '200% 200%',
    animation: 'nd-breaking-gradient 3s ease infinite',
    textTransform: 'uppercase',
  };

  // ── Hero ────────────────────────────────────────────────────────────────

  const headline: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: '#f5f0eb',
    lineHeight: 1.5,
    marginTop: 14,
    marginBottom: 10,
  };

  const metaRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    fontSize: 12,
    color: '#7a7585',
    marginBottom: 12,
  };

  const sourceCountBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color: '#c8c3d0',
    background: 'rgba(124, 92, 252, 0.08)',
    border: '1px solid rgba(124, 92, 252, 0.15)',
    boxShadow: '0 0 12px rgba(124, 92, 252, 0.06)',
  };

  // ── Scroll body ─────────────────────────────────────────────────────────

  const scrollBody: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  // ── Source cards ─────────────────────────────────────────────────────────

  const sectionHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: '#9b96a5',
    textTransform: 'uppercase',
    letterSpacing: 1,
  };

  const sectionCount: React.CSSProperties = {
    fontSize: 11,
    color: '#5e5969',
    fontWeight: 500,
  };

  const sourceCard = (id: string, index: number): React.CSSProperties => {
    const isHovered = hoveredSource === id;
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: 12,
      borderRadius: 10,
      background: isHovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
      border: '1px solid',
      borderColor: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      textDecoration: 'none',
      animation: `nd-card-in 0.3s ease ${index * 50}ms both`,
    };
  };

  const cardTopRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const dotStyle = (color: string): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    boxShadow: `0 0 6px ${color}44`,
  });

  const sourceNameStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: '#e8e4f0',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const timeStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#5e5969',
    flexShrink: 0,
    fontWeight: 500,
  };

  const articleTitleStyle = (id: string): React.CSSProperties => ({
    fontSize: 12,
    lineHeight: 1.5,
    color: hoveredSource === id ? '#7c9cfc' : '#8aafff',
    textDecoration: hoveredSource === id ? 'underline' : 'none',
    textDecorationColor: 'rgba(138, 175, 255, 0.4)',
    transition: 'color 0.2s ease',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  });

  const externalIcon = (id: string): React.CSSProperties => ({
    fontSize: 11,
    color: '#7c5cfc',
    opacity: hoveredSource === id ? 1 : 0,
    transition: 'opacity 0.2s ease',
    flexShrink: 0,
    marginLeft: 'auto',
    alignSelf: 'flex-start',
    marginTop: 2,
  });

  // ── Summary toggle ──────────────────────────────────────────────────────

  const summaryToggle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    color: summaryHover ? '#c8c3d0' : '#7a7585',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 14px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    width: '100%',
    justifyContent: 'center',
    background: summaryHover
      ? 'rgba(255,255,255,0.04)'
      : 'rgba(255,255,255,0.02)',
  } as React.CSSProperties;

  const summaryContent: React.CSSProperties = {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#908b9b',
    padding: '10px 0 4px',
  };

  // ── Action bar ──────────────────────────────────────────────────────────

  const actionBar: React.CSSProperties = {
    padding: '14px 20px 20px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  };

  const flyBtn: React.CSSProperties = {
    width: '100%',
    height: 42,
    borderRadius: 12,
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.25s ease',
    transform: flyHover ? 'scale(1.02)' : 'scale(1)',
    boxShadow: flyHover
      ? '0 4px 24px rgba(124, 92, 252, 0.45), 0 0 40px rgba(0, 198, 255, 0.2)'
      : '0 2px 10px rgba(0,0,0,0.3)',
    fontFamily: 'inherit',
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={panel}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={headerStyle}>
        {/* Back button */}
        <button
          style={backBtn}
          onClick={onClose}
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>&larr;</span>
          Back
        </button>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={categoryPill}>
            {catIcon} {catLabel}
          </span>
          {cluster.isBreaking && (
            <span style={breakingBadge}>
              <span style={{ fontSize: 10 }}>&#9679;</span> BREAKING
            </span>
          )}
        </div>

        {/* Headline */}
        <div style={headline}>{cluster.title}</div>

        {/* Meta row */}
        <div style={metaRow}>
          {locationText && (
            <>
              <span role="img" aria-label="location">📍</span>
              <span>{locationText}</span>
            </>
          )}
          {locationText && <span style={{ margin: '0 2px' }}>&middot;</span>}
          <span role="img" aria-label="time">🕐</span>
          <span>{relativeTime(cluster.lastUpdated)}</span>
        </div>

        {/* Source count badge */}
        <div style={sourceCountBadge}>
          Covered by&nbsp;
          <span
            style={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {cluster.articles.length}
          </span>
          &nbsp;source{cluster.articles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Scroll area ────────────────────────────────────────────── */}
      <div style={scrollBody}>
        {/* Source cards section */}
        <div>
          <div style={sectionHeader}>
            <span style={sectionTitle}>Sources</span>
            <span style={sectionCount}>{sortedArticles.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedArticles.map((article, index) => {
              const color = sourceColor(article.source.name);
              const isExpanded = expandedArticle === article.id;
              return (
                <div
                  key={article.id}
                  style={sourceCard(article.id, index)}
                  onMouseEnter={() => setHoveredSource(article.id)}
                  onMouseLeave={() => setHoveredSource(null)}
                  onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                >
                  {/* Top row: dot + name + bias pill + time */}
                  <div style={cardTopRow}>
                    <div style={dotStyle(color)} />
                    <span style={sourceNameStyle}>{article.source.name}</span>
                    {(() => {
                      const src = getSourceByName(article.source.name);
                      if (!src) return null;
                      const biasColor = BIAS_COLORS[src.bias];
                      return (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 6,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            background: `${biasColor}26`,
                            color: biasColor,
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {BIAS_LABELS[src.bias]}
                        </span>
                      );
                    })()}
                    <span style={timeStyle}>{relativeTime(article.publishedAt)}</span>
                    <span style={{ fontSize: 10, color: '#6b6578', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>&#9654;</span>
                  </div>
                  {/* Article title */}
                  <div style={articleTitleStyle(article.id)}>{article.title}</div>
                  {/* Expanded: summary + open source button */}
                  {isExpanded && (
                    <div style={{ marginTop: 8, animation: 'fade-in 0.3s ease forwards' }}>
                      {article.description && (
                        <div style={{ fontSize: 12, lineHeight: 1.55, color: '#a8a3b3', marginBottom: 10 }}>
                          {article.description}
                        </div>
                      )}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          background: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 8,
                          textDecoration: 'none',
                          letterSpacing: '0.04em',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(124, 92, 252, 0.3)',
                        }}
                      >
                        Open Source &#8599;
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary section (collapsible) */}
        {cluster.summary && (
          <div style={{ marginTop: 8 }}>
            <button
              style={summaryToggle}
              onClick={() => setSummaryOpen((prev) => !prev)}
              onMouseEnter={() => setSummaryHover(true)}
              onMouseLeave={() => setSummaryHover(false)}
            >
              <span
                style={{
                  display: 'inline-block',
                  transition: 'transform 0.2s ease',
                  transform: summaryOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  fontSize: 10,
                }}
              >
                &#9654;
              </span>
              {summaryOpen ? 'Hide summary' : 'Show summary'}
            </button>
            {summaryOpen && (
              <div style={summaryContent}>{cluster.summary}</div>
            )}
          </div>
        )}
      </div>

      {/* ── Action bar (sticky bottom) ─────────────────────────────── */}
      <div style={actionBar}>
        <button
          style={flyBtn}
          onClick={() => onFlyTo(cluster.location.lat, cluster.location.lng)}
          onMouseEnter={() => setFlyHover(true)}
          onMouseLeave={() => setFlyHover(false)}
        >
          <span role="img" aria-label="globe">🌍</span>
          Fly to Location
        </button>
      </div>
    </div>
  );
};

export default NewsDetail;
