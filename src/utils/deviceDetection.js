/**
 * Device Detection and Browser Compatibility Utilities
 * Comprehensive device and browser detection for cross-platform optimization
 */

/**
 * Browser detection utilities
 */
export const browserDetection = {
  /**
   * Get browser information
   */
  getBrowserInfo: () => {
    const userAgent = navigator.userAgent;
    const browsers = {
      chrome: /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor),
      firefox: /Firefox/.test(userAgent),
      safari: /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor),
      edge: /Edg/.test(userAgent),
      ie: /MSIE|Trident/.test(userAgent),
      opera: /Opera|OPR/.test(userAgent)
    };

    const browserName = Object.keys(browsers).find(browser => browsers[browser]) || 'unknown';
    const version = browserDetection.getBrowserVersion(userAgent, browserName);

    return {
      name: browserName,
      version,
      userAgent,
      isModern: browserDetection.isModernBrowser(browserName, version)
    };
  },

  /**
   * Extract browser version
   */
  getBrowserVersion: (userAgent, browserName) => {
    const patterns = {
      chrome: /Chrome\/(\d+)/,
      firefox: /Firefox\/(\d+)/,
      safari: /Version\/(\d+)/,
      edge: /Edg\/(\d+)/,
      ie: /(?:MSIE |rv:)(\d+)/,
      opera: /(?:Opera|OPR)\/(\d+)/
    };

    const pattern = patterns[browserName];
    if (!pattern) return 'unknown';

    const match = userAgent.match(pattern);
    return match ? parseInt(match[1]) : 'unknown';
  },

  /**
   * Check if browser is modern (supports modern features)
   */
  isModernBrowser: (browserName, version) => {
    const minimumVersions = {
      chrome: 80,
      firefox: 75,
      safari: 13,
      edge: 80,
      opera: 67
    };

    if (browserName === 'ie') return false;
    
    const minVersion = minimumVersions[browserName];
    return minVersion ? version >= minVersion : false;
  },

  /**
   * Check for specific browser features
   */
  checkFeatureSupport: () => {
    return {
      // CSS Features
      cssGrid: CSS.supports('display', 'grid'),
      cssFlexbox: CSS.supports('display', 'flex'),
      cssCustomProperties: CSS.supports('--test', 'value'),
      cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
      cssClipPath: CSS.supports('clip-path', 'circle(50%)'),
      
      // JavaScript Features
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      webGL: !!window.WebGLRenderingContext,
      webGL2: !!window.WebGL2RenderingContext,
      serviceWorker: 'serviceWorker' in navigator,
      
      // Media Features
      webP: browserDetection.checkWebPSupport(),
      avif: browserDetection.checkAVIFSupport(),
      
      // Touch and Input
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      
      // Storage
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch (e) {
          return false;
        }
      })(),
      
      // Network
      connection: 'connection' in navigator,
      onLine: 'onLine' in navigator
    };
  },

  /**
   * Check WebP support
   */
  checkWebPSupport: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  },

  /**
   * Check AVIF support
   */
  checkAVIFSupport: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }
};

/**
 * Device detection utilities
 */
