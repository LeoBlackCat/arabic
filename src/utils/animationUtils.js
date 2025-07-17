/**
 * Animation Utilities for Modern UI Design System
 * Provides helper functions for managing animations with accessibility considerations
 */

import { prefersReducedMotion, getAnimationDuration, getAnimationEasing } from './themeUtils.js';

/**
 * Animation presets for common UI interactions
 */
export const ANIMATION_PRESETS = {
  // Entrance animations
  fadeIn: {
    keyframes: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    options: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }
  },
  
  fadeInUp: {
    keyframes: [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    options: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }
  },
  
  scaleIn: {
    keyframes: [
      { opacity: 0, transform: 'scale(0.95)' },
      { opacity: 1, transform: 'scale(1)' }
    ],
    options: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }
  },
  
  slideInRight: {
    keyframes: [
      { opacity: 0, transform: 'translateX(30px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ],
    options: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }
  },
  
  // Feedback animations
  celebration: {
    keyframes: [
      { transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.05) rotate(-2deg)' },
      { transform: 'scale(1.05) rotate(2deg)' },
      { transform: 'scale(1) rotate(0deg)' }
    ],
    options: {
      duration: 500,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      fill: 'forwards'
    }
  },
  
  shake: {
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' }
    ],
    options: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }
  },
  
  pulse: {
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    options: {
      duration: 1000,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      iterationCount: Infinity
    }
  },
  
  // Hover effects
  hoverLift: {
    keyframes: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-2px) scale(1.02)' }
    ],
    options: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }
  },
  
  hoverGlow: {
    keyframes: [
      { boxShadow: '0 0 0 rgba(14, 165, 233, 0)' },
      { boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' }
    ],
    options: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }
  }
};

/**
 * Animate an element using Web Animations API with accessibility considerations
 * @param {HTMLElement} element - The element to animate
 * @param {string} presetName - Name of the animation preset
 * @param {object} customOptions - Custom animation options to override defaults
 * @returns {Animation} The Web Animation object
 */
export const animateElement = (element, presetName, customOptions = {}) => {
  if (!element || prefersReducedMotion()) {
    return null;
  }
  
  const preset = ANIMATION_PRESETS[presetName];
  if (!preset) {
    console.warn(`Animation preset "${presetName}" not found`);
    return null;
  }
  
  const options = {
    ...preset.options,
    ...customOptions
  };
  
  try {
    return element.animate(preset.keyframes, options);
  } catch (error) {
    console.error('Animation failed:', error);
    return null;
  }
};

/**
 * Create a staggered animation for multiple elements
 * @param {NodeList|Array} elements - Elements to animate
 * @param {string} presetName - Animation preset name
 * @param {number} staggerDelay - Delay between each element in milliseconds
 * @param {object} customOptions - Custom animation options
 * @returns {Array} Array of Animation objects
 */
export const staggerAnimation = (elements, presetName, staggerDelay = 100, customOptions = {}) => {
  if (!elements || prefersReducedMotion()) {
    return [];
  }
  
  const animations = [];
  const elementsArray = Array.from(elements);
  
  elementsArray.forEach((element, index) => {
    const delay = index * staggerDelay;
    const options = {
      ...customOptions,
      delay
    };
    
    const animation = animateElement(element, presetName, options);
    if (animation) {
      animations.push(animation);
    }
  });
  
  return animations;
};

/**
 * Create a loading skeleton animation
 * @param {HTMLElement} element - The element to apply skeleton animation to
 * @returns {Animation} The skeleton animation
 */
export const createSkeletonAnimation = (element) => {
  if (!element || prefersReducedMotion()) {
    return null;
  }
  
  const keyframes = [
    { backgroundPosition: '-200px 0' },
    { backgroundPosition: 'calc(200px + 100%) 0' }
  ];
  
  const options = {
    duration: 1500,
    easing: 'ease-in-out',
    iterationCount: Infinity
  };
  
  // Apply skeleton background
  element.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
  element.style.backgroundSize = '200px 100%';
  element.style.backgroundRepeat = 'no-repeat';
  
  return element.animate(keyframes, options);
};

/**
 * Animate progress bar or ring
 * @param {HTMLElement} element - Progress element
 * @param {number} fromValue - Starting percentage (0-100)
 * @param {number} toValue - Target percentage (0-100)
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Animation} The progress animation
 */
export const animateProgress = (element, fromValue, toValue, duration = 1000) => {
  if (!element || prefersReducedMotion()) {
    // Set final value immediately if reduced motion
    if (element.style.width !== undefined) {
      element.style.width = `${toValue}%`;
    }
    return null;
  }
  
  const keyframes = [
    { width: `${fromValue}%` },
    { width: `${toValue}%` }
  ];
  
  const options = {
    duration,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards'
  };
  
  return element.animate(keyframes, options);
};

/**
 * Create a particle effect for celebrations
 * @param {HTMLElement} container - Container element for particles
 * @param {object} config - Particle configuration
 */
