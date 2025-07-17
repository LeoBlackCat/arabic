/**
 * Theme Utilities
 * Content-aware theming system with cultural sensitivity
 */

// Content type constants
export const CONTENT_TYPES = {
  VERBS: 'verbs',
  COLORS: 'colors', 
  NOUNS: 'nouns',
  PHRASES: 'phrases'
};

// Theme definitions inspired by UAE landscapes and culture
export const THEME_DEFINITIONS = {
  [CONTENT_TYPES.VERBS]: {
    name: 'Desert Sunset',
    description: 'Warm oranges and deep blues inspired by UAE desert sunsets',
    primary: '#E97451', // Warm sunset orange
    secondary: '#2D5AA0', // Deep desert blue
    accent: '#F4A261', // Golden sand
    background: 'linear-gradient(135deg, #E97451 0%, #F4A261 50%, #2D5AA0 100%)',
    pattern: 'geometric-waves',
    culturalElements: ['desert', 'sunset', 'warmth']
  },
  [CONTENT_TYPES.COLORS]: {
    name: 'Oasis Garden',
    description: 'Vibrant greens and blues inspired by UAE oases',
    primary: '#2A9D8F', // Oasis turquoise
    secondary: '#264653', // Deep forest green
    accent: '#E9C46A', // Golden yellow
    background: 'linear-gradient(135deg, #2A9D8F 0%, #E9C46A 50%, #264653 100%)',
    pattern: 'flowing-water',
    culturalElements: ['oasis', 'water', 'growth']
  },
  [CONTENT_TYPES.NOUNS]: {
    name: 'Pearl Diver',
    description: 'Ocean blues and pearl whites inspired by UAE pearl diving heritage',
    primary: '#0077BE', // Deep ocean blue
    secondary: '#003F5C', // Midnight blue
    accent: '#F8F9FA', // Pearl white
    background: 'linear-gradient(135deg, #0077BE 0%, #F8F9FA 50%, #003F5C 100%)',
    pattern: 'pearl-waves',
    culturalElements: ['ocean', 'pearls', 'heritage']
  },
  [CONTENT_TYPES.PHRASES]: {
    name: 'Spice Market',
    description: 'Rich purples and golds inspired by traditional UAE spice markets',
    primary: '#6A4C93', // Royal purple
    secondary: '#8B5A2B', // Spice brown
    accent: '#FFD700', // Golden yellow
    background: 'linear-gradient(135deg, #6A4C93 0%, #FFD700 50%, #8B5A2B 100%)',
    pattern: 'arabesque',
    culturalElements: ['spices', 'markets', 'tradition']
  }
};

// Default theme for unknown content types
export const DEFAULT_THEME = {
  name: 'UAE Flag',
  description: 'Colors inspired by the UAE national flag',
  primary: '#00732F', // UAE Green
  secondary: '#FF0000', // UAE Red
  accent: '#000000', // UAE Black
  background: 'linear-gradient(135deg, #00732F 0%, #FF0000 50%, #000000 100%)',
  pattern: 'flag-stripes',
  culturalElements: ['national', 'pride', 'unity']
};

/**
 * Get theme configuration for content type
 */
export const getTheme = (contentType) => {
  return THEME_DEFINITIONS[contentType] || DEFAULT_THEME;
};

/**
 * Get theme class name for content type
 */
export const getThemeClass = (contentType) => {
  if (!contentType) return 'theme-default';
  return `theme-${contentType}`;
};

/**
 * Apply theme to an element
 */
export const applyTheme = (element, contentType, options = {}) => {
  if (!element || !contentType) return;
  
  const theme = getTheme(contentType);
  const {
    includeBackground = false,
    includePattern = false,
    smooth = true
  } = options;
  
  // Add theme class
  element.classList.add(getThemeClass(contentType));
  
  // Apply CSS custom properties
  element.style.setProperty('--theme-primary', theme.primary);
  element.style.setProperty('--theme-secondary', theme.secondary);
  element.style.setProperty('--theme-accent', theme.accent);
  element.style.setProperty('--theme-gradient', theme.background);
  
  if (includeBackground) {
    element.style.background = theme.background;
  }
  
  if (includePattern) {
    element.classList.add(`pattern-${theme.pattern}`);
  }
  
  if (smooth) {
    element.style.transition = 'all 0.3s ease-out';
  }
};

/**
 * Create smooth transition between themes
 */
