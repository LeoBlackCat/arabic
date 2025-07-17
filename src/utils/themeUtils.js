/**
 * Theme Utilities for Modern UI Design System
 * Provides helper functions for managing content-aware theming and animations
 */

// Content type theme mappings
export const CONTENT_THEMES = {
  verbs: 'theme-verbs',
  colors: 'theme-colors', 
  nouns: 'theme-nouns',
  phrases: 'theme-phrases'
};

// Animation duration constants
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700
};

// Easing function constants
export const EASING_FUNCTIONS = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

/**
 * Get theme class name for a content type
 * @param {string} contentType - The content type (verbs, colors, nouns, phrases)
 * @returns {string} The corresponding theme class name
 */
export const getThemeClass = (contentType) => {
  return CONTENT_THEMES[contentType] || CONTENT_THEMES.verbs;
};

/**
 * Get CSS custom properties for a specific theme
 * @param {string} contentType - The content type
 * @returns {object} CSS custom properties object
 */
export const getThemeProperties = (contentType) => {
  const themeClass = getThemeClass(contentType);
  
  // These would be dynamically calculated in a real implementation
  // For now, return the CSS variable names that correspond to each theme
  const themeMap = {
    'theme-verbs': {
      '--theme-primary': 'var(--theme-verbs-primary)',
      '--theme-secondary': 'var(--theme-verbs-secondary)',
      '--theme-accent': 'var(--theme-verbs-accent)',
      '--theme-gradient': 'var(--theme-verbs-gradient)'
    },
    'theme-colors': {
      '--theme-primary': 'var(--theme-colors-primary)',
      '--theme-secondary': 'var(--theme-colors-secondary)',
      '--theme-accent': 'var(--theme-colors-accent)',
      '--theme-gradient': 'var(--theme-colors-gradient)'
    },
    'theme-nouns': {
      '--theme-primary': 'var(--theme-nouns-primary)',
      '--theme-secondary': 'var(--theme-nouns-secondary)',
      '--theme-accent': 'var(--theme-nouns-accent)',
      '--theme-gradient': 'var(--theme-nouns-gradient)'
    },
    'theme-phrases': {
      '--theme-primary': 'var(--theme-phrases-primary)',
      '--theme-secondary': 'var(--theme-phrases-secondary)',
      '--theme-accent': 'var(--theme-phrases-accent)',
      '--theme-gradient': 'var(--theme-phrases-gradient)'
    }
  };
  
  return themeMap[themeClass] || themeMap['theme-verbs'];
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on user preferences
 * @param {string} duration - Duration key (fast, normal, slow, slower)
 * @returns {number} Duration in milliseconds, or 0 if reduced motion is preferred
 */
export const getAnimationDuration = (duration = 'normal') => {
  if (prefersReducedMotion()) return 0;
  return ANIMATION_DURATIONS[duration] || ANIMATION_DURATIONS.normal;
};

/**
 * Get animation easing function based on user preferences
 * @param {string} easing - Easing key (smooth, bounce, gentle, spring)
 * @returns {string} CSS easing function, or 'linear' if reduced motion is preferred
 */
export const getAnimationEasing = (easing = 'smooth') => {
  if (prefersReducedMotion()) return 'linear';
  return EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.smooth;
};

/**
 * Create a CSS transition string with proper fallbacks
 * @param {string} property - CSS property to transition
 * @param {string} duration - Duration key
 * @param {string} easing - Easing key
 * @returns {string} Complete CSS transition string
 */
export const createTransition = (property = 'all', duration = 'normal', easing = 'smooth') => {
  const durationMs = getAnimationDuration(duration);
  const easingFunction = getAnimationEasing(easing);
  
  if (durationMs === 0) return 'none';
  return `${property} ${durationMs}ms ${easingFunction}`;
};

/**
 * Apply theme to a DOM element
 * @param {HTMLElement} element - The DOM element to apply theme to
 * @param {string} contentType - The content type for theming
 */
export const applyTheme = (element, contentType) => {
  if (!element) return;
  
  // Remove existing theme classes
  Object.values(CONTENT_THEMES).forEach(themeClass => {
    element.classList.remove(themeClass);
  });
  
  // Add new theme class
  const themeClass = getThemeClass(contentType);
  element.classList.add(themeClass);
};

/**
 * Create staggered animation delays for lists
 * @param {number} index - Item index in the list
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} staggerAmount - Stagger amount in milliseconds
 * @returns {string} CSS animation-delay value
 */
export const getStaggerDelay = (index, baseDelay = 0, staggerAmount = 100) => {
  if (prefersReducedMotion()) return '0ms';
  const totalDelay = baseDelay + (index * staggerAmount);
  return `${totalDelay}ms`;
};

/**
 * Trigger a celebration animation on an element
 * @param {HTMLElement} element - The element to animate
 * @param {string} animationType - Type of celebration (celebration, bounce, glow)
 */
export const triggerCelebration = (element, animationType = 'celebration') => {
  if (!element || prefersReducedMotion()) return;
  
  // Remove any existing animation classes
  element.classList.remove('animate-celebration', 'animate-bounce', 'animate-glow');
  
  // Add the celebration animation
  element.classList.add(`animate-${animationType}`);
  
  // Remove the class after animation completes
  const duration = getAnimationDuration('slow');
  setTimeout(() => {
    element.classList.remove(`animate-${animationType}`);
  }, duration);
};

/**
 * Create a smooth color transition between themes
 * @param {HTMLElement} element - The element to transition
 * @param {string} fromTheme - Starting theme
 * @param {string} toTheme - Target theme
 * @param {number} duration - Transition duration in milliseconds
 */
export const transitionTheme = (element, fromTheme, toTheme, duration = 300) => {
  if (!element || prefersReducedMotion()) {
    applyTheme(element, toTheme);
    return;
  }
  
  // Apply transition
  element.style.transition = createTransition('all', 'normal', 'smooth');
  
  // Change theme
  setTimeout(() => {
    applyTheme(element, toTheme);
  }, 10);
  
  // Clean up transition
  setTimeout(() => {
    element.style.transition = '';
  }, duration);
};

/**
 * Get appropriate font family for text type
 * @param {string} textType - Type of text (arabizi, arabic, english)
 * @returns {string} CSS font-family value
 */
export const getFontFamily = (textType) => {
  const fontMap = {
    arabizi: 'var(--font-arabizi)',
    arabic: 'var(--font-arabic)',
    english: 'var(--font-primary)',
    primary: 'var(--font-primary)'
  };
  
  return fontMap[textType] || fontMap.primary;
};

/**
 * Check if device supports backdrop-filter
 * @returns {boolean} True if backdrop-filter is supported
 */
export const supportsBackdropFilter = () => {
  if (typeof window === 'undefined') return false;
  return CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
};

/**
 * Get appropriate glassmorphism class based on browser support
 * @param {boolean} strong - Whether to use strong glassmorphism effect
 * @returns {string} CSS class name
 */
export const getGlassmorphismClass = (strong = false) => {
  if (!supportsBackdropFilter()) {
    return 'backdrop-blur-fallback';
  }
  return strong ? 'glass-strong' : 'glass';
};