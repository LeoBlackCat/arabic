/**
 * Page Transition Component
 * Smooth transitions between different pages/views
 */
import React, { useState, useEffect, useRef } from 'react';
import { pageTransitions } from '../utils/animationUtils.js';
import { prefersReducedMotion } from '../utils/accessibilityUtils.js';

const PageTransition = ({
  children,
  transitionKey,
  type = 'fade', // 'fade', 'slide', 'scale'
  direction = 'left', // 'left', 'right', 'up', 'down' (for slide)
  duration = 300,
  className = '',
  onTransitionStart = () => {},
  onTransitionEnd = () => {}
}) => {
  const [currentKey, setCurrentKey] = useState(transitionKey);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [nextChildren, setNextChildren] = useState(null);
  
  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (transitionKey !== currentKey && !isTransitioning) {
      startTransition(children);
    }
  }, [transitionKey, currentKey, children, isTransitioning]);

  const startTransition = async (newChildren) => {
    if (prefersReducedMotion()) {
      // Skip animation for reduced motion
      setCurrentChildren(newChildren);
      setCurrentKey(transitionKey);
      return;
    }

    setIsTransitioning(true);
    setNextChildren(newChildren);
    onTransitionStart();

    try {
      // Perform transition based on type
      switch (type) {
        case 'slide':
          await pageTransitions.slide(currentRef.current, nextRef.current, direction, duration);
          break;
        case 'scale':
          await pageTransitions.scale(currentRef.current, nextRef.current, duration);
          break;
        default:
          await pageTransitions.fade(currentRef.current, nextRef.current, duration);
          break;
      }

      // Update state after transition
      setCurrentChildren(newChildren);
      setCurrentKey(transitionKey);
      setNextChildren(null);
    } catch (error) {
      console.error('Page transition error:', error);
      // Fallback to immediate change
      setCurrentChildren(newChildren);
      setCurrentKey(transitionKey);
      setNextChildren(null);
    } finally {
      setIsTransitioning(false);
      onTransitionEnd();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: isTransitioning ? 'auto' : undefined }}
    >
      {/* Current content */}
      <div
        ref={currentRef}
        className={`transition-content ${isTransitioning ? 'absolute inset-0' : ''}`}
        style={{ 
          display: isTransitioning && nextChildren ? 'block' : 'block',
          zIndex: isTransitioning ? 1 : 'auto'
        }}
      >
        {currentChildren}
      </div>

      {/* Next content (during transition) */}
      {nextChildren && (
        <div
          ref={nextRef}
          className="transition-content absolute inset-0"
          style={{ 
            display: 'block',
            zIndex: 2
          }}
        >
          {nextChildren}
        </div>
      )}

      {/* Loading overlay during transition */}
      {isTransitioning && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 border-2 border-neutral-300 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PageTransition;