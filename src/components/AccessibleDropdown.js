/**
 * Accessible Dropdown Component
 * Dropdown with full keyboard navigation and ARIA support
 */
import React, { useState, useRef, useEffect } from 'react';
import { keyboardUtils, ariaUtils, focusUtils } from '../utils/accessibilityUtils.js';

const AccessibleDropdown = ({
  trigger,
  children,
  className = '',
  placement = 'bottom-start',
  closeOnSelect = true,
  onOpenChange = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemsRef = useRef([]);
  const menuId = useRef(ariaUtils.generateId('dropdown-menu'));

  // Get all focusable items
  const getFocusableItems = () => {
    if (!menuRef.current) return [];
    return Array.from(menuRef.current.querySelectorAll('[role="menuitem"]:not([disabled])'));
  };

  // Handle dropdown toggle
  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    setFocusedIndex(-1);
    onOpenChange(newIsOpen);

    if (newIsOpen) {
      // Focus first item when opening
      setTimeout(() => {
        const items = getFocusableItems();
        if (items.length > 0) {
          items[0].focus();
          setFocusedIndex(0);
        }
      }, 10);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const items = getFocusableItems();
    
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
          setTimeout(() => {
            const items = getFocusableItems();
            if (items[0]) items[0].focus();
          }, 10);
        } else {
          keyboardUtils.handleArrowNavigation(e, items, focusedIndex, setFocusedIndex);
        }
        break;
      case 'Home':
        if (isOpen && items.length > 0) {
          e.preventDefault();
          items[0].focus();
          setFocusedIndex(0);
        }
        break;
      case 'End':
        if (isOpen && items.length > 0) {
          e.preventDefault();
          items[items.length - 1].focus();
          setFocusedIndex(items.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          toggleDropdown();
        }
        break;
    }
  };

  // Handle item selection
  const handleItemClick = (callback) => {
    if (closeOnSelect) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    if (callback) callback();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        menuRef.current &&
        !triggerRef.current.contains(event.target) &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update ARIA expanded state
  useEffect(() => {
    if (triggerRef.current) {
      ariaUtils.setExpanded(triggerRef.current, isOpen);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId.current}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className="focus:outline-none focus-ring"
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId.current}
          role="menu"
          className={`
            absolute z-50 mt-1 min-w-48
            bg-white rounded-lg shadow-xl border border-neutral-200
            py-2 animate-fade-in-up
            ${placement.includes('bottom') ? 'top-full' : 'bottom-full'}
            ${placement.includes('start') ? 'left-0' : 'right-0'}
          `}
          onKeyDown={handleKeyDown}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                role: 'menuitem',
                tabIndex: -1,
                onClick: () => handleItemClick(child.props.onClick),
                onFocus: () => setFocusedIndex(index),
                className: `${child.props.className || ''} focus:bg-neutral-50 focus:outline-none`
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

export default AccessibleDropdown;