import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { NewsCluster } from '../../types';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
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

  // Animate in when cluster changes
  useEffect(() => {
    if (cluster) {
      // Small delay so the browser paints at translateX(100%) first
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [cluster]);

  if (!cluster) return null;

  const catColor = CATEGORY_COLORS[cluster.category];
  const catLabel = CATEGORY_LABELS[cluster.category];
  const catIcon = CATEGORY_ICONS[cluster.category];
  const locationText = [cluster.location.city, cluster.location.country]
    .filter(Boolean)
    .join(', ');

  // Sort articles: approximate reliability sort (wire/broadcast first), then recency
  const sortedArticles = [...cluster.articles].sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // ── Styles ──────────────────────────────────────────────────────────────

  const panel: React.CSSProperties = {
    position: 'fixed',
    top: 48,
    right: 0,
    width: 400,
    height: 'calc(100vh - 84px)',
    zIndex: 1200,
    background: 'rgba(10, 15, 26, 0.97)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    transform: visible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const header: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: `1px solid ${UI.border}`,
    flexShrink: 0,
  };

  const badgeRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  };

  const categoryBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
    color: catColor,
    background: `${catColor}20`,
    border: `1px solid ${catColor}40`,
    textTransform: 'uppercase',
  };

  const breakingBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: '#fff',
    background: UI.breaking,
    animation: 'breaking-pulse 1.5s ease-in-out infinite',
    textTransform: 'uppercase',
  };

  const closeBtn: React.CSSProperties = {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: UI.textSecondary,
    fontSize: 22,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    transition: 'color 0.15s',
  };

  const headline: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.35,
    marginBottom: 10,
  };

  const metaRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    fontSize: 12,
    color: UI.textSecondary,
  };

  const scrollBody: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: UI.textMuted,
    marginBottom: 10,
  };

  const summaryText: React.CSSProperties = {
    fontSize: 13,
    lineHeight: 1.65,
    color: UI.text,
    marginBottom: 24,
  };

  const sourceCard = (id: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    background: hoveredSource === id ? UI.bgCardHover : UI.bgCard,
    marginBottom: 6,
    transition: 'background 0.15s',
    cursor: 'pointer',
    textDecoration: 'none',
  });

  const dotStyle = (color: string): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 4,
  });

  const footer: React.CSSProperties = {
    padding: '12px 20px 16px',
    borderTop: `1px solid ${UI.border}`,
    flexShrink: 0,
  };

  const flyBtn: React.CSSProperties = {
    width: '100%',
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    background: flyHover ? UI.accent : `${UI.accent}cc`,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.15s, transform 0.15s',
    transform: flyHover ? 'scale(1.02)' : 'scale(1)',
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={panel}>
      {/* Header */}
      <div style={header}>
        <div style={badgeRow}>
          <span style={categoryBadge}>
            {catIcon} {catLabel}
          </span>
          {cluster.isBreaking && <span style={breakingBadge}>BREAKING</span>}
          <button
            style={closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = UI.textSecondary)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div style={headline}>{cluster.title}</div>

        <div style={metaRow}>
          {locationText && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span role="img" aria-label="location">
                📍
              </span>
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
          <>
            <div style={sectionTitle}>Summary</div>
            <div style={summaryText}>{cluster.summary}</div>
          </>
        )}

        {/* Sources */}
        <div style={sectionTitle}>
          Covered by {cluster.articles.length} source
          {cluster.articles.length !== 1 ? 's' : ''}
        </div>

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
                    fontWeight: 600,
                    color: '#fff',
                    marginBottom: 2,
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
                    color: UI.textSecondary,
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
                    color: UI.textMuted,
                    marginTop: 3,
                  }}
                >
                  {relativeTime(article.publishedAt)}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: UI.accent,
                  fontWeight: 500,
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

      {/* Footer: Fly to Location */}
      <div style={footer}>
        <button
          style={flyBtn}
          onClick={() => onFlyTo(cluster.location.lat, cluster.location.lng)}
          onMouseEnter={() => setFlyHover(true)}
          onMouseLeave={() => setFlyHover(false)}
        >
          <span role="img" aria-label="globe">
            🌐
          </span>
          Fly to Location
        </button>
      </div>
    </div>
  );
};

export default NewsDetail;
