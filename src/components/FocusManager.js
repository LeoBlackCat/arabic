/**
 * Focus Manager Component
 * Manages focus for modals, dropdowns, and other interactive elements
 */
import React, { useEffect, useRef } from 'react';
import { focusUtils } from '../utils/accessibilityUtils.js';

const FocusManager = ({
  children,
  trapFocus = false,
  restoreFocus = false,
  autoFocus = false,
  className = ''
}) => {
  const containerRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    let cleanup = null;

    if (containerRef.current) {
      // Save current focus for restoration
      if (restoreFocus) {
        restoreFocusRef.current = focusUtils.saveFocus();
      }

      // Auto focus first element
      if (autoFocus) {
        focusUtils.focusFirst(containerRef.current);
      }

      // Trap focus within container
      if (trapFocus) {
        cleanup = focusUtils.trapFocus(containerRef.current);
      }
    }

    return () => {
      // Cleanup focus trap
      if (cleanup) {
        cleanup();
      }
      
      // Restore previous focus
      if (restoreFocus && restoreFocusRef.current) {
        restoreFocusRef.current();
      }
    };
  }, [trapFocus, restoreFocus, autoFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default FocusManager;