export const deviceDetection = {
  /**
   * Get device information
   */
  getDeviceInfo: () => {
    const userAgent = navigator.userAgent;
    
    return {
      type: deviceDetection.getDeviceType(),
      os: deviceDetection.getOperatingSystem(),
      screen: deviceDetection.getScreenInfo(),
      capabilities: deviceDetection.getDeviceCapabilities(),
      performance: deviceDetection.getPerformanceHints()
    };
  },

  /**
   * Determine device type
   */
  getDeviceType: () => {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  },

  /**
   * Get operating system
   */
  getOperatingSystem: () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (/Win/.test(platform)) return 'Windows';
    if (/Mac/.test(platform)) return 'macOS';
    if (/Linux/.test(platform)) return 'Linux';
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    
    return 'Unknown';
  },

  /**
   * Get screen information
   */
  getScreenInfo: () => {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation ? screen.orientation.type : 'unknown'
    };
  },

  /**
   * Get device capabilities
   */
  getDeviceCapabilities: () => {
    return {
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      battery: 'getBattery' in navigator,
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
    };
  },

  /**
   * Get performance hints
   */
  getPerformanceHints: () => {
    const connection = navigator.connection;
    const memory = navigator.deviceMemory;
    
    let performanceLevel = 'high';
    
    // Check connection speed
    if (connection) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        performanceLevel = 'low';
      } else if (connection.effectiveType === '3g') {
        performanceLevel = 'medium';
      }
    }
    
    // Check device memory
    if (memory && memory < 4) {
      performanceLevel = performanceLevel === 'high' ? 'medium' : 'low';
    }
    
    return {
      level: performanceLevel,
      shouldReduceAnimations: performanceLevel === 'low',
      shouldOptimizeImages: performanceLevel !== 'high',
      shouldLazyLoad: performanceLevel !== 'high'
    };
  },

  /**
   * Check if device is touch-enabled
   */
  isTouchDevice: () => {
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           navigator.msMaxTouchPoints > 0;
  },

  /**
   * Check if device is mobile
   */
  isMobile: () => {
    return deviceDetection.getDeviceType() === 'mobile';
  },

  /**
   * Check if device is tablet
   */
  isTablet: () => {
    return deviceDetection.getDeviceType() === 'tablet';
  },

  /**
   * Check if device is desktop
   */
  isDesktop: () => {
    return deviceDetection.getDeviceType() === 'desktop';
  }
};

/**
 * Compatibility testing utilities
 */
export const compatibilityTester = {
  /**
   * Run comprehensive compatibility tests
   */
  runCompatibilityTests: () => {
    const browser = browserDetection.getBrowserInfo();
    const device = deviceDetection.getDeviceInfo();
    const features = browserDetection.checkFeatureSupport();
    
    const tests = {
      browser: compatibilityTester.testBrowserCompatibility(browser),
      features: compatibilityTester.testFeatureCompatibility(features),
      performance: compatibilityTester.testPerformanceCompatibility(device),
      accessibility: compatibilityTester.testAccessibilityCompatibility()
    };
    
    return {
      browser,
      device,
      features,
      tests,
      overall: compatibilityTester.calculateOverallScore(tests)
    };
  },

  /**
   * Test browser compatibility
   */
  testBrowserCompatibility: (browser) => {
    const issues = [];
    const warnings = [];
    
    if (!browser.isModern) {
      issues.push(`Outdated browser: ${browser.name} ${browser.version}`);
    }
    
    if (browser.name === 'ie') {
      issues.push('Internet Explorer is not supported');
    }
    
    if (browser.name === 'safari' && browser.version < 14) {
      warnings.push('Some modern features may not work in older Safari versions');
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 30) - (warnings.length * 10))
    };
  },

  /**
   * Test feature compatibility
   */
  testFeatureCompatibility: (features) => {
    const required = [
      'cssFlexbox',
      'cssCustomProperties',
      'intersectionObserver',
      'localStorage'
    ];
    
    const recommended = [
      'cssGrid',
      'cssBackdropFilter',
      'resizeObserver',
      'webP'
    ];
    
    const missing = required.filter(feature => !features[feature]);
    const missingRecommended = recommended.filter(feature => !features[feature]);
    
    return {
      passed: missing.length === 0,
      missing,
      missingRecommended,
      score: Math.max(0, 100 - (missing.length * 25) - (missingRecommended.length * 5))
    };
  },

  /**
   * Test performance compatibility
   */
  testPerformanceCompatibility: (device) => {
    const issues = [];
    const warnings = [];
    
    if (device.performance.level === 'low') {
      warnings.push('Low-performance device detected - animations may be reduced');
    }
    
    if (device.capabilities.memory !== 'unknown' && device.capabilities.memory < 2) {
      issues.push('Very low device memory - may cause performance issues');
    }
    
    if (device.capabilities.connection && device.capabilities.connection.effectiveType === 'slow-2g') {
      warnings.push('Very slow network connection detected');
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 10))
    };
  },

  /**
   * Test accessibility compatibility
   */
  testAccessibilityCompatibility: () => {
    const issues = [];
    const warnings = [];
    
    // Check for reduced motion preference
    if (!window.matchMedia) {
      warnings.push('Media queries not supported - reduced motion detection unavailable');
    }
    
    // Check for high contrast support
    if (!CSS.supports('forced-colors', 'active')) {
      warnings.push('High contrast mode detection may not work');
    }
    
    // Check for screen reader compatibility
    if (!document.createElement('div').setAttribute) {
      issues.push('ARIA attributes may not be supported');
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 5))
    };
  },

  /**
   * Calculate overall compatibility score
   */
  calculateOverallScore: (tests) => {
    const scores = Object.values(tests).map(test => test.score);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    let rating = 'excellent';
    if (average < 60) rating = 'poor';
    else if (average < 75) rating = 'fair';
    else if (average < 90) rating = 'good';
    
    return {
      score: Math.round(average),
      rating,
      recommendation: compatibilityTester.getRecommendation(average)
    };
  },

  /**
   * Get compatibility recommendation
   */
  getRecommendation: (score) => {
    if (score >= 90) {
      return 'Excellent compatibility - all features should work perfectly';
    } else if (score >= 75) {
      return 'Good compatibility - minor features may be limited';
    } else if (score >= 60) {
      return 'Fair compatibility - some features may not work optimally';
    } else {
      return 'Poor compatibility - consider upgrading browser or device';
    }
  }
};

