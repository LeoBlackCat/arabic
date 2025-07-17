/**
 * Live Region Component
 * ARIA live region for dynamic content announcements
 */
import React, { useEffect, useRef } from 'react';
import { ariaUtils } from '../utils/accessibilityUtils.js';

const LiveRegion = ({
  message = '',
  priority = 'polite', // 'polite' | 'assertive' | 'off'
  atomic = true,
  relevant = 'additions text',
  className = 'sr-only',
  id = null
}) => {
  const regionRef = useRef(null);
  const regionId = useRef(id || ariaUtils.generateId('live-region'));

  useEffect(() => {
    if (regionRef.current && message) {
      // Clear and set message to ensure announcement
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 10);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      id={regionId.current}
      className={className}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {message}
    </div>
  );
};

export default LiveRegion;