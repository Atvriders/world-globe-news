import React, { useState } from 'react';

interface RegionSelectorProps {
  onFlyTo: (lat: number, lng: number) => void;
}

interface Region {
  emoji: string;
  name: string;
  lat: number;
  lng: number;
}

const regions: Region[] = [
  { emoji: '🌍', name: 'Africa', lat: 0, lng: 20 },
  { emoji: '🌎', name: 'Americas', lat: 15, lng: -80 },
  { emoji: '🌏', name: 'Asia', lat: 35, lng: 100 },
  { emoji: '🇪🇺', name: 'Europe', lat: 50, lng: 15 },
  { emoji: '🏝️', name: 'Oceania', lat: -25, lng: 135 },
  { emoji: '🕌', name: 'Middle East', lat: 28, lng: 45 },
];

const fadeInKeyframes = `
@keyframes regionTooltipFadeIn {
  from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
  to { opacity: 1; transform: translateY(-50%) translateX(0); }
}
`;

const RegionSelector: React.FC<RegionSelectorProps> = ({ onFlyTo }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      <style>{fadeInKeyframes}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 52,
          left: 20,
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {regions.map((region, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={region.name}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <button
                onClick={() => onFlyTo(region.lat, region.lng)}
                aria-label={region.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isHovered
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: isHovered
                    ? '1px solid rgba(124, 92, 252, 0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isHovered
                    ? '0 4px 16px rgba(0,0,0,0.3), 0 0 12px rgba(124, 92, 252, 0.2)'
                    : '0 4px 16px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  padding: 0,
                  lineHeight: 1,
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                }}
              >
                {region.emoji}
              </button>

              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: 44,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '4px 12px',
                    color: 'rgba(255, 247, 237, 0.92)',
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    animation: 'regionTooltipFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  }}
                >
                  {region.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RegionSelector;
