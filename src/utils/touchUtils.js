/**
 * Touch and Gesture Utilities
 * Provides touch interaction helpers and swipe gesture detection
 */

/**
 * Touch gesture detector class
 */
export class TouchGestureDetector {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      threshold: 50, // minimum distance for swipe
      restraint: 100, // maximum perpendicular distance
      allowedTime: 300, // maximum time for swipe
      ...options
    };
    
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.distX = 0;
    this.distY = 0;
    this.elapsedTime = 0;
    
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    this.init();
  }
  
  init() {
    if (this.element) {
      this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = new Date().getTime();
  }
  
  handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    this.distX = touch.clientX - this.startX;
    this.distY = touch.clientY - this.startY;
    this.elapsedTime = new Date().getTime() - this.startTime;
    
    if (this.elapsedTime <= this.options.allowedTime) {
      if (Math.abs(this.distX) >= this.options.threshold && Math.abs(this.distY) <= this.options.restraint) {
        const direction = this.distX < 0 ? 'left' : 'right';
        this.onSwipe(direction, { distX: this.distX, distY: this.distY, elapsedTime: this.elapsedTime });
      } else if (Math.abs(this.distY) >= this.options.threshold && Math.abs(this.distX) <= this.options.restraint) {
        const direction = this.distY < 0 ? 'up' : 'down';
        this.onSwipe(direction, { distX: this.distX, distY: this.distY, elapsedTime: this.elapsedTime });
      }
    }
  }
  
  onSwipe(direction, details) {
    // Override this method or set via options
    if (this.options.onSwipe) {
      this.options.onSwipe(direction, details);
    }
  }
  
  destroy() {
    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
    }
  }
}

/**
 * Check if device supports touch
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get safe area insets for devices with notches
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
  };
};

/**
 * Apply safe area padding to an element
 */
export const applySafeAreaPadding = (element, sides = ['top', 'bottom']) => {
  if (!element) return;
  
  sides.forEach(side => {
    element.style[`padding${side.charAt(0).toUpperCase() + side.slice(1)}`] = 
      `max(${element.style[`padding${side.charAt(0).toUpperCase() + side.slice(1)}`] || '0px'}, env(safe-area-inset-${side}))`;
  });
};

/**
 * Optimize touch target size (minimum 44px)
 */
export const optimizeTouchTarget = (element, minSize = 44) => {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  if (rect.width < minSize || rect.height < minSize) {
    element.style.minWidth = `${minSize}px`;
    element.style.minHeight = `${minSize}px`;
    element.style.display = element.style.display || 'inline-flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
  }
};

/**
 * Handle orientation change
 */
export const handleOrientationChange = (callback) => {
  const handleChange = () => {
    // Small delay to ensure dimensions are updated
    setTimeout(() => {
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      callback(orientation, {
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 100);
  };
  
  window.addEventListener('orientationchange', handleChange);
  window.addEventListener('resize', handleChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('orientationchange', handleChange);
    window.removeEventListener('resize', handleChange);
  };
};

/**
 * Prevent zoom on double tap for specific elements
 */
export const preventZoomOnDoubleTap = (element) => {
  if (!element) return;
  
  let lastTouchEnd = 0;
  element.addEventListener('touchend', (e) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
};

/**
 * Create haptic feedback (if supported)
 */
export const createHapticFeedback = (type = 'light') => {
  if (navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 100, 50]
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
};