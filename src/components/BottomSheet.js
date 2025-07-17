/**
 * Bottom Sheet Component
 * Modern mobile-first modal that slides up from the bottom
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TouchGestureDetector, createHapticFeedback } from '../utils/touchUtils.js';

const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto',
  maxHeight = '90vh',
  className = '',
  showHandle = true,
  closeOnBackdrop = true,
  closeOnSwipeDown = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef(null);
  const gestureDetectorRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
      
      // Add safe area padding
      if (sheetRef.current) {
        sheetRef.current.style.paddingBottom = 'max(1rem, env(safe-area-inset-bottom))';
      }
      
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        document.body.style.overflow = '';
      }, 300);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isVisible && sheetRef.current && closeOnSwipeDown) {
      gestureDetectorRef.current = new TouchGestureDetector(sheetRef.current, {
        onSwipe: (direction) => {
          if (direction === 'down') {
            createHapticFeedback('light');
            onClose();
          }
        },
        threshold: 100
      });
    }

    return () => {
      if (gestureDetectorRef.current) {
        gestureDetectorRef.current.destroy();
      }
    };
  }, [isVisible, closeOnSwipeDown, onClose]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      createHapticFeedback('light');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isVisible) return null;

  const bottomSheetContent = (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center ${
        isOpen ? 'animate-fade-in' : 'animate-fade-out'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`
          relative w-full max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        style={{
          height: height === 'auto' ? 'auto' : height,
          maxHeight: maxHeight
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-neutral-300 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(bottomSheetContent, document.body);
};

export default BottomSheet;