/**
 * Animation Utilities
 * Enhanced animation system with page transitions and loading states
 */

import { prefersReducedMotion } from './accessibilityUtils.js';

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  durations: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800
  },
  easings: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  }
};

/**
 * Create ripple effect on element
 */
export const createRippleEffect = (element, event) => {
  if (prefersReducedMotion()) return;
  
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
    z-index: 1000;
  `;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 600);
};

/**
 * Animate element with specified animation
 */
export const animateElement = (element, animation, options = {}) => {
  if (!element || prefersReducedMotion()) {
    if (options.onComplete) options.onComplete();
    return Promise.resolve();
  }
  
  const {
    duration = ANIMATION_CONFIG.durations.normal,
    easing = ANIMATION_CONFIG.easings.smooth,
    delay = 0,
    onComplete = null
  } = options;
  
  return new Promise((resolve) => {
    const animationName = typeof animation === 'string' ? animation : 'custom';
    
    element.style.animation = `${animationName} ${duration}ms ${easing} ${delay}ms both`;
    
    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      element.style.animation = '';
      if (onComplete) onComplete();
      resolve();
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
    
    // Fallback timeout
    setTimeout(() => {
      handleAnimationEnd();
    }, duration + delay + 100);
  });
};

/**
 * Stagger animation for multiple elements
 */
export const staggerAnimation = (elements, animation, staggerDelay = 100, options = {}) => {
  if (!elements || elements.length === 0) return Promise.resolve();
  
  const promises = Array.from(elements).map((element, index) => {
    return animateElement(element, animation, {
      ...options,
      delay: (options.delay || 0) + (index * staggerDelay)
    });
  });
  
  return Promise.all(promises);
};

/**
 * Page transition animations
 */
export const pageTransitions = {
  /**
   * Slide transition between pages
   */
  slide: (fromElement, toElement, direction = 'left', duration = 300) => {
    if (prefersReducedMotion()) {
      if (fromElement) fromElement.style.display = 'none';
      if (toElement) toElement.style.display = 'block';
      return Promise.resolve();
    }
    
    const translateFrom = direction === 'left' ? '-100%' : '100%';
    const translateTo = direction === 'left' ? '100%' : '-100%';
    
    return new Promise((resolve) => {
      // Prepare elements
      if (toElement) {
        toElement.style.transform = `translateX(${translateFrom})`;
        toElement.style.display = 'block';
      }
      
      // Animate out current page
      if (fromElement) {
        fromElement.style.transition = `transform ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
        fromElement.style.transform = `translateX(${translateTo})`;
      }
      
      // Animate in new page
      if (toElement) {
        setTimeout(() => {
          toElement.style.transition = `transform ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
          toElement.style.transform = 'translateX(0)';
        }, 50);
      }
      
      // Cleanup
      setTimeout(() => {
        if (fromElement) {
          fromElement.style.display = 'none';
          fromElement.style.transform = '';
          fromElement.style.transition = '';
        }
        if (toElement) {
          toElement.style.transform = '';
          toElement.style.transition = '';
        }
        resolve();
      }, duration + 100);
    });
  },
  
  /**
   * Fade transition between pages
   */
  fade: (fromElement, toElement, duration = 300) => {
    if (prefersReducedMotion()) {
      if (fromElement) fromElement.style.display = 'none';
      if (toElement) toElement.style.display = 'block';
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // Prepare elements
      if (toElement) {
        toElement.style.opacity = '0';
        toElement.style.display = 'block';
      }
      
      // Fade out current page
      if (fromElement) {
        fromElement.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
        fromElement.style.opacity = '0';
      }
      
      // Fade in new page
      setTimeout(() => {
        if (toElement) {
          toElement.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
          toElement.style.opacity = '1';
        }
      }, duration / 2);
      
      // Cleanup
      setTimeout(() => {
        if (fromElement) {
          fromElement.style.display = 'none';
          fromElement.style.opacity = '';
          fromElement.style.transition = '';
        }
        if (toElement) {
          toElement.style.opacity = '';
          toElement.style.transition = '';
        }
        resolve();
      }, duration + 100);
    });
  },
  
  /**
   * Scale transition between pages
   */
  scale: (fromElement, toElement, duration = 300) => {
    if (prefersReducedMotion()) {
      if (fromElement) fromElement.style.display = 'none';
      if (toElement) toElement.style.display = 'block';
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // Prepare elements
      if (toElement) {
        toElement.style.transform = 'scale(0.8)';
        toElement.style.opacity = '0';
        toElement.style.display = 'block';
      }
      
      // Scale out current page
      if (fromElement) {
        fromElement.style.transition = `all ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
        fromElement.style.transform = 'scale(1.1)';
        fromElement.style.opacity = '0';
      }
      
      // Scale in new page
      setTimeout(() => {
        if (toElement) {
          toElement.style.transition = `all ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
          toElement.style.transform = 'scale(1)';
          toElement.style.opacity = '1';
        }
      }, duration / 2);
      
      // Cleanup
      setTimeout(() => {
        if (fromElement) {
          fromElement.style.display = 'none';
          fromElement.style.transform = '';
          fromElement.style.opacity = '';
          fromElement.style.transition = '';
        }
        if (toElement) {
          toElement.style.transform = '';
          toElement.style.opacity = '';
          toElement.style.transition = '';
        }
        resolve();
      }, duration + 100);
    });
  }
};

/**
 * Loading animation utilities
 */
export const loadingAnimations = {
  /**
   * Create skeleton loading animation
   */
  skeleton: (element, options = {}) => {
    if (!element) return;
    
    const {
      baseColor = '#f3f4f6',
      highlightColor = '#e5e7eb',
      duration = 1500
    } = options;
    
    element.style.background = `linear-gradient(90deg, ${baseColor} 25%, ${highlightColor} 50%, ${baseColor} 75%)`;
    element.style.backgroundSize = '200% 100%';
    element.style.animation = prefersReducedMotion() ? 'none' : `skeleton ${duration}ms ease-in-out infinite`;
  },
  
  /**
   * Create pulse loading animation
   */
  pulse: (element, options = {}) => {
    if (!element || prefersReducedMotion()) return;
    
    const {
      scale = 1.05,
      duration = 1000
    } = options;
    
    element.style.animation = `pulse ${duration}ms ease-in-out infinite`;
    element.style.setProperty('--pulse-scale', scale);
  },
  
  /**
   * Create organic loading dots
   */
  dots: (container, options = {}) => {
    if (!container) return;
    
    const {
      count = 3,
      size = 8,
      color = '#3b82f6',
      spacing = 4
    } = options;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = `${spacing}px`;
    
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        animation: ${prefersReducedMotion() ? 'none' : `loadingDot 1.4s ease-in-out infinite`};
        animation-delay: ${i * 0.16}s;
      `;
      container.appendChild(dot);
    }
  }
};

/**
 * Celebration and feedback animations
 */
export const celebrationAnimations = {
  /**
   * Create particle effect
   */
  particles: (container, options = {}) => {
    if (!container || prefersReducedMotion()) return;
    
    const {
      count = 20,
      colors = ['#fbbf24', '#f59e0b', '#d97706'],
      duration = 2000
    } = options;
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 6 + 4;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${x}%;
        top: ${y}%;
        animation: particle ${duration}ms ease-out forwards;
        pointer-events: none;
        z-index: 1000;
      `;
      
      container.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, duration);
    }
  },
  
  /**
   * Create confetti effect
   */
  confetti: (container, options = {}) => {
    if (!container || prefersReducedMotion()) return;
    
    const {
      count = 50,
      colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
      duration = 3000
    } = options;
    
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;
      const x = Math.random() * 100;
      const rotation = Math.random() * 360;
      
      confetti.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${x}%;
        top: -10px;
        transform: rotate(${rotation}deg);
        animation: confetti ${duration}ms ease-out forwards;
        pointer-events: none;
        z-index: 1000;
      `;
      
      container.appendChild(confetti);
      
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, duration);
    }
  }
};

