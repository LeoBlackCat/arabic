import React from 'react';

/**
 * ArabicText Component
 * Renders Arabic text with proper RTL direction and styling
 */
export const ArabicText = ({ children, size = 'md', className = '', ...props }) => {
  const getSizeClasses = (size) => {
    switch (size) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      default: return 'text-base';
    }
  };

  return (
    <span 
      className={`arabic ${getSizeClasses(size)} ${className}`}
      style={{ direction: 'rtl' }}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * ArabiziText Component
 * Renders romanized Arabic text (Arabizi) with proper styling
 */
export const ArabiziText = ({ children, size = 'md', className = '', ...props }) => {
  const getSizeClasses = (size) => {
    switch (size) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      default: return 'text-base';
    }
  };

  return (
    <span 
      className={`arabizi ${getSizeClasses(size)} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};