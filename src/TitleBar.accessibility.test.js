import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TitleBar, { DropdownErrorBoundary } from './TitleBar';

// Mock console methods to test error handling
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('TitleBar Accessibility Tests', () => {
  const defaultProps = {
    selectedContent: 'verbs',
    selectedGame: 'speech',
    contentData: [],
    isLoading: false,
    speechConfig: { azure: { isEnabled: false }, elevenlabs: { isEnabled: false } },
    onContentChange: jest.fn(),
    onGameChange: jest.fn(),
    onSettingsClick: jest.fn()
  };

  describe('ARIA Labels and Roles', () => {
    test('should have proper banner role and aria-label', () => {
      render(<TitleBar {...defaultProps} />);
      
      const banner = screen.getByRole('banner');
      expect(banner).toHaveAttribute('aria-label', 'Navigation titlebar');
    });

    test('should have proper navigation role for desktop layout', () => {
      render(<TitleBar {...defaultProps} />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation controls');
    });

    test('should have proper group roles for control sections', () => {
      render(<TitleBar {...defaultProps} />);
      
      const groups = screen.getAllByRole('group');
      expect(groups).toHaveLength(2); // One for mobile, one for desktop
      
      groups.forEach(group => {
        expect(group).toHaveAttribute('aria-label', 'Content and game selection controls');
      });
    });

    test('should have proper aria-labels for select elements', () => {
      render(<TitleBar {...defaultProps} />);
      
      const contentSelectors = screen.getAllByLabelText(/select content type to learn/i);
      const gameSelectors = screen.getAllByLabelText(/select game type to play/i);
      
      expect(contentSelectors).toHaveLength(2); // Mobile and desktop
      expect(gameSelectors).toHaveLength(2); // Mobile and desktop
      
      contentSelectors.forEach(selector => {
        expect(selector).toHaveAttribute('aria-required', 'true');
      });
      
      gameSelectors.forEach(selector => {
        expect(selector).toHaveAttribute('aria-required', 'true');
      });
    });

    test('should have proper aria-describedby attributes', () => {
      render(<TitleBar {...defaultProps} />);
      
      const contentSelectors = screen.getAllByLabelText(/select content type to learn/i);
      const gameSelectors = screen.getAllByLabelText(/select game type to play/i);
      
      contentSelectors.forEach(selector => {
        expect(selector).toHaveAttribute('aria-describedby');
      });
      
      gameSelectors.forEach(selector => {
        expect(selector).toHaveAttribute('aria-describedby');
      });
    });

    test('should have proper settings button aria-label with speech status', () => {
      const propsWithSpeech = {
        ...defaultProps,
        speechConfig: { azure: { isEnabled: true }, elevenlabs: { isEnabled: false } }
      };
      
      render(<TitleBar {...propsWithSpeech} />);
      
      const settingsButtons = screen.getAllByRole('button', { name: /open settings panel/i });
      
      settingsButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label', 
          expect.stringContaining('Speech services are currently active')
        );
      });
    });
  });

  describe('Live Regions', () => {
    test('should have aria-live regions for topic name updates', () => {
      render(<TitleBar {...defaultProps} />);
      
      const topicHeadings = screen.getAllByRole('heading', { level: 1 });
      
      topicHeadings.forEach(heading => {
        expect(heading).toHaveAttribute('aria-live', 'polite');
        expect(heading).toHaveAttribute('aria-atomic', 'true');
      });
    });

    test('should announce topic changes to screen readers', async () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      expect(screen.getAllByText('Verbs')).toHaveLength(2); // Mobile and desktop
      
      rerender(<TitleBar {...defaultProps} selectedContent="colors" />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Colors')).toHaveLength(2);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('should handle Enter key on settings button', async () => {
      const user = userEvent.setup();
      const onSettingsClick = jest.fn();
      
      render(<TitleBar {...defaultProps} onSettingsClick={onSettingsClick} />);
      
      const settingsButton = screen.getAllByRole('button', { name: /open settings panel/i })[0];
      
      await user.type(settingsButton, '{Enter}');
      
      expect(onSettingsClick).toHaveBeenCalled();
    });

    test('should handle Space key on settings button', async () => {
      const user = userEvent.setup();
      const onSettingsClick = jest.fn();
      
      render(<TitleBar {...defaultProps} onSettingsClick={onSettingsClick} />);
      
      const settingsButton = screen.getAllByRole('button', { name: /open settings panel/i })[0];
      
      await user.type(settingsButton, ' ');
      
      expect(onSettingsClick).toHaveBeenCalled();
    });

    test('should handle Escape key to blur select elements', async () => {
      const user = userEvent.setup();
      
      render(<TitleBar {...defaultProps} />);
      
      const contentSelector = screen.getAllByLabelText(/select content type to learn/i)[0];
      
      contentSelector.focus();
      expect(contentSelector).toHaveFocus();
      
      await user.keyboard('{Escape}');
      
      expect(contentSelector).not.toHaveFocus();
    });

    test('should have proper focus management with focus rings', () => {
      render(<TitleBar {...defaultProps} />);
      
      const focusableElements = [
        ...screen.getAllByRole('combobox'),
        ...screen.getAllByRole('button')
      ];
      
      focusableElements.forEach(element => {
        expect(element).toHaveClass('focus:outline-none');
        expect(element).toHaveClass('focus:ring-2');
        expect(element).toHaveClass('focus:ring-blue-500');
      });
    });
  });

  describe('Screen Reader Support', () => {
    test('should have proper screen reader only text', () => {
      render(<TitleBar {...defaultProps} />);
      
      // Check for sr-only helper text
      const helpTexts = screen.getAllByText(/choose the type of arabic content/i);
      expect(helpTexts.length).toBeGreaterThan(0);
      
      helpTexts.forEach(text => {
        expect(text).toHaveClass('sr-only');
      });
    });

    test('should hide decorative elements from screen readers', () => {
      render(<TitleBar {...defaultProps} />);
      
      const gearIcons = screen.getAllByText('⚙️');
      
      gearIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    test('should provide alternative text for settings button', () => {
      render(<TitleBar {...defaultProps} />);
      
      const settingsTexts = screen.getAllByText('Settings');
      
      settingsTexts.forEach(text => {
        expect(text).toHaveClass('sr-only');
      });
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    test('should have proper touch target sizes', () => {
      render(<TitleBar {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const comboboxes = screen.getAllByRole('combobox');
      
      // Check buttons have proper touch target sizes
      buttons.forEach(button => {
        const hasMinWidth = button.classList.contains('min-w-[44px]');
        const hasMinHeight = button.classList.contains('min-h-[44px]');
        expect(hasMinWidth && hasMinHeight).toBe(true);
      });
      
      // Check mobile comboboxes have touch-manipulation
      const mobileComboboxes = comboboxes.filter(cb => 
        cb.classList.contains('touch-manipulation')
      );
      expect(mobileComboboxes.length).toBeGreaterThan(0);
    });

    test('should have touch-manipulation class for mobile elements', () => {
      render(<TitleBar {...defaultProps} />);
      
      // Mobile layout elements should have touch-manipulation
      const mobileSelectors = screen.getAllByRole('combobox').slice(0, 2); // First two are mobile
      
      mobileSelectors.forEach(selector => {
        expect(selector).toHaveClass('touch-manipulation');
      });
    });
  });

  describe('Loading State Accessibility', () => {
    test('should properly communicate loading state to screen readers', () => {
      render(<TitleBar {...defaultProps} isLoading={true} />);
      
      expect(screen.getAllByText('Loading...')).toHaveLength(6); // 2 Topics + 4 selectors (mobile + desktop)
      
      const selectors = screen.getAllByRole('combobox');
      selectors.forEach(selector => {
        expect(selector).toBeDisabled();
      });
    });

    test('should maintain aria-live regions during loading', () => {
      render(<TitleBar {...defaultProps} isLoading={true} />);
      
      const topicHeadings = screen.getAllByRole('heading', { level: 1 });
      
      topicHeadings.forEach(heading => {
        expect(heading).toHaveAttribute('aria-live', 'polite');
        expect(heading).toHaveTextContent('Loading...');
      });
    });
  });

  describe('Error State Accessibility', () => {
    test('should handle dropdown errors gracefully', () => {
      // Mock a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      const ErrorBoundaryTest = () => (
        <DropdownErrorBoundary>
          <ThrowError />
        </DropdownErrorBoundary>
      );
      
      render(<ErrorBoundaryTest />);
      
      expect(screen.getByText(/dropdown error - please refresh/i)).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('should have proper contrast classes for different states', () => {
      const propsWithSpeech = {
        ...defaultProps,
        speechConfig: { azure: { isEnabled: true }, elevenlabs: { isEnabled: false } }
      };
      
      render(<TitleBar {...propsWithSpeech} />);
      
      const activeButtons = screen.getAllByRole('button', { name: /speech services are currently active/i });
      
      activeButtons.forEach(button => {
        expect(button).toHaveClass('bg-blue-500');
        expect(button).toHaveClass('text-white');
      });
    });

    test('should have proper hover and focus states', () => {
      render(<TitleBar {...defaultProps} />);
      
      const interactiveElements = [
        ...screen.getAllByRole('combobox'),
        ...screen.getAllByRole('button')
      ];
      
      interactiveElements.forEach(element => {
        expect(element).toHaveClass('transition-colors');
      });
    });
  });
});