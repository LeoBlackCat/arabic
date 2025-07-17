/**
 * Performance Utilities
 * Tools for monitoring and optimizing application performance
 */

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Measure component render time
   */
  measureRender: (componentName, renderFn) => {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  },

  /**
   * Measure animation performance
   */
  measureAnimation: (animationName, animationFn) => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      animationFn().then(() => {
        const endTime = performance.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`${animationName} animation time: ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        resolve();
      });
    });
  },

  /**
   * Monitor frame rate during animations
   */
  monitorFrameRate: (callback, duration = 1000) => {
    let frames = 0;
    let startTime = performance.now();
    
    const countFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - startTime >= duration) {
        const fps = Math.round((frames * 1000) / (currentTime - startTime));
        callback(fps);
        
        // Reset for next measurement
        frames = 0;
        startTime = currentTime;
      }
      
      requestAnimationFrame(countFrame);
    };
    
    requestAnimationFrame(countFrame);
  },

  /**
   * Detect performance issues
   */
  detectPerformanceIssues: () => {
    const issues = [];
    
    // Check for slow animations
    if (typeof window !== 'undefined') {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection && connection.effectiveType === 'slow-2g') {
        issues.push('slow-connection');
      }
      
      // Check device memory (if available)
      if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        issues.push('low-memory');
      }
      
      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        issues.push('reduced-motion');
      }
    }
    
    return issues;
  }
};

/**
 * Bundle size optimization utilities
 */
export const bundleOptimizer = {
  /**
   * Lazy load component
   */
  lazyLoad: (importFn, fallback = null) => {
    return React.lazy(() => 
      importFn().catch(err => {
        console.error('Lazy loading failed:', err);
        return { default: fallback || (() => <div>Failed to load component</div>) };
      })
    );
  },

  /**
   * Preload critical resources
   */
  preloadCritical: (resources) => {
    if (typeof window === 'undefined') return;
    
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as || 'script';
      
      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin;
      }
      
      document.head.appendChild(link);
    });
  },

  /**
   * Monitor bundle size in development
   */
  monitorBundleSize: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // This would typically integrate with webpack-bundle-analyzer
    console.log('Bundle size monitoring enabled');
  }
};

/**
 * Memory management utilities
 */
export const memoryManager = {
  /**
   * Clean up event listeners
   */
  cleanupListeners: (element, events) => {
    if (!element) return;
    
    events.forEach(({ event, handler }) => {
      element.removeEventListener(event, handler);
    });
  },

  /**
   * Debounce function calls
   */
  debounce: (func, wait, immediate = false) => {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func(...args);
    };
  },

  /**
   * Throttle function calls
   */
  throttle: (func, limit) => {
    let inThrottle;
    
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Memoize expensive calculations
   */
  memoize: (fn, getKey = (...args) => JSON.stringify(args)) => {
    const cache = new Map();
    
    return (...args) => {
      const key = getKey(...args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      
      // Limit cache size to prevent memory leaks
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return result;
    };
  }
};

/**
 * Font loading optimization
 */
export const fontOptimizer = {
  /**
   * Preload critical fonts
   */
  preloadFonts: (fonts) => {
    if (typeof window === 'undefined') return;
    
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.href;
      link.as = 'font';
      link.type = font.type || 'font/woff2';
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
    });
  },

  /**
   * Load fonts with proper display strategy
   */
  loadFontsOptimized: (fonts) => {
    if (typeof window === 'undefined') return;
    
    fonts.forEach(font => {
      const fontFace = new FontFace(font.family, `url(${font.url})`, {
        display: font.display || 'swap',
        weight: font.weight || 'normal',
        style: font.style || 'normal'
      });
      
      fontFace.load().then(loadedFont => {
        document.fonts.add(loadedFont);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Font loaded: ${font.family}`);
        }
      }).catch(err => {
        console.error(`Failed to load font: ${font.family}`, err);
      });
    });
  },

  /**
   * Check font loading status
   */
  checkFontStatus: (fontFamily) => {
    if (typeof window === 'undefined') return false;
    
    return document.fonts.check(`1em ${fontFamily}`);
  }
};