/**
 * Modal and overlay animations
 */
export const modalAnimations = {
  /**
   * Show modal with backdrop
   */
  show: (modal, backdrop, options = {}) => {
    if (!modal) return Promise.resolve();
    
    const {
      duration = 300,
      backdropOpacity = 0.5
    } = options;
    
    if (prefersReducedMotion()) {
      modal.style.display = 'block';
      if (backdrop) backdrop.style.display = 'block';
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // Show elements
      modal.style.display = 'block';
      if (backdrop) backdrop.style.display = 'block';
      
      // Animate backdrop
      if (backdrop) {
        backdrop.style.opacity = '0';
        backdrop.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
        setTimeout(() => {
          backdrop.style.opacity = backdropOpacity;
        }, 10);
      }
      
      // Animate modal
      modal.style.opacity = '0';
      modal.style.transform = 'scale(0.9) translateY(-10px)';
      modal.style.transition = `all ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
      
      setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1) translateY(0)';
      }, 10);
      
      setTimeout(resolve, duration + 50);
    });
  },
  
  /**
   * Hide modal with backdrop
   */
  hide: (modal, backdrop, options = {}) => {
    if (!modal) return Promise.resolve();
    
    const {
      duration = 300
    } = options;
    
    if (prefersReducedMotion()) {
      modal.style.display = 'none';
      if (backdrop) backdrop.style.display = 'none';
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // Animate modal
      modal.style.transition = `all ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
      modal.style.opacity = '0';
      modal.style.transform = 'scale(0.9) translateY(-10px)';
      
      // Animate backdrop
      if (backdrop) {
        backdrop.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easings.smooth}`;
        backdrop.style.opacity = '0';
      }
      
      setTimeout(() => {
        modal.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
        
        // Reset styles
        modal.style.opacity = '';
        modal.style.transform = '';
        modal.style.transition = '';
        if (backdrop) {
          backdrop.style.opacity = '';
          backdrop.style.transition = '';
        }
        
        resolve();
      }, duration + 50);
    });
  }
};

/**
 * Utility functions
 */
export const createParticleEffect = (container, options = {}) => {
  celebrationAnimations.particles(container, options);
};

export const triggerCelebration = (element, type = 'particles') => {
  if (type === 'confetti') {
    celebrationAnimations.confetti(element);
  } else {
    celebrationAnimations.particles(element);
  }
};