import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { NewsCluster } from '../../types';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_GRADIENTS,
  UI,
} from '../../data/theme';

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

// ── Component ───────────────────────────────────────────────────────────────

const NewsDetail: React.FC<NewsDetailProps> = ({ cluster, onClose, onFlyTo }) => {
  const [visible, setVisible] = useState(false);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);
  const [flyHover, setFlyHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);

  // Animate in when cluster changes
  useEffect(() => {
    if (cluster) {
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

  const sortedArticles = [...cluster.articles].sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // ── Styles ──────────────────────────────────────────────────────────────

  const panel: React.CSSProperties = {
    position: 'fixed',
    top: 56,
    right: 0,
    width: 420,
    height: 'calc(100vh - 92px)',
    zIndex: 1200,
    background: 'rgba(18, 18, 24, 0.9)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
    transform: visible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const header: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  };

  const badgeRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
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
    animation: 'breaking-gradient 3s ease infinite',
    textTransform: 'uppercase',
  };

  const closeBtnStyle: React.CSSProperties = {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: closeHover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: closeHover ? '#fff' : '#a8a3b3',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: closeHover ? '0 0 12px rgba(124,92,252,0.3)' : 'none',
    padding: 0,
    lineHeight: 1,
  };

  const headline: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: '#f5f0eb',
    lineHeight: 1.4,
    marginBottom: 12,
  };

  const metaRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    fontSize: 12,
    color: '#a8a3b3',
  };

  const scrollBody: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  };

  const sourcesHeader: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  };

  const summaryText: React.CSSProperties = {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#a8a3b3',
  };

  const sourceCard = (id: string): React.CSSProperties => {
    const isHovered = hoveredSource === id;
    return {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      background: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      textDecoration: 'none',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    };
  };

  const dotStyle = (color: string): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 5,
  });

  const footer: React.CSSProperties = {
    padding: '16px 24px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  };

  const flyBtn: React.CSSProperties = {
    width: '100%',
    height: 44,
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
    transition: 'all 0.2s ease',
    transform: flyHover ? 'scale(1.02)' : 'scale(1)',
    boxShadow: flyHover
      ? '0 4px 20px rgba(124, 92, 252, 0.4), 0 0 30px rgba(0, 198, 255, 0.2)'
      : '0 2px 8px rgba(0,0,0,0.3)',
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={panel}>
      {/* Header */}
      <div style={header}>
        <div style={badgeRow}>
          <span style={categoryPill}>
            {catIcon} {catLabel}
          </span>
          {cluster.isBreaking && <span style={breakingBadge}>BREAKING</span>}
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div style={headline}>{cluster.title}</div>

        <div style={metaRow}>
          {locationText && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span role="img" aria-label="location">📍</span>
              {locationText}
            </span>
          )}
          <span>{relativeTime(cluster.lastUpdated)}</span>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={scrollBody}>
        {/* Summary */}
        {cluster.summary && (
          <div>
            <div style={{ ...sourcesHeader, color: '#6b6578', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
              Summary
            </div>
            <div style={summaryText}>{cluster.summary}</div>
          </div>
        )}

        {/* Sources */}
        <div>
          <div style={{ ...sourcesHeader, marginBottom: 12 }}>
            <span style={{ color: '#6b6578', textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
              Covered by{' '}
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #7c5cfc, #00c6ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {cluster.articles.length} source{cluster.articles.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedArticles.map((article) => {
              const color = sourceColor(article.source.name);
              return (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={sourceCard(article.id)}
                  onMouseEnter={() => setHoveredSource(article.id)}
                  onMouseLeave={() => setHoveredSource(null)}
                >
                  <div style={dotStyle(color)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#f5f0eb',
                        marginBottom: 3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {article.source.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#a8a3b3',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {article.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b6578',
                        marginTop: 4,
                      }}
                    >
                      {relativeTime(article.publishedAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#7c5cfc',
                      fontWeight: 600,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ↗
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: Fly to Location */}
      <div style={footer}>
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
