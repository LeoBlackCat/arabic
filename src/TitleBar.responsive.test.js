import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TitleBar, { CONTENT_TYPES, GAME_TYPES } from './TitleBar';

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('TitleBar Responsive Behavior', () => {
  beforeEach(() => {
    // Reset matchMedia mock before each test
    delete window.matchMedia;
  });

  describe('Mobile Layout (< 640px)', () => {
    beforeEach(() => {
      mockMatchMedia(false); // Simulate mobile viewport
    });

    test('should render mobile layout with stacked elements', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Mobile layout should have specific structure
      const mobileContainer = document.querySelector('.sm\\:hidden');
      expect(mobileContainer).toBeInTheDocument();

      // Desktop layout should be hidden
      const desktopContainer = document.querySelector('.hidden.sm\\:flex');
      expect(desktopContainer).toBeInTheDocument();
    });

    test('should have touch-friendly button sizes on mobile', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Settings button should have minimum touch target size
      const settingsButtons = screen.getAllByLabelText('Open settings');
      settingsButtons.forEach(button => {
        expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]');
        expect(button).toHaveClass('touch-manipulation');
      });
    });

    test('should have proper spacing in mobile layout', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Check mobile container padding
      const titleBarContainer = document.querySelector('.bg-white.shadow-sm');
      expect(titleBarContainer).toHaveClass('px-3', 'py-2');
    });

    test('should stack topic name and settings in top row on mobile', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Mobile layout should have topic and settings in first row
      const topRow = document.querySelector('.sm\\:hidden .flex.items-center.justify-between.mb-2');
      expect(topRow).toBeInTheDocument();

      // Should contain topic name and settings button
      const topRowHeading = topRow.querySelector('h1');
      const topRowButton = topRow.querySelector('button');
      expect(topRowHeading).toBeInTheDocument();
      expect(topRowButton).toBeInTheDocument();
    });

    test('should place selectors in bottom row on mobile', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Mobile layout should have selectors in second row
      const bottomRow = document.querySelector('.sm\\:hidden .flex.gap-2');
      expect(bottomRow).toBeInTheDocument();

      // Should contain both selectors
      const selectors = bottomRow.querySelectorAll('select');
      expect(selectors).toHaveLength(2);
    });
  });

  describe('Tablet Layout (≥ 640px, < 768px)', () => {
    beforeEach(() => {
      mockMatchMedia(true); // Simulate tablet/desktop viewport
    });

    test('should render desktop layout on tablet screens', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Desktop layout should be visible
      const desktopContainer = document.querySelector('.hidden.sm\\:flex');
      expect(desktopContainer).toBeInTheDocument();

      // Mobile layout should be hidden
      const mobileContainer = document.querySelector('.sm\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });

    test('should have appropriate spacing for tablet screens', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Check tablet container padding
      const titleBarContainer = document.querySelector('.bg-white.shadow-sm');
      expect(titleBarContainer).toHaveClass('sm:px-4', 'sm:py-3');
    });

    test('should use compact selectors on tablet', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Desktop selectors should have responsive sizing
      const contentSelector = screen.getByLabelText('Select content type to learn');
      expect(contentSelector).toHaveClass('min-w-[120px]');

      const gameSelector = screen.getByLabelText('Select game type to play');
      expect(gameSelector).toHaveClass('min-w-[140px]');
    });
  });

  describe('Desktop Layout (≥ 768px)', () => {
    beforeEach(() => {
      mockMatchMedia(true); // Simulate desktop viewport
    });

    test('should have maximum spacing on desktop', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Check desktop container padding
      const titleBarContainer = document.querySelector('.bg-white.shadow-sm');
      expect(titleBarContainer).toHaveClass('md:px-6', 'md:py-4');
    });

    test('should use larger selectors on desktop', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Desktop selectors should have larger minimum widths
      const contentSelector = screen.getByLabelText('Select content type to learn');
      expect(contentSelector).toHaveClass('md:min-w-[140px]');

      const gameSelector = screen.getByLabelText('Select game type to play');
      expect(gameSelector).toHaveClass('md:min-w-[160px]');
    });

    test('should have proper topic name container sizing on desktop', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Topic name container should have responsive max-width
      const topicContainer = document.querySelector('.flex-shrink-0.min-w-0');
      expect(topicContainer).toHaveClass('max-w-[200px]', 'sm:max-w-[250px]', 'md:max-w-[300px]', 'lg:max-w-[400px]');
    });
  });

  describe('Responsive Text and Sizing', () => {
    test('should have responsive text sizing', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Topic name should have responsive text sizing
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('text-lg', 'sm:text-xl');
      });
    });

    test('should handle text truncation properly', () => {
      const longTopicName = 'Very Long Topic Name That Should Be Truncated Properly';
      
      render(
        <TitleBar
          currentTopic={longTopicName}
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // All headings should have truncate class
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('truncate');
        expect(heading).toHaveAttribute('title', longTopicName);
      });
    });
  });

  describe('Touch Interactions', () => {
    test('should have touch-manipulation class on interactive elements', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Mobile selectors should have touch-manipulation
      const mobileSelectors = document.querySelectorAll('.sm\\:hidden select');
      mobileSelectors.forEach(selector => {
        expect(selector).toHaveClass('touch-manipulation');
      });

      // Settings buttons should have touch-manipulation
      const settingsButtons = screen.getAllByLabelText('Open settings');
      settingsButtons.forEach(button => {
        expect(button).toHaveClass('touch-manipulation');
      });
    });

    test('should have adequate touch target sizes', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Mobile selectors should have adequate padding for touch
      const mobileSelectors = document.querySelectorAll('.sm\\:hidden select');
      mobileSelectors.forEach(selector => {
        expect(selector).toHaveClass('py-2.5');
      });
    });
  });

  describe('Responsive Gap and Spacing', () => {
    test('should have responsive gaps between elements', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Desktop layout should have responsive gaps
      const desktopContainer = document.querySelector('.hidden.sm\\:flex');
      expect(desktopContainer).toHaveClass('gap-3', 'md:gap-4');

      // Mobile selector row should have gap
      const mobileSelectorsRow = document.querySelector('.sm\\:hidden .flex.gap-2');
      expect(mobileSelectorsRow).toBeInTheDocument();
    });

    test('should have responsive container max-width', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Container should have max-width constraint
      const maxWidthContainer = document.querySelector('.max-w-4xl.mx-auto');
      expect(maxWidthContainer).toBeInTheDocument();
    });
  });

  describe('Viewport Size Changes', () => {
    test('should handle viewport size changes gracefully', () => {
      const { rerender } = render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Initial render should work
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(2);

      // Re-render should still work (simulating viewport change)
      rerender(
        <TitleBar
          selectedContent={CONTENT_TYPES.COLORS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      expect(screen.getAllByText('Colors')).toHaveLength(2);
    });
  });

  describe('Accessibility at Different Screen Sizes', () => {
    test('should maintain accessibility attributes across screen sizes', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Both mobile and desktop selectors should have proper labels
      const contentSelectors = screen.getAllByLabelText('Select content type to learn');
      expect(contentSelectors).toHaveLength(2); // Mobile and desktop versions

      const gameSelectors = screen.getAllByLabelText('Select game type to play');
      expect(gameSelectors).toHaveLength(2); // Mobile and desktop versions

      // All should have proper IDs
      expect(document.getElementById('content-type-selector')).toBeInTheDocument();
      expect(document.getElementById('content-type-selector-desktop')).toBeInTheDocument();
      expect(document.getElementById('game-type-selector')).toBeInTheDocument();
      expect(document.getElementById('game-type-selector-desktop')).toBeInTheDocument();
    });

    test('should have proper screen reader support across layouts', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Screen reader help text should be present for both layouts
      const contentHelpTexts = screen.getAllByText('Choose the type of Arabic content you want to practice');
      expect(contentHelpTexts).toHaveLength(2); // Mobile and desktop versions
      contentHelpTexts.forEach(helpText => {
        expect(helpText).toHaveClass('sr-only');
      });

      const gameHelpTexts = screen.getAllByText('Choose the type of game you want to play with the selected content');
      expect(gameHelpTexts).toHaveLength(2); // Mobile and desktop versions
      gameHelpTexts.forEach(helpText => {
        expect(helpText).toHaveClass('sr-only');
      });
    });
  });
});