export const createParticleEffect = (container, config = {}) => {
  if (!container || prefersReducedMotion()) {
    return;
  }
  
  const defaultConfig = {
    particleCount: 20,
    colors: ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'],
    duration: 2000,
    spread: 100
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  for (let i = 0; i < finalConfig.particleCount; i++) {
    createParticle(container, finalConfig, i);
  }
};

/**
 * Create a single particle for the particle effect
 * @param {HTMLElement} container - Container element
 * @param {object} config - Particle configuration
 * @param {number} index - Particle index
 */
const createParticle = (container, config, index) => {
  const particle = document.createElement('div');
  particle.style.position = 'absolute';
  particle.style.width = '6px';
  particle.style.height = '6px';
  particle.style.borderRadius = '50%';
  particle.style.backgroundColor = config.colors[index % config.colors.length];
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '1000';
  
  // Random starting position
  const startX = Math.random() * container.offsetWidth;
  const startY = Math.random() * container.offsetHeight;
  particle.style.left = `${startX}px`;
  particle.style.top = `${startY}px`;
  
  container.appendChild(particle);
  
  // Animate particle
  const angle = (Math.random() * 2 - 1) * config.spread;
  const velocity = 50 + Math.random() * 100;
  const endX = startX + Math.cos(angle * Math.PI / 180) * velocity;
  const endY = startY + Math.sin(angle * Math.PI / 180) * velocity;
  
  const keyframes = [
    { 
      transform: 'translate(0, 0) scale(1)', 
      opacity: 1 
    },
    { 
      transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, 
      opacity: 0 
    }
  ];
  
  const options = {
    duration: config.duration,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    fill: 'forwards'
  };
  
  const animation = particle.animate(keyframes, options);
  
  // Clean up particle after animation
  animation.addEventListener('finish', () => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  });
};

/**
 * Animate page transitions
 * @param {HTMLElement} exitElement - Element leaving the page
 * @param {HTMLElement} enterElement - Element entering the page
 * @param {string} direction - Transition direction ('left', 'right', 'up', 'down')
 * @returns {Promise} Promise that resolves when transition completes
 */
export const animatePageTransition = (exitElement, enterElement, direction = 'right') => {
  if (prefersReducedMotion()) {
    if (exitElement) exitElement.style.display = 'none';
    if (enterElement) enterElement.style.display = 'block';
    return Promise.resolve();
  }
  
  const directionMap = {
    right: { exit: 'translateX(-100%)', enter: 'translateX(100%)' },
    left: { exit: 'translateX(100%)', enter: 'translateX(-100%)' },
    up: { exit: 'translateY(-100%)', enter: 'translateY(100%)' },
    down: { exit: 'translateY(100%)', enter: 'translateY(-100%)' }
  };
  
  const transforms = directionMap[direction] || directionMap.right;
  
  const promises = [];
  
  // Exit animation
  if (exitElement) {
    const exitKeyframes = [
      { transform: 'translateX(0)', opacity: 1 },
      { transform: transforms.exit, opacity: 0 }
    ];
    
    const exitOptions = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    };
    
    const exitAnimation = exitElement.animate(exitKeyframes, exitOptions);
    promises.push(new Promise(resolve => {
      exitAnimation.addEventListener('finish', resolve);
    }));
  }
  
  // Enter animation
  if (enterElement) {
    const enterKeyframes = [
      { transform: transforms.enter, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ];
    
    const enterOptions = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
      delay: 150 // Start enter animation halfway through exit
    };
    
    const enterAnimation = enterElement.animate(enterKeyframes, enterOptions);
    promises.push(new Promise(resolve => {
      enterAnimation.addEventListener('finish', resolve);
    }));
  }
  
  return Promise.all(promises);
};

/**
 * Create a ripple effect on click
 * @param {HTMLElement} element - Element to add ripple effect to
 * @param {Event} event - Click event
 */
export const createRippleEffect = (element, event) => {
  if (!element || prefersReducedMotion()) {
    return;
  }
  
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  const ripple = document.createElement('div');
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(255, 255, 255, 0.6)';
  ripple.style.transform = 'scale(0)';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.pointerEvents = 'none';
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  const keyframes = [
    { transform: 'scale(0)', opacity: 1 },
    { transform: 'scale(1)', opacity: 0 }
  ];
  
  const options = {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards'
  };
  
  const animation = ripple.animate(keyframes, options);
  
  animation.addEventListener('finish', () => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  });
};

/**
 * Trigger a celebration animation with particles and effects
 * @param {HTMLElement} element - The element to celebrate on
 * @param {string} type - The type of celebration ('success', 'achievement', 'streak')
 * @param {Object} options - Additional options for the celebration
 */
export const triggerCelebration = (element, type = 'success', options = {}) => {
  if (!element || prefersReducedMotion()) return;
  
  const celebrationConfig = {
    success: {
      particles: { count: 20, colors: ['#10b981', '#34d399', '#6ee7b7'] },
      scale: { from: 1, to: 1.1 },
      duration: 800
    },
    achievement: {
      particles: { count: 30, colors: ['#f59e0b', '#fbbf24', '#fde047'] },
      scale: { from: 1, to: 1.2 },
      duration: 1000
    },
    streak: {
      particles: { count: 15, colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'] },
      scale: { from: 1, to: 1.15 },
      duration: 600
    }
  };
  
  const config = celebrationConfig[type] || celebrationConfig.success;
  
  // Create particle effect
  createParticleEffect(element, {
    ...config.particles,
    ...options.particles
  });
  
  // Scale animation
  const scaleAnimation = element.animate([
    { transform: 'scale(1)' },
    { transform: `scale(${config.scale.to})` },
    { transform: 'scale(1)' }
  ], {
    duration: config.duration,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  });
  
  return scaleAnimation;
};