/**
 * Image optimization utilities
 */
export const imageOptimizer = {
  /**
   * Lazy load images with intersection observer
   */
  lazyLoadImages: (selector = 'img[data-src]') => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      document.querySelectorAll(selector).forEach(img => {
        img.src = img.dataset.src;
      });
      return;
    }
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll(selector).forEach(img => {
      imageObserver.observe(img);
    });
  },

  /**
   * Preload critical images
   */
  preloadImages: (images) => {
    if (typeof window === 'undefined') return;
    
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      
      document.head.appendChild(link);
    });
  },

  /**
   * Generate responsive image srcset
   */
  generateSrcSet: (basePath, sizes = [320, 640, 1024, 1280]) => {
    return sizes.map(size => `${basePath}?w=${size} ${size}w`).join(', ');
  }
};

/**
 * Animation performance optimization
 */
export const animationOptimizer = {
  /**
   * Check if animations should be reduced
   */
  shouldReduceAnimations: () => {
    if (typeof window === 'undefined') return false;
    
    const issues = performanceMonitor.detectPerformanceIssues();
    return issues.includes('reduced-motion') || 
           issues.includes('slow-connection') || 
           issues.includes('low-memory');
  },

  /**
   * Optimize animation based on device capabilities
   */
  optimizeAnimation: (element, animation, options = {}) => {
    if (!element) return;
    
    const shouldReduce = animationOptimizer.shouldReduceAnimations();
    
    if (shouldReduce) {
      // Use simpler animation or skip entirely
      if (options.fallback) {
        options.fallback(element);
      }
      return;
    }
    
    // Use full animation
    if (typeof animation === 'string') {
      element.style.animation = animation;
    } else if (typeof animation === 'function') {
      animation(element);
    }
  },

  /**
   * Monitor animation performance
   */
  monitorAnimationPerformance: (callback) => {
    let frameCount = 0;
    let startTime = performance.now();
    
    const measureFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - startTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - startTime));
        callback(fps);
        
        frameCount = 0;
        startTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }
};

/**
 * CSS optimization utilities
 */
export const cssOptimizer = {
  /**
   * Remove unused CSS classes (development helper)
   */
  findUnusedClasses: (cssText) => {
    if (process.env.NODE_ENV !== 'development') return [];
    
    const classRegex = /\.([a-zA-Z0-9_-]+)/g;
    const classes = [];
    let match;
    
    while ((match = classRegex.exec(cssText)) !== null) {
      classes.push(match[1]);
    }
    
    const unusedClasses = classes.filter(className => {
      return !document.querySelector(`.${className}`);
    });
    
    return unusedClasses;
  },

  /**
   * Inline critical CSS
   */
  inlineCriticalCSS: (css) => {
    if (typeof window === 'undefined') return;
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
};

/**
 * Performance budget monitoring
 */
export const performanceBudget = {
  /**
   * Check if performance budget is exceeded
   */
  checkBudget: (metrics) => {
    const budget = {
      firstContentfulPaint: 1500, // 1.5s
      largestContentfulPaint: 2500, // 2.5s
      firstInputDelay: 100, // 100ms
      cumulativeLayoutShift: 0.1 // 0.1
    };
    
    const violations = [];
    
    Object.keys(budget).forEach(metric => {
      if (metrics[metric] > budget[metric]) {
        violations.push({
          metric,
          actual: metrics[metric],
          budget: budget[metric]
        });
      }
    });
    
    return violations;
  },

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals: (callback) => {
    if (typeof window === 'undefined') return;
    
    // This would typically use web-vitals library
    // For now, we'll use Performance Observer API
    
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          callback({
            name: entry.name,
            value: entry.value || entry.duration,
            rating: entry.value > 2500 ? 'poor' : entry.value > 1000 ? 'needs-improvement' : 'good'
          });
        });
      });
      
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }
};