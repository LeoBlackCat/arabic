/**
 * Font Loading Optimization
 * Efficient font loading with proper fallbacks and performance monitoring
 */

import { fontOptimizer } from './performanceUtils.js';

/**
 * Font configuration for the application
 */
export const FONT_CONFIG = {
  primary: {
    family: 'Inter',
    weights: [400, 500, 600, 700],
    display: 'swap',
    preload: true,
    fallback: '-apple-system, BlinkMacSystemFont, sans-serif'
  },
  arabizi: {
    family: 'JetBrains Mono',
    weights: [400, 500, 600],
    display: 'swap',
    preload: true,
    fallback: '"SF Mono", Monaco, "Cascadia Code", monospace'
  },
  arabic: {
    family: 'Noto Sans Arabic',
    weights: [400, 500, 600],
    display: 'swap',
    preload: true,
    fallback: '"Arabic UI Text", "Geeza Pro", serif'
  }
};

/**
 * Font loading manager
 */
export class FontLoader {
  constructor() {
    this.loadedFonts = new Set();
    this.loadingPromises = new Map();
    this.fallbackTimeout = 3000; // 3 seconds
  }

  /**
   * Preload critical fonts
   */
  preloadCriticalFonts() {
    const criticalFonts = Object.values(FONT_CONFIG)
      .filter(font => font.preload)
      .map(font => ({
        href: this.getFontURL(font.family, font.weights[0]),
        type: 'font/woff2'
      }));

    fontOptimizer.preloadFonts(criticalFonts);
  }

  /**
   * Load font with proper fallback strategy
   */
  async loadFont(fontConfig) {
    const { family, weights, display } = fontConfig;
    
    // Check if already loaded
    if (this.loadedFonts.has(family)) {
      return Promise.resolve();
    }

    // Check if already loading
    if (this.loadingPromises.has(family)) {
      return this.loadingPromises.get(family);
    }

    // Create loading promise
    const loadingPromise = this.loadFontWeights(family, weights, display);
    this.loadingPromises.set(family, loadingPromise);

    try {
      await loadingPromise;
      this.loadedFonts.add(family);
      console.log(`Font loaded successfully: ${family}`);
    } catch (error) {
      console.warn(`Font loading failed: ${family}`, error);
      this.applyFallbackFont(family);
    } finally {
      this.loadingPromises.delete(family);
    }

    return loadingPromise;
  }

  /**
   * Load multiple font weights
   */
  async loadFontWeights(family, weights, display = 'swap') {
    const loadPromises = weights.map(weight => {
      const fontFace = new FontFace(
        family,
        `url(${this.getFontURL(family, weight)})`,
        {
          weight: weight.toString(),
          display,
          style: 'normal'
        }
      );

      return fontFace.load().then(loadedFont => {
        document.fonts.add(loadedFont);
        return loadedFont;
      });
    });

    // Race against timeout
    return Promise.race([
      Promise.all(loadPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Font loading timeout')), this.fallbackTimeout)
      )
    ]);
  }

  /**
   * Apply fallback font when loading fails
   */
  applyFallbackFont(family) {
    const config = Object.values(FONT_CONFIG).find(f => f.family === family);
    if (!config) return;

    // Update CSS custom property to use fallback
    document.documentElement.style.setProperty(
      `--font-${this.getFontVariableName(family)}`,
      config.fallback
    );
  }

  /**
   * Get font URL (would typically point to CDN or local files)
   */
  getFontURL(family, weight) {
    // This would typically point to your font files
    const baseURL = '/fonts';
    const fileName = `${family.replace(/\s+/g, '-').toLowerCase()}-${weight}`;
    return `${baseURL}/${fileName}.woff2`;
  }

  /**
   * Get CSS variable name for font
   */
  getFontVariableName(family) {
    return family.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Check if font is loaded
   */
  isFontLoaded(family) {
    return this.loadedFonts.has(family) || fontOptimizer.checkFontStatus(family);
  }

  /**
   * Load all application fonts
   */
  async loadAllFonts() {
    const loadPromises = Object.values(FONT_CONFIG).map(config => 
      this.loadFont(config).catch(error => {
        console.warn(`Failed to load ${config.family}:`, error);
        return null; // Don't fail the entire loading process
      })
    );

    const results = await Promise.allSettled(loadPromises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const total = results.length;
    
    console.log(`Font loading complete: ${successful}/${total} fonts loaded successfully`);
    
    return {
      successful,
      total,
      loadedFonts: Array.from(this.loadedFonts)
    };
  }

  /**
   * Monitor font loading performance
   */
  monitorFontLoading() {
    if (typeof window === 'undefined' || !document.fonts) return;

    document.fonts.addEventListener('loadingdone', (event) => {
      console.log(`Font loading completed: ${event.fontfaces.length} fonts loaded`);
    });

    document.fonts.addEventListener('loadingerror', (event) => {
      console.error('Font loading error:', event);
    });

    // Monitor font loading time
    const startTime = performance.now();
    
    document.fonts.ready.then(() => {
      const loadTime = performance.now() - startTime;
      console.log(`All fonts loaded in ${loadTime.toFixed(2)}ms`);
      
      // Report to analytics if needed
      if (window.gtag) {
        window.gtag('event', 'font_load_time', {
          event_category: 'Performance',
          value: Math.round(loadTime)
        });
      }
    });
  }
}

/**
 * Global font loader instance
 */
export const fontLoader = new FontLoader();

/**
 * Initialize font loading
 */
export const initializeFonts = async () => {
  try {
    // Preload critical fonts first
    fontLoader.preloadCriticalFonts();
    
    // Monitor font loading
    fontLoader.monitorFontLoading();
    
    // Load all fonts
    const result = await fontLoader.loadAllFonts();
    
    return result;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return { successful: 0, total: 0, loadedFonts: [] };
  }
};

/**
 * Font loading hook for React components
 */
export const useFontLoading = (fontFamily) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const config = Object.values(FONT_CONFIG).find(f => f.family === fontFamily);
    if (!config) {
      setError(new Error(`Font configuration not found: ${fontFamily}`));
      setIsLoading(false);
      return;
    }

    // Check if already loaded
    if (fontLoader.isFontLoaded(fontFamily)) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load font
    fontLoader.loadFont(config)
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch(err => {
        setError(err);
        setIsLoaded(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fontFamily]);

  return { isLoaded, isLoading, error };
};