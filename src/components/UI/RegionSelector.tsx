import React, { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

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
  from { opacity: 0; transform: translateX(-50%) translateY(4px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
`;

const RegionSelector: React.FC<RegionSelectorProps> = ({ onFlyTo }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const handleClick = (region: Region, index: number) => {
    setActiveIndex(index);
    onFlyTo(region.lat, region.lng);
  };

  return (
    <>
      <style>{fadeInKeyframes}</style>
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? 44 : 48,
          left: 16,
          zIndex: 1100,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '4px 6px',
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
        }}
      >
        {regions.map((region, index) => {
          const isHovered = hoveredIndex === index;
          const isActive = activeIndex === index;
          return (
            <div
              key={region.name}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <button
                onClick={() => handleClick(region, index)}
                aria-label={region.name}
                style={{
                  width: isMobile ? 28 : 32,
                  height: isMobile ? 28 : 32,
                  borderRadius: '50%',
                  background: isHovered
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.06)',
                  border: isActive
                    ? '1.5px solid rgba(124, 92, 252, 0.6)'
                    : isHovered
                      ? '1px solid rgba(124, 92, 252, 0.4)'
                      : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isHovered
                    ? '0 0 10px rgba(124, 92, 252, 0.3), 0 0 4px rgba(124, 92, 252, 0.15)'
                    : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  padding: 0,
                  lineHeight: 1,
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
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
                    bottom: 38,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(20, 16, 28, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    color: 'rgba(255, 247, 237, 0.92)',
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    animation: 'regionTooltipFadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
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

export default React.memo(RegionSelector);
