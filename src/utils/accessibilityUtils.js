/**
 * Accessibility Utilities
 * Helper functions for enhanced accessibility features
 */

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Announce text to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) firstElement.focus();

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Save and restore focus
   */
  saveFocus: () => {
    const activeElement = document.activeElement;
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },

  /**
   * Focus first focusable element in container
   */
  focusFirst: (container) => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
  }
};

/**
 * Keyboard navigation utilities
 */
export const keyboardUtils = {
  /**
   * Handle arrow key navigation in a list
   */
  handleArrowNavigation: (event, items, currentIndex, onIndexChange) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % items.length;
        event.preventDefault();
        break;
      case 'ArrowUp':
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        event.preventDefault();
        break;
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
      default:
        return;
    }
    
    onIndexChange(newIndex);
    if (items[newIndex]) {
      items[newIndex].focus();
    }
  },

  /**
   * Handle escape key
   */
  handleEscape: (event, callback) => {
    if (event.key === 'Escape') {
      callback();
    }
  }
};

/**
 * ARIA utilities
 */
export const ariaUtils = {
  /**
   * Generate unique ID for ARIA relationships
   */
  generateId: (prefix = 'aria') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Set ARIA expanded state
   */
  setExpanded: (element, expanded) => {
    element.setAttribute('aria-expanded', expanded.toString());
  },

  /**
   * Set ARIA selected state
   */
  setSelected: (element, selected) => {
    element.setAttribute('aria-selected', selected.toString());
  },

  /**
   * Set ARIA pressed state
   */
  setPressed: (element, pressed) => {
    element.setAttribute('aria-pressed', pressed.toString());
  },

  /**
   * Update ARIA live region
   */
  updateLiveRegion: (regionId, message, priority = 'polite') => {
    const region = document.getElementById(regionId);
    if (region) {
      region.setAttribute('aria-live', priority);
      region.textContent = message;
    }
  }
};

/**
 * Color contrast utilities
 */
export const contrastUtils = {
  /**
   * Calculate relative luminance
   */
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1, color2) => {
    const l1 = contrastUtils.getLuminance(...color1);
    const l2 = contrastUtils.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAG: (ratio, level = 'AA', size = 'normal') => {
    const requirements = {
      'AA': { normal: 4.5, large: 3 },
      'AAA': { normal: 7, large: 4.5 }
    };
    return ratio >= requirements[level][size];
  }
};

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  /**
   * Create screen reader only text
   */
  createSROnlyText: (text) => {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  },

  /**
   * Add screen reader description
   */
  addDescription: (element, description) => {
    const descId = ariaUtils.generateId('desc');
    const descElement = screenReaderUtils.createSROnlyText(description);
    descElement.id = descId;
    
    element.parentNode.insertBefore(descElement, element.nextSibling);
    element.setAttribute('aria-describedby', descId);
    
    return descId;
  },

  /**
   * Add screen reader label
   */
  addLabel: (element, label) => {
    const labelId = ariaUtils.generateId('label');
    const labelElement = screenReaderUtils.createSROnlyText(label);
    labelElement.id = labelId;
    
    element.parentNode.insertBefore(labelElement, element);
    element.setAttribute('aria-labelledby', labelId);
    
    return labelId;
  }
};

/**
 * Motion utilities
 */
export const motionUtils = {
  /**
   * Apply animation with reduced motion support
   */
  safeAnimate: (element, animation, options = {}) => {
    if (prefersReducedMotion()) {
      // Skip animation or use reduced version
      if (options.reducedMotionFallback) {
        options.reducedMotionFallback(element);
      }
      return;
    }
    
    // Apply full animation
    if (typeof animation === 'string') {
      element.style.animation = animation;
    } else if (typeof animation === 'function') {
      animation(element);
    }
  },

  /**
   * Create reduced motion CSS class
   */
  getMotionClass: (normalClass, reducedClass = '') => {
    return prefersReducedMotion() ? reducedClass : normalClass;
  }
};