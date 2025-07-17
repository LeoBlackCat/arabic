/**
 * Skip Link Component
 * Allows keyboard users to skip to main content
 */
import React from 'react';

const SkipLink = ({ 
  href = '#main-content', 
  children = 'Skip to main content',
  className = ''
}) => {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-50
        bg-primary text-white
        px-4 py-2 rounded-lg
        font-medium text-sm
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        transition-all duration-200
        ${className}
      `}
      onFocus={(e) => {
        // Ensure the link is visible when focused
        e.target.classList.remove('sr-only');
      }}
      onBlur={(e) => {
        // Hide the link when focus is lost
        e.target.classList.add('sr-only');
      }}
    >
      {children}
    </a>
  );
};

export default SkipLink;