/**
 * Touch Optimized Button Component
 * Button component optimized for mobile touch interactions
 */
import React, { useRef, useEffect } from 'react';
import { optimizeTouchTarget, createHapticFeedback, preventZoomOnDoubleTap } from '../utils/touchUtils.js';

const TouchOptimizedButton = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  hapticFeedback = true,
  preventDoubleClick = true,
  minTouchSize = 44,
  ...props
}) => {
  const buttonRef = useRef(null);
  const lastClickTime = useRef(0);

  useEffect(() => {
    if (buttonRef.current) {
      optimizeTouchTarget(buttonRef.current, minTouchSize);
      if (preventDoubleClick) {
        preventZoomOnDoubleTap(buttonRef.current);
      }
    }
  }, [minTouchSize, preventDoubleClick]);

  const handleClick = (e) => {
    if (disabled) return;
    
    // Prevent rapid double clicks
    const now = Date.now();
    if (preventDoubleClick && now - lastClickTime.current < 300) {
      return;
    }
    lastClickTime.current = now;
    
    // Haptic feedback
    if (hapticFeedback) {
      createHapticFeedback('light');
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    select-none
  `;

  const variantClasses = {
    primary: `
      bg-primary text-white
      hover:bg-primary-600 active:bg-primary-700
      focus:ring-primary-500
      shadow-lg hover:shadow-xl
    `,
    secondary: `
      bg-white text-neutral-700 border border-neutral-300
      hover:bg-neutral-50 active:bg-neutral-100
      focus:ring-neutral-500
      shadow-md hover:shadow-lg
    `,
    ghost: `
      bg-transparent text-neutral-700
      hover:bg-neutral-100 active:bg-neutral-200
      focus:ring-neutral-500
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600 active:bg-red-700
      focus:ring-red-500
      shadow-lg hover:shadow-xl
    `
  };

  const sizeClasses = {
    small: 'px-3 py-2 text-sm min-h-[36px]',
    medium: 'px-4 py-3 text-base min-h-[44px]',
    large: 'px-6 py-4 text-lg min-h-[52px]'
  };

  return (
    <button
      ref={buttonRef}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default TouchOptimizedButton;