import React, { useMemo } from 'react';
import { NewsCluster } from '../../types';

interface StatsOverlayProps {
  clusters: NewsCluster[];
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({ clusters }) => {
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        left: 16,
        zIndex: 1050,
        background: 'rgba(18,18,24,0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 12,
        padding: '12px 16px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        maxWidth: 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>{row.icon}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.2,
                letterSpacing: '0.02em',
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#f5f0e8',
                lineHeight: 1.2,
              }}
            >
              {row.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverlay;
