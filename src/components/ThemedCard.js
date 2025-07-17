/**
 * Themed Card Component
 * Card component that adapts to current theme with cultural patterns
 */
import React, { useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider.js';
import { applyCulturalPattern } from '../utils/themeUtils.js';

const ThemedCard = ({
  children,
  className = '',
  variant = 'default', // 'default', 'elevated', 'outlined', 'gradient'
  showPattern = false,
  patternOpacity = 0.05,
  onClick = null,
  ...props
}) => {
  const { currentTheme, applyThemeToElement, isTransitioning } = useTheme();
  const cardRef = useRef(null);

  // Apply theme and pattern when theme changes
  useEffect(() => {
    if (cardRef.current) {
      applyThemeToElement(cardRef.current, {
        includeBackground: variant === 'gradient',
        includePattern: showPattern,
        smooth: true
      });
      
      if (showPattern) {
        applyCulturalPattern(cardRef.current, currentTheme, patternOpacity);
      }
    }
  }, [currentTheme, variant, showPattern, patternOpacity, applyThemeToElement]);

  const getVariantClasses = () => {
    const baseClasses = 'card-themed theme-transition';
    
    switch (variant) {
      case 'elevated':
        return `${baseClasses} shadow-themed-lg hover:shadow-themed-lg`;
      case 'outlined':
        return `${baseClasses} border-2 border-themed-primary bg-transparent`;
      case 'gradient':
        return `${baseClasses} bg-themed-gradient text-white`;
      default:
        return `${baseClasses} shadow-themed`;
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        ${getVariantClasses()}
        ${isTransitioning ? 'theme-change-animation' : ''}
        ${onClick ? 'cursor-pointer hover-lift' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default ThemedCard;