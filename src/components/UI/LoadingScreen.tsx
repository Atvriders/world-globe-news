import React, { useState, useEffect, useRef } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsFadingOut(false);
    } else {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#0c0c14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <style>{`
        @keyframes ls-border-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ls-bar-fill {
          0% { width: 0%; }
          100% { width: 80%; }
        }
        @keyframes ls-bar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Animated globe with gradient border */}
      <div
        style={{
          position: 'relative',
          width: '64px',
          height: '64px',
        }}
      >
        {/* Spinning gradient border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #6366f1, #a78bfa, #6366f1)',
            animation: 'ls-border-spin 3s linear infinite',
            willChange: 'transform',
          }}
        />
        {/* Inner circle cutout */}
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: '3px',
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: '#0c0c14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '32px', lineHeight: 1 }}>🌍</span>
        </div>
      </div>

      {/* Title with gradient text */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '3px',
          background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        WORLD GLOBE NEWS
      </div>

      {/* Subtitle */}
      <div
        style={{
          color: '#6b6578',
          fontSize: '13px',
          fontWeight: 400,
          marginTop: '-12px',
        }}
      >
        Connecting you to the world...
      </div>

      {/* Loading bar */}
      <div
        style={{
          width: '200px',
          height: '3px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '3px',
            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
            animation: 'ls-bar-fill 2s ease forwards, ls-bar-pulse 1.5s ease-in-out 2s infinite',
          }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
