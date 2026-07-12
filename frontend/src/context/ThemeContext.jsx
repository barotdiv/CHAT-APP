import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('chatAppTheme');
    return saved ? saved : 'dark';
  });

  useEffect(() => {
    // Apply theme class to document body
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
      document.documentElement.setAttribute('data-astryx-media', 'light');
      document.body.setAttribute('data-astryx-media', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
    } else {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
      document.documentElement.setAttribute('data-astryx-media', 'dark');
      document.body.setAttribute('data-astryx-media', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('chatAppTheme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
