/**
 * Themed Button Component
 * Button component that adapts to current theme
 */
import React, { useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider.js';

const ThemedButton = ({
  children,
  className = '',
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost'
  size = 'medium',
  disabled = false,
  loading = false,
  onClick = null,
  ...props
}) => {
  const { currentTheme, applyThemeToElement, isTransitioning } = useTheme();
  const buttonRef = useRef(null);

  // Apply theme when theme changes
  useEffect(() => {
    if (buttonRef.current) {
      applyThemeToElement(buttonRef.current, { smooth: true });
    }
  }, [currentTheme, applyThemeToElement]);

  const getVariantClasses = () => {
    const baseClasses = 'btn theme-transition';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} btn-themed`;
      case 'secondary':
        return `${baseClasses} bg-themed-secondary text-white hover:bg-themed-accent`;
      case 'outline':
        return `${baseClasses} btn-themed-outline`;
      case 'ghost':
        return `${baseClasses} bg-transparent text-themed-primary hover:bg-themed-subtle`;
      default:
        return `${baseClasses} btn-themed`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2 text-sm min-h-[36px]';
      case 'large':
        return 'px-6 py-4 text-lg min-h-[52px]';
      default:
        return 'px-4 py-3 text-base min-h-[44px]';
    }
  };

  return (
    <button
      ref={buttonRef}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${isTransitioning ? 'theme-change-animation' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
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

export default ThemedButton;