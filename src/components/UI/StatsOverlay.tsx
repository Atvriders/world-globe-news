import React, { useMemo, CSSProperties } from 'react';
import { NewsCluster } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

interface StatsOverlayProps {
  clusters: NewsCluster[];
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({ clusters }) => {
  const isMobile = useIsMobile();

  const stats = useMemo(() => {
    const total = clusters.length;
    const breaking = clusters.filter((c) => c.isBreaking).length;

    const sourceSet = new Set<string>();
    const countrySet = new Set<string>();

    for (const cluster of clusters) {
      if (cluster.location?.country) {
        countrySet.add(cluster.location.country);
      }
      for (const article of cluster.articles) {
        if (article.source?.name) {
          sourceSet.add(article.source.name);
        }
        if (article.country) {
          countrySet.add(article.country);
        }
      }
    }

    return {
      total,
      breaking,
      sources: sourceSet.size,
      countries: countrySet.size,
    };
  }, [clusters]);

  const rows = [
    { icon: '\u{1F4F0}', label: 'Stories', value: stats.total },
    { icon: '\u{1F534}', label: 'Breaking', value: stats.breaking },
    { icon: '\u{1F4E1}', label: 'Sources', value: stats.sources },
    { icon: '\u{1F30D}', label: 'Countries', value: stats.countries },
  ];

  if (isMobile) return null;

  return (
    <div style={containerStyle}>
      {rows.map((row) => (
        <div key={row.label} style={rowStyle}>
          <span style={iconStyle}>{row.icon}</span>
          <div style={colStyle}>
            <span style={labelStyle}>{row.label}</span>
            <span style={valueStyle}>{row.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(StatsOverlay);

// ── Module-level styles ─────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 60,
  left: 16,
  zIndex: 1050,
  background: 'rgba(18,18,24,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 12,
  padding: '12px 16px',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  maxWidth: 140,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'none',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const iconStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1,
};

const colStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.45)',
  lineHeight: 1.2,
  letterSpacing: '0.02em',
};

const valueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#f5f0e8',
  lineHeight: 1.2,
};
