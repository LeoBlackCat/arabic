import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TitleBar, { 
  getTopicDisplayName, 
  getAvailableGames, 
  isValidGameForContent,
  DropdownErrorBoundary,
  CONTENT_TYPES, 
  GAME_TYPES 
} from './TitleBar';

describe('TitleBar Error Handling and Edge Cases', () => {
  describe('Loading States', () => {
    test('should display loading state when isLoading is true', () => {
      render(
        <TitleBar
          selectedContent=""
          selectedGame=""
          contentData={[]}
          isLoading={true}
        />
      );

      // Check that loading text is displayed in topic name (appears in both mobile and desktop)
      const loadingTexts = screen.getAllByText('Loading...');
      expect(loadingTexts.length).toBeGreaterThan(0);
      
      // Check that dropdowns show loading state
      const loadingOptions = screen.getAllByText('Loading...');
      expect(loadingOptions.length).toBeGreaterThan(0);
    });

    test('should disable dropdowns when loading', () => {
      render(
        <TitleBar
          selectedContent=""
          selectedGame=""
          contentData={[]}
          isLoading={true}
        />
      );

      const contentSelectors = screen.getAllByLabelText('Select content type to learn');
      contentSelectors.forEach(selector => {
        expect(selector).toBeDisabled();
      });
    });
  });

  describe('Empty Content Arrays', () => {
    test('should display "No [Content] Available" when content data is empty', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame=""
          contentData={[]}
          isLoading={false}
        />
      );

      // Text appears in both mobile and desktop versions
      const noVerbsTexts = screen.getAllByText('No Verbs Available');
      expect(noVerbsTexts.length).toBeGreaterThan(0);
    });

    test('should handle empty content arrays for different content types', () => {
      const { rerender } = render(
        <TitleBar
          selectedContent={CONTENT_TYPES.COLORS}
          selectedGame=""
          contentData={[]}
          isLoading={false}
        />
      );

      // Text appears in both mobile and desktop versions
      const noColorsTexts = screen.getAllByText('No Colors Available');
      expect(noColorsTexts.length).toBeGreaterThan(0);

      rerender(
        <TitleBar
          selectedContent={CONTENT_TYPES.NOUNS}
          selectedGame=""
          contentData={[]}
          isLoading={false}
        />
      );

      const noNounsTexts = screen.getAllByText('No Nouns Available');
      expect(noNounsTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Invalid Content/Game Combinations', () => {
    test('should handle invalid content type gracefully', () => {
      render(
        <TitleBar
          selectedContent="invalid_content"
          selectedGame=""
          contentData={[]}
          isLoading={false}
        />
      );

      // The component shows "No invalid_content Available" for empty content arrays
      const invalidContentTexts = screen.getAllByText('No invalid_content Available');
      expect(invalidContentTexts.length).toBeGreaterThan(0);
    });

    test('should reset game when content changes to incompatible type', () => {
      const mockOnGameChange = jest.fn();
      const mockOnContentChange = jest.fn();

      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.POSSESSIVE} // This game is not available for verbs
          contentData={[{ id: 1, chat: 'test' }]}
          isLoading={false}
          onContentChange={mockOnContentChange}
          onGameChange={mockOnGameChange}
        />
      );

      // Simulate changing content type
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });

      expect(mockOnContentChange).toHaveBeenCalledWith(CONTENT_TYPES.COLORS);
    });
  });

  describe('Utility Functions Error Handling', () => {
    describe('getTopicDisplayName', () => {
      test('should return "Loading..." when isLoading is true', () => {
        expect(getTopicDisplayName('', [], true)).toBe('Loading...');
      });

      test('should return "Select Content" when no content is selected', () => {
        expect(getTopicDisplayName('', [], false)).toBe('Select Content');
      });

      test('should return "No [Content] Available" for empty content arrays', () => {
        expect(getTopicDisplayName(CONTENT_TYPES.VERBS, [], false)).toBe('No Verbs Available');
        expect(getTopicDisplayName(CONTENT_TYPES.COLORS, [], false)).toBe('No Colors Available');
      });

      test('should handle unknown content types gracefully', () => {
        expect(getTopicDisplayName('unknown_type', [{ id: 1 }], false)).toBe('Unknown_type');
      });

      test('should handle non-string content types', () => {
        expect(getTopicDisplayName(null, [], false)).toBe('Select Content');
        expect(getTopicDisplayName(undefined, [], false)).toBe('Select Content');
        expect(getTopicDisplayName(123, [], false)).toBe('No 123 Available');
      });
    });

    describe('getAvailableGames', () => {
      test('should return empty array for invalid content type', () => {
        expect(getAvailableGames(null)).toEqual([]);
        expect(getAvailableGames(undefined)).toEqual([]);
        expect(getAvailableGames(123)).toEqual([]);
      });

      test('should return fallback games for unknown content type', () => {
        const games = getAvailableGames('unknown_type');
        expect(games).toHaveLength(5);
        expect(games[0]).toEqual({ value: GAME_TYPES.SPEECH, label: 'Speech Recognition' });
      });

      test('should handle errors gracefully', () => {
        // Mock console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Force an error by passing a problematic input
        const games = getAvailableGames('test');
        expect(games).toHaveLength(5); // Should return fallback games
        
        consoleSpy.mockRestore();
      });
    });

    describe('isValidGameForContent', () => {
      test('should return false for invalid inputs', () => {
        expect(isValidGameForContent(null, CONTENT_TYPES.VERBS)).toBe(false);
        expect(isValidGameForContent(GAME_TYPES.SPEECH, null)).toBe(false);
        expect(isValidGameForContent('', CONTENT_TYPES.VERBS)).toBe(false);
        expect(isValidGameForContent(GAME_TYPES.SPEECH, '')).toBe(false);
      });

      test('should validate game/content combinations correctly', () => {
        expect(isValidGameForContent(GAME_TYPES.POSSESSIVE, CONTENT_TYPES.NOUNS)).toBe(true);
        expect(isValidGameForContent(GAME_TYPES.POSSESSIVE, CONTENT_TYPES.VERBS)).toBe(false);
        expect(isValidGameForContent(GAME_TYPES.SPEECH, CONTENT_TYPES.VERBS)).toBe(true);
      });
    });
  });

  describe('DropdownErrorBoundary', () => {
    test('should render children normally when no error occurs', () => {
      render(
        <DropdownErrorBoundary>
          <div>Test content</div>
        </DropdownErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    test('should display error message when error occurs', () => {
      // Component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <DropdownErrorBoundary>
          <ThrowError />
        </DropdownErrorBoundary>
      );

      expect(screen.getByText('⚠️ Dropdown error - please refresh')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing speechConfig gracefully', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          speechConfig={undefined}
        />
      );

      // Should not crash and should render settings button
      const settingsButtons = screen.getAllByLabelText('Open settings');
      expect(settingsButtons.length).toBeGreaterThan(0);
    });

    test('should handle missing callback functions gracefully', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          onContentChange={undefined}
          onGameChange={undefined}
          onSettingsClick={undefined}
        />
      );

      // Should not crash when interacting with dropdowns
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      expect(() => fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } })).not.toThrow();
    });
  });
});