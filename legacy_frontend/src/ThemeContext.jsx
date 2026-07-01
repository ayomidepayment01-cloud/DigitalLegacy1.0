import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch (e) { /* ignore */ }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    // 1. Listen for System Theme changes (only if user hasn't set a preference)
    const themeMatcher = window.matchMedia('(prefers-color-scheme: dark)');
    const onThemeChange = (e) => {
      try {
        const saved = localStorage.getItem('theme');
        if (!saved) setIsDark(e.matches);
      } catch (err) { /* ignore */ }
    };
    themeMatcher.addEventListener('change', onThemeChange);

    // 2. Listen for Window Resize
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);

    return () => {
      themeMatcher.removeEventListener('change', onThemeChange);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Persist preference and sync body style via CSS classes
  useEffect(() => {
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
    
    // Toggle the .dark class on the body. index.css handles all color logic via variables.
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);
  const setTheme = (val) => setIsDark(Boolean(val));

  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;

  // We map the T object to CSS variables.
  // This allows inline styles like `background: T.bg` to resolve to `var(--bg)`.
  const T = {
    isDark,
    isMobile,
    isTablet,
    width,
    bg: 'var(--bg)',
    card: 'var(--card)',
    text: 'var(--text)',
    subText: 'var(--sub-text)',
    border: 'var(--border)',
    primary: 'var(--primary)',
    danger: 'var(--danger)',
    nav: 'var(--nav)',
    shadow: 'var(--shadow-premium)',
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={T}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      bg: 'var(--bg)',
      text: 'var(--text)',
      primary: 'var(--primary)',
      isMobile: false,
      width: 1200,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};