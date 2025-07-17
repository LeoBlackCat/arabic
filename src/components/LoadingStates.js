/**
 * Loading States Components
 * Organic loading animations and skeleton states
 */
import React from 'react';
import { prefersReducedMotion } from '../utils/accessibilityUtils.js';

/**
 * Skeleton Loading Component
 */
export const SkeletonLoader = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  variant = 'text', // 'text', 'circular', 'rectangular'
  animation = true
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      default:
        return 'rounded';
    }
  };

  return (
    <div
      className={`
        skeleton
        ${getVariantClasses()}
        ${animation && !prefersReducedMotion() ? 'animate-skeleton' : ''}
        ${className}
      `}
      style={{ width, height }}
      aria-label="Loading content"
      role="status"
    />
  );
};

/**
 * Loading Dots Component
 */
export const LoadingDots = ({ 
  className = '', 
  size = 'medium', // 'small', 'medium', 'large'
  color = 'primary',
  count = 3
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-1 h-1';
      case 'large':
        return 'w-3 h-3';
      default:
        return 'w-2 h-2';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'secondary':
        return 'bg-secondary';
      case 'neutral':
        return 'bg-neutral-400';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            ${getSizeClasses()}
            ${getColorClasses()}
            rounded-full
            ${!prefersReducedMotion() ? 'animate-loading-dots' : ''}
          `}
          style={{
            animationDelay: !prefersReducedMotion() ? `${index * 0.16}s` : '0s'
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Spinner Component
 */
export const Spinner = ({ 
  className = '', 
  size = 'medium', // 'small', 'medium', 'large'
  color = 'primary'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4 border-2';
      case 'large':
        return 'w-8 h-8 border-4';
      default:
        return 'w-6 h-6 border-2';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'secondary':
        return 'border-neutral-200 border-t-secondary';
      case 'white':
        return 'border-white/20 border-t-white';
      default:
        return 'border-neutral-200 border-t-primary';
    }
  };

  return (
    <div
      className={`
        ${getSizeClasses()}
        ${getColorClasses()}
        rounded-full
        ${!prefersReducedMotion() ? 'animate-spin' : ''}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ 
  className = '', 
  progress = 0, // 0-100
  variant = 'default', // 'default', 'themed', 'gradient'
  size = 'medium', // 'small', 'medium', 'large'
  showLabel = false,
  label = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'h-1';
      case 'large':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'themed':
        return 'bg-themed-primary';
      case 'gradient':
        return 'bg-themed-gradient';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={className} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-neutral-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-neutral-500">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className={`progress-bar ${getSizeClasses()}`}>
        <div
          className={`progress-fill ${getVariantClasses()} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Pulse Loading Component
 */
export const PulseLoader = ({ 
  className = '', 
  children,
  intensity = 'medium' // 'light', 'medium', 'strong'
}) => {
  const getIntensityClasses = () => {
    switch (intensity) {
      case 'light':
        return 'animate-pulse opacity-70';
      case 'strong':
        return 'animate-pulse opacity-50';
      default:
        return 'animate-pulse opacity-60';
    }
  };

  return (
    <div
      className={`
        ${!prefersReducedMotion() ? getIntensityClasses() : 'opacity-70'}
        ${className}
      `}
      role="status"
      aria-label="Loading content"
    >
      {children}
    </div>
  );
};

/**
 * Card Skeleton Component
 */
export const CardSkeleton = ({ className = '', showAvatar = false }) => {
  return (
    <div className={`card p-6 ${className}`} role="status" aria-label="Loading card content">
      <div className="space-y-4">
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <SkeletonLoader variant="circular" width="3rem" height="3rem" />
            <div className="space-y-2 flex-1">
              <SkeletonLoader height="1rem" width="60%" />
              <SkeletonLoader height="0.75rem" width="40%" />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <SkeletonLoader height="1.5rem" width="80%" />
          <SkeletonLoader height="1rem" width="100%" />
          <SkeletonLoader height="1rem" width="90%" />
          <SkeletonLoader height="1rem" width="70%" />
        </div>
        <div className="flex space-x-2">
          <SkeletonLoader variant="rectangular" width="5rem" height="2rem" />
          <SkeletonLoader variant="rectangular" width="4rem" height="2rem" />
        </div>
      </div>
    </div>
  );
};

/**
 * List Skeleton Component
 */
export const ListSkeleton = ({ 
  className = '', 
  itemCount = 5,
  showAvatar = true 
}) => {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading list content">
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          {showAvatar && (
            <SkeletonLoader variant="circular" width="2.5rem" height="2.5rem" />
          )}
          <div className="space-y-2 flex-1">
            <SkeletonLoader height="1rem" width="70%" />
            <SkeletonLoader height="0.75rem" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Organic Loading Animation Component
 */
export const OrganicLoader = ({ 
  className = '', 
  type = 'wave', // 'wave', 'bounce', 'pulse'
  color = 'primary'
}) => {
  const getColorClass = () => {
    switch (color) {
      case 'secondary':
        return 'text-secondary';
      case 'neutral':
        return 'text-neutral-400';
      default:
        return 'text-primary';
    }
  };

  if (type === 'wave') {
    return (
      <div className={`flex items-center space-x-1 ${getColorClass()} ${className}`} role="status" aria-label="Loading">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`w-1 bg-current rounded-full ${!prefersReducedMotion() ? 'animate-bounce' : ''}`}
            style={{
              height: '1rem',
              animationDelay: !prefersReducedMotion() ? `${index * 0.1}s` : '0s',
              animationDuration: '0.6s'
            }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (type === 'bounce') {
    return (
      <div className={`flex items-center space-x-2 ${getColorClass()} ${className}`} role="status" aria-label="Loading">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 bg-current rounded-full ${!prefersReducedMotion() ? 'animate-bounce' : ''}`}
            style={{
              animationDelay: !prefersReducedMotion() ? `${index * 0.2}s` : '0s'
            }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Default pulse type
  return (
    <div className={`${getColorClass()} ${className}`} role="status" aria-label="Loading">
      <div className={`w-8 h-8 bg-current rounded-full ${!prefersReducedMotion() ? 'animate-pulse' : ''}`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};