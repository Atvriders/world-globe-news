import React, { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (q: string) => void;
  onSearch: (q: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch }) => {
  const [focused, setFocused] = useState(false);
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
    top: 56,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1100,
    width: 320,
    height: 36,
    background: 'rgba(10, 15, 26, 0.9)',
    border: focused ? '1px solid rgba(66, 133, 244, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const iconStyle: CSSProperties = {
    fontSize: 14,
    opacity: 0.4,
    marginRight: 8,
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    padding: 0,
    margin: 0,
    height: '100%',
  };

  const clearStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    cursor: 'pointer',
    padding: '0 0 0 8px',
    lineHeight: 1,
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle}>
      <span style={iconStyle} role="img" aria-label="search">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search news..."
        style={inputStyle}
      />
      {value.length > 0 && (
        <button style={clearStyle} onClick={handleClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
