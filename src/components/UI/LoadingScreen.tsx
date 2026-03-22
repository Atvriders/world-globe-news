import React, { useState, useEffect, useRef } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  const [dots, setDots] = useState('');
  const [shouldRender, setShouldRender] = useState(isVisible);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Animate dots cycling: "", ".", "..", "..."
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Keep rendered while fading out, then remove from DOM
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // matches fade-out transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#0a0f1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <style>{`
        @keyframes loading-screen-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          fontSize: '64px',
          lineHeight: 1,
          animation: 'loading-screen-spin 2s linear infinite',
          marginBottom: '24px',
        }}
      >
        🌍
      </div>

      <div
        style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          marginBottom: '12px',
        }}
      >
        WORLD GLOBE NEWS
      </div>

      <div
        style={{
          color: '#6b7280',
          fontSize: '12px',
        }}
      >
        Loading latest news{dots}
      </div>
    </div>
  );
};

export default LoadingScreen;