export const createTransition = (element, fromTheme, toTheme, duration = 300) => {
  if (!element) return Promise.resolve();
  
  return new Promise((resolve) => {
    // Set initial state
    element.style.transition = `all ${duration}ms ease-out`;
    
    // Apply new theme
    setTimeout(() => {
      applyTheme(element, toTheme, { smooth: true });
      
      // Resolve after transition completes
      setTimeout(resolve, duration);
    }, 10);
  });
};

/**
 * Get culturally appropriate colors for content
 */
export const getCulturalColors = (contentType) => {
  const theme = getTheme(contentType);
  
  return {
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    culturalContext: theme.culturalElements,
    description: theme.description
  };
};

/**
 * Generate theme-aware gradient
 */
export const generateGradient = (contentType, direction = '135deg') => {
  const theme = getTheme(contentType);
  return `linear-gradient(${direction}, ${theme.primary} 0%, ${theme.accent} 50%, ${theme.secondary} 100%)`;
};

/**
 * Get theme-appropriate text color
 */
export const getTextColor = (backgroundColor, contentType) => {
  const theme = getTheme(contentType);
  
  // Simple luminance calculation
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };
  
  const bgLuminance = getLuminance(backgroundColor);
  
  // Return appropriate text color based on background
  if (bgLuminance > 128) {
    return theme.secondary; // Dark text on light background
  } else {
    return theme.accent; // Light text on dark background
  }
};

/**
 * Theme animation utilities
 */
export const themeAnimations = {
  /**
   * Fade between themes
   */
  fadeTransition: (element, newTheme, duration = 300) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-out`;
    
    setTimeout(() => {
      applyTheme(element, newTheme);
      element.style.opacity = '1';
    }, duration / 2);
  },
  
  /**
   * Scale transition between themes
   */
  scaleTransition: (element, newTheme, duration = 300) => {
    element.style.transform = 'scale(0.95)';
    element.style.transition = `transform ${duration}ms ease-out`;
    
    setTimeout(() => {
      applyTheme(element, newTheme);
      element.style.transform = 'scale(1)';
    }, duration / 2);
  },
  
  /**
   * Slide transition between themes
   */
  slideTransition: (element, newTheme, direction = 'left', duration = 300) => {
    const translateValue = direction === 'left' ? '-10px' : '10px';
    element.style.transform = `translateX(${translateValue})`;
    element.style.transition = `transform ${duration}ms ease-out`;
    
    setTimeout(() => {
      applyTheme(element, newTheme);
      element.style.transform = 'translateX(0)';
    }, duration / 2);
  }
};

/**
 * Cultural pattern utilities
 */
export const culturalPatterns = {
  'geometric-waves': {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: '60px 60px'
  },
  'flowing-water': {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: '40px 40px'
  },
  'pearl-waves': {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='40' cy='40' r='20'/%3E%3Ccircle cx='0' cy='40' r='20'/%3E%3Ccircle cx='80' cy='40' r='20'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: '80px 80px'
  },
  'arabesque': {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M50 50c0-13.807-11.193-25-25-25S0 36.193 0 50s11.193 25 25 25 25-11.193 25-25zm25 0c0 13.807 11.193 25 25 25s25-11.193 25-25-11.193-25-25-25-25 11.193-25 25z'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: '100px 100px'
  }
};

/**
 * Apply cultural pattern to element
 */
export const applyCulturalPattern = (element, contentType, opacity = 0.05) => {
  const theme = getTheme(contentType);
  const pattern = culturalPatterns[theme.pattern];
  
  if (pattern && element) {
    Object.assign(element.style, {
      ...pattern,
      backgroundBlendMode: 'overlay',
      position: 'relative'
    });
    
    // Adjust opacity
    const bgImage = pattern.backgroundImage.replace('fill-opacity=\'0.05\'', `fill-opacity='${opacity}'`);
    element.style.backgroundImage = bgImage;
  }
};

/**
 * Theme context provider utilities
 */
export const createThemeContext = (contentType) => {
  const theme = getTheme(contentType);
  
  return {
    contentType,
    theme,
    colors: {
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent
    },
    gradient: theme.background,
    culturalElements: theme.culturalElements,
    applyTo: (element, options) => applyTheme(element, contentType, options),
    transitionTo: (element, newContentType, duration) => 
      createTransition(element, contentType, newContentType, duration)
  };
};