/**
 * Cross-platform optimization utilities
 */
export const crossPlatformOptimizer = {
  /**
   * Apply platform-specific optimizations
   */
  applyOptimizations: () => {
    const device = deviceDetection.getDeviceInfo();
    const browser = browserDetection.getBrowserInfo();
    const features = browserDetection.checkFeatureSupport();
    
    // Apply iOS-specific fixes
    if (device.os === 'iOS') {
      crossPlatformOptimizer.applyIOSFixes();
    }
    
    // Apply Android-specific fixes
    if (device.os === 'Android') {
      crossPlatformOptimizer.applyAndroidFixes();
    }
    
    // Apply Safari-specific fixes
    if (browser.name === 'safari') {
      crossPlatformOptimizer.applySafariFixes();
    }
    
    // Apply performance optimizations
    if (device.performance.level === 'low') {
      crossPlatformOptimizer.applyLowPerformanceOptimizations();
    }
    
    // Apply feature fallbacks
    crossPlatformOptimizer.applyFeatureFallbacks(features);
  },

  /**
   * Apply iOS-specific fixes
   */
  applyIOSFixes: () => {
    // Fix iOS viewport issues
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    }
    
    // Fix iOS scroll bounce
    document.body.style.overscrollBehavior = 'none';
    
    // Fix iOS safe area
    document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
  },

  /**
   * Apply Android-specific fixes
   */
  applyAndroidFixes: () => {
    // Fix Android keyboard resize issues
    window.addEventListener('resize', () => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        setTimeout(() => {
          document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
  },

  /**
   * Apply Safari-specific fixes
   */
  applySafariFixes: () => {
    // Fix Safari backdrop-filter fallback
    if (!CSS.supports('backdrop-filter', 'blur(10px)')) {
      document.documentElement.classList.add('no-backdrop-filter');
    }
    
    // Fix Safari flexbox bugs
    const style = document.createElement('style');
    style.textContent = `
      .safari-flex-fix {
        min-height: 0;
        min-width: 0;
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Apply low performance optimizations
   */
  applyLowPerformanceOptimizations: () => {
    // Disable animations
    document.documentElement.classList.add('reduce-animations');
    
    // Reduce image quality
    document.documentElement.classList.add('optimize-images');
    
    // Enable lazy loading
    document.documentElement.classList.add('lazy-load-all');
  },

  /**
   * Apply feature fallbacks
   */
  applyFeatureFallbacks: (features) => {
    // CSS Grid fallback
    if (!features.cssGrid) {
      document.documentElement.classList.add('no-css-grid');
    }
    
    // Backdrop filter fallback
    if (!features.cssBackdropFilter) {
      document.documentElement.classList.add('no-backdrop-filter');
    }
    
    // Intersection Observer fallback
    if (!features.intersectionObserver) {
      // Load polyfill
      import('intersection-observer').catch(() => {
        console.warn('Failed to load Intersection Observer polyfill');
      });
    }
    
    // WebP fallback
    if (!features.webP) {
      document.documentElement.classList.add('no-webp');
    }
  }
};