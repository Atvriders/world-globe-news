import React, { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (q: string) => void;
  onSearch: (q: string) => void;
}

const TRANSITION = '0.3s cubic-bezier(0.4, 0, 0.2, 1)';

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch }) => {
  const [focused, setFocused] = useState(false);
  const [clearHovered, setClearHovered] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      onChange(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(q);
      }, 300);
    },
    [onChange, onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onSearch(value);
      }
    },
    [onSearch, value]
  );

  const handleClear = useCallback(() => {
    onChange('');
    onSearch('');
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: 58,
    right: 16,
    zIndex: 1100,
    width: 300,
    height: 42,
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 21,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: focused
      ? '0 0 0 2px rgba(124, 92, 252, 0.3), 0 8px 32px rgba(124, 92, 252, 0.15)'
      : '0 8px 32px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    boxSizing: 'border-box',
    transition: `box-shadow ${TRANSITION}, border-color ${TRANSITION}`,
  };

  const iconStyle: CSSProperties = {
    fontSize: 15,
    opacity: 0.4,
    marginRight: 10,
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
    transition: `opacity ${TRANSITION}`,
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f5f0eb',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    padding: 0,
    margin: 0,
    height: '100%',
    letterSpacing: '0.01em',
  };

  const clearStyle: CSSProperties = {
    background: clearHovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.06)',
    border: 'none',
    color: clearHovered ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    marginLeft: 8,
    transition: `background ${TRANSITION}, color ${TRANSITION}, box-shadow ${TRANSITION}`,
    boxShadow: clearHovered ? '0 0 8px rgba(124, 92, 252, 0.4)' : 'none',
    animation: 'searchClearFadeIn 0.3s ease forwards',
  };

  return (
    <>
      <style>{`
        @keyframes searchClearFadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        .search-bar-input::placeholder {
          color: rgba(245, 240, 235, 0.3) !important;
        }
      `}</style>
      <div style={containerStyle}>
        <span style={iconStyle} role="img" aria-label="search">
          🔍
        </span>
        <input
          ref={inputRef}
          className="search-bar-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search the globe..."
          style={inputStyle}
        />
        {value.length > 0 && (
          <button
            style={clearStyle}
            onClick={handleClear}
            onMouseEnter={() => setClearHovered(true)}
            onMouseLeave={() => setClearHovered(false)}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </>
  );
};

export default SearchBar;
