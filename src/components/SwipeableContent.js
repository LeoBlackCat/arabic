/**
 * Swipeable Content Component
 * Enables swipe navigation between content items
 */
import React, { useRef, useEffect, useState } from 'react';
import { TouchGestureDetector, createHapticFeedback } from '../utils/touchUtils.js';

const SwipeableContent = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  enableSwipe = true,
  swipeThreshold = 50,
  showSwipeIndicators = false
}) => {
  const containerRef = useRef(null);
  const gestureDetectorRef = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (enableSwipe && containerRef.current) {
      gestureDetectorRef.current = new TouchGestureDetector(containerRef.current, {
        threshold: swipeThreshold,
        onSwipe: (direction, details) => {
          if (isTransitioning) return;
          
          setSwipeDirection(direction);
          setIsTransitioning(true);
          
          createHapticFeedback('light');
          
          if (direction === 'left' && onSwipeLeft) {
            onSwipeLeft();
          } else if (direction === 'right' && onSwipeRight) {
            onSwipeRight();
          }
          
          // Reset after animation
          setTimeout(() => {
            setSwipeDirection(null);
            setIsTransitioning(false);
          }, 300);
        }
      });
    }

    return () => {
      if (gestureDetectorRef.current) {
        gestureDetectorRef.current.destroy();
      }
    };
  }, [enableSwipe, swipeThreshold, onSwipeLeft, onSwipeRight, isTransitioning]);

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden
        ${enableSwipe ? 'touch-pan-y' : ''}
        ${swipeDirection === 'left' ? 'animate-slide-left' : ''}
        ${swipeDirection === 'right' ? 'animate-slide-right' : ''}
        ${className}
      `}
      style={{
        touchAction: enableSwipe ? 'pan-y' : 'auto'
      }}
    >
      {/* Swipe Indicators */}
      {showSwipeIndicators && enableSwipe && (
        <>
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 opacity-30">
            <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-neutral-600">←</span>
            </div>
          </div>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 opacity-30">
            <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-neutral-600">→</span>
            </div>
          </div>
        </>
      )}
      
      {/* Content */}
      <div className={`transition-transform duration-300 ease-out ${isTransitioning ? 'scale-95' : 'scale-100'}`}>
        {children}
      </div>
    </div>
  );
};

export default SwipeableContent;