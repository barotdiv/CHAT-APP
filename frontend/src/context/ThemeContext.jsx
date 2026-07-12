import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const theme = 'dark';

  useEffect(() => {
    // Apply theme class to document body permanently
    document.body.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
    document.documentElement.setAttribute('data-astryx-media', 'dark');
    document.body.setAttribute('data-astryx-media', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('chatAppTheme', 'dark');
  }, []);

  const setTheme = () => { };
  const toggleTheme = () => { };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
