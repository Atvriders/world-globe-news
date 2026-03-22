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

const RegionSelector: React.FC<RegionSelectorProps> = ({ onFlyTo }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 48,
        left: 16,
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {regions.map((region, index) => (
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
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(10,15,26,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              padding: 0,
              lineHeight: 1,
              transition: 'background 0.2s, border-color 0.2s',
              ...(hoveredIndex === index
                ? {
                    background: 'rgba(30,40,60,0.95)',
                    borderColor: 'rgba(255,255,255,0.25)',
                  }
                : {}),
            }}
          >
            {region.emoji}
          </button>

          {hoveredIndex === index && (
            <div
              style={{
                position: 'absolute',
                left: 38,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(10,15,26,0.95)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#e0e0e0',
                fontSize: 12,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {region.name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RegionSelector;
