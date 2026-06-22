import React from 'react';
import { Sun, Moon } from './icons';
import { useTheme } from './ThemeContext';

function ThemeToggle() {
  const T = useTheme();
  const isDark = T.isDark;
  const toggle = T.toggleTheme || (() => {});

  const style = {
    position: 'fixed',
    right: 16,
    top: 16,
    zIndex: 9999,
    width: 44,
    height: 44,
    borderRadius: 10,
    border: `1px solid ${T.border}`,
    background: T.card,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: T.shadow,
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={style}
    >
      {isDark ? <Sun size={18} color={T.primary} /> : <Moon size={18} color={T.primary} />}
    </button>
  );
}

export default ThemeToggle;
