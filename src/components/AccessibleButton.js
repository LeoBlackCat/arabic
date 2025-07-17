/**
 * Accessible Button Component
 * Enhanced button with comprehensive accessibility features
 */
import React, { useRef, useEffect, useState } from 'react';
import { ariaUtils, announceToScreenReader, prefersReducedMotion } from '../utils/accessibilityUtils.js';

const AccessibleButton = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  pressed = false,
  expanded = null,
  controls = null,
  describedBy = null,
  labelledBy = null,
  ariaLabel = null,
  announcement = null,
  role = 'button',
  type = 'button',
  ...props
}) => {
  const buttonRef = useRef(null);
  const [isPressed, setIsPressed] = useState(pressed);
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Update ARIA states when props change
  useEffect(() => {
    if (buttonRef.current) {
      if (pressed !== null) {
        ariaUtils.setPressed(buttonRef.current, pressed);
        setIsPressed(pressed);
      }
      if (expanded !== null) {
        ariaUtils.setExpanded(buttonRef.current, expanded);
        setIsExpanded(expanded);
      }
    }
  }, [pressed, expanded]);

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Announce to screen readers if specified
    if (announcement) {
      announceToScreenReader(announcement);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    // Handle Enter and Space for button activation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    select-none
    ${prefersReducedMotion() ? '' : 'hover:scale-105 active:scale-95'}
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
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-pressed={pressed !== null ? isPressed : undefined}
      aria-expanded={expanded !== null ? isExpanded : undefined}
      aria-controls={controls}
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      role={role}
      type={type}
      {...props}
    >
      {loading && (
        <span className="mr-2" aria-hidden="true">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {children}
      {loading && <span className="sr-only">Loading...</span>}
    </button>
  );
};

export default AccessibleButton;