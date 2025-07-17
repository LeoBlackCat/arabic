/**
 * Theme Provider Component
 * Provides theme context and manages theme transitions
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getTheme, applyTheme, createTransition, CONTENT_TYPES } from '../utils/themeUtils.js';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children, contentType = CONTENT_TYPES.VERBS }) => {
  const [currentTheme, setCurrentTheme] = useState(contentType);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousTheme = useRef(contentType);
  const rootRef = useRef(null);

  // Get current theme configuration
  const theme = getTheme(currentTheme);

  // Update theme when contentType changes
  useEffect(() => {
    if (contentType !== currentTheme && !isTransitioning) {
      changeTheme(contentType);
    }
  }, [contentType, currentTheme, isTransitioning]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    rootRef.current = root;
    
    // Apply theme variables to root
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-gradient', theme.background);
    
    // Add theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);
    
    // Announce theme change to screen readers
    const announcement = `Theme changed to ${theme.name}: ${theme.description}`;
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = announcement;
    document.body.appendChild(liveRegion);
    
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, [currentTheme, theme]);

  // Change theme with smooth transition
  const changeTheme = async (newTheme) => {
    if (newTheme === currentTheme || isTransitioning) return;
    
    setIsTransitioning(true);
    previousTheme.current = currentTheme;
    
    try {
      // Create transition effect
      if (rootRef.current) {
        await createTransition(rootRef.current, currentTheme, newTheme, 300);
      }
      
      setCurrentTheme(newTheme);
    } catch (error) {
      console.error('Theme transition error:', error);
      setCurrentTheme(newTheme); // Fallback to immediate change
    } finally {
      setIsTransitioning(false);
    }
  };

  // Get theme-aware colors
  const getThemeColors = () => ({
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    gradient: theme.background
  });

  // Apply theme to specific element
  const applyThemeToElement = (element, options = {}) => {
    if (element) {
      applyTheme(element, currentTheme, options);
    }
  };

  const contextValue = {
    currentTheme,
    theme,
    isTransitioning,
    previousTheme: previousTheme.current,
    changeTheme,
    getThemeColors,
    applyThemeToElement,
    culturalElements: theme.culturalElements,
    themeName: theme.name,
    themeDescription: theme.description
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`theme-provider theme-${currentTheme} ${isTransitioning ? 'theme-transitioning' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;