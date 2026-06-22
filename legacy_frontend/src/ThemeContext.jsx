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

  // Persist preference and sync body style
  useEffect(() => {
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
    const backgroundColor = isDark ? '#060813' : '#f4f6fb';
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.color = isDark ? '#f1f5f9' : '#0f172a';
    document.body.style.transition = 'background-color 0.4s ease';
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);
  const setTheme = (val) => setIsDark(Boolean(val));

  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;

  const T = {
    isDark,
    isMobile,
    isTablet,
    width,
    bg: isDark ? '#060813' : '#f4f6fb',
    card: isDark ? '#0f1322' : '#ffffff',
    text: isDark ? '#f1f5f9' : '#0f172a',
    subText: isDark ? '#8a9ab5' : '#5c6984',
    border: isDark ? '#1b233a' : '#e2e8f0',
    primary: '#2563eb', // THE BLUE ACCENT
    danger: '#ef4444',
    nav: isDark ? 'rgba(6, 8, 19, 0.85)' : 'rgba(244, 246, 251, 0.85)',
    shadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5)' : '0 20px 40px -15px rgba(0,0,0,0.04)',
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
      bg: '#ffffff',
      text: '#0f172a',
      primary: '#2563eb',
      isMobile: false,
      width: 1200,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};