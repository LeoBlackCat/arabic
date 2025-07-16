import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TitleBar, { 
  getTopicDisplayName, 
  getAvailableGames, 
  isValidGameForContent,
  CONTENT_TYPES, 
  GAME_TYPES 
} from './TitleBar';

describe('TitleBar Comprehensive Prop Combinations', () => {
  describe('All Prop Combinations', () => {
    const allContentTypes = Object.values(CONTENT_TYPES);
    const allGameTypes = Object.values(GAME_TYPES);
    
    test.each(allContentTypes)('should render correctly with content type: %s', (contentType) => {
      render(
        <TitleBar
          selectedContent={contentType}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          isLoading={false}
          speechConfig={{ azure: { isEnabled: false }, elevenlabs: { isEnabled: false } }}
          onContentChange={() => {}}
          onGameChange={() => {}}
          onSettingsClick={() => {}}
        />
      );

      // Should render without crashing
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(2);
      
      // Should show correct topic name
      const expectedTopicName = getTopicDisplayName(contentType, [{ id: 1, chat: 'test' }], false);
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent(expectedTopicName);
      });
    });

    test.each([
      [CONTENT_TYPES.VERBS, GAME_TYPES.SPEECH],
      [CONTENT_TYPES.VERBS, GAME_TYPES.CONJUGATION],
      [CONTENT_TYPES.COLORS, GAME_TYPES.IMAGE_CHOICE],
      [CONTENT_TYPES.NOUNS, GAME_TYPES.POSSESSIVE],
      [CONTENT_TYPES.PHRASES, GAME_TYPES.PHRASE]
    ])('should handle valid content/game combination: %s + %s', (contentType, gameType) => {
      render(
        <TitleBar
          selectedContent={contentType}
          selectedGame={gameType}
          contentData={[{ id: 1, chat: 'test' }]}
          isLoading={false}
          speechConfig={{ azure: { isEnabled: false }, elevenlabs: { isEnabled: false } }}
          onContentChange={() => {}}
          onGameChange={() => {}}
          onSettingsClick={() => {}}
        />
      );

      // Should render without crashing
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(2);
      
      // Game selector should show the selected game
      const gameSelectors = screen.getAllByLabelText('Select game type to play');
      const validGameSelector = gameSelectors.find(selector => selector.value === gameType);
      expect(validGameSelector).toBeTruthy();
    });

    test.each([
      [CONTENT_TYPES.COLORS, GAME_TYPES.CONJUGATION], // Invalid: conjugation not available for colors
      [CONTENT_TYPES.VERBS, GAME_TYPES.POSSESSIVE],   // Invalid: possessive not available for verbs
      [CONTENT_TYPES.PHRASES, GAME_TYPES.PUZZLE]      // Invalid: puzzle not available for phrases
    ])('should handle invalid content/game combination: %s + %s', (contentType, gameType) => {
      render(
        <TitleBar
          selectedContent={contentType}
          selectedGame={gameType}
          contentData={[{ id: 1, chat: 'test' }]}
          isLoading={false}
          speechConfig={{ azure: { isEnabled: false }, elevenlabs: { isEnabled: false } }}
          onContentChange={() => {}}
          onGameChange={() => {}}
          onSettingsClick={() => {}}
        />
      );

      // Should render without crashing
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(2);
      
      // Game selector should not show the invalid game as selected
      const gameSelectors = screen.getAllByLabelText('Select game type to play');
      gameSelectors.forEach(selector => {
        expect(selector.value).toBe(''); // Should be empty due to invalid combination
      });
    });
  });

  describe('ContentData Variations', () => {
    test('should handle empty contentData array', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[]}
          isLoading={false}
        />
      );

      expect(screen.getAllByText('No Verbs Available')).toHaveLength(2);
    });

    test('should handle null contentData', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={null}
          isLoading={false}
        />
      );

      // Should not crash and should show topic name
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent('Verbs');
      });
    });

    test('should handle undefined contentData', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={undefined}
          isLoading={false}
        />
      );

      // Should not crash and should show topic name
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent('Verbs');
      });
    });

    test('should handle large contentData arrays', () => {
      const largeContentData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        chat: `test_${i}`,
        english: `Test ${i}`
      }));

      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={largeContentData}
          isLoading={false}
        />
      );

      // Should render without performance issues
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent('Verbs');
      });
    });

    test('should handle contentData with missing properties', () => {
      const incompleteContentData = [
        { id: 1 }, // Missing chat and english
        { chat: 'test' }, // Missing id and english
        { english: 'test' } // Missing id and chat
      ];

      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={incompleteContentData}
          isLoading={false}
        />
      );

      // Should not crash
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent('Verbs');
      });
    });
  });

  describe('SpeechConfig Variations', () => {
    test('should handle Azure enabled speechConfig', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          speechConfig={{ azure: { isEnabled: true }, elevenlabs: { isEnabled: false } }}
        />
      );

      // Settings button should show active state
      const settingsButtons = screen.getAllByLabelText('Open settings');
      settingsButtons.forEach(button => {
        expect(button).toHaveClass('bg-blue-500');
      });
    });

    test('should handle ElevenLabs enabled speechConfig', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          speechConfig={{ azure: { isEnabled: false }, elevenlabs: { isEnabled: true } }}
        />
      );

      // Settings button should show active state
      const settingsButtons = screen.getAllByLabelText('Open settings');
      settingsButtons.forEach(button => {
        expect(button).toHaveClass('bg-blue-500');
      });
    });

    test('should handle both services enabled speechConfig', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          speechConfig={{ azure: { isEnabled: true }, elevenlabs: { isEnabled: true } }}
        />
      );

      // Settings button should show active state
      const settingsButtons = screen.getAllByLabelText('Open settings');
      settingsButtons.forEach(button => {
        expect(button).toHaveClass('bg-blue-500');
      });
    });

    test('should handle malformed speechConfig', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          speechConfig={{ azure: null, elevenlabs: undefined }}
        />
      );

      // Should not crash and should render settings button
      const settingsButtons = screen.getAllByLabelText('Open settings');
      expect(settingsButtons.length).toBeGreaterThan(0);
    });

    test('should handle null speechConfig', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          speechConfig={null}
        />
      );

      // Should not crash
      const settingsButtons = screen.getAllByLabelText('Open settings');
      expect(settingsButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State Combinations', () => {
    test('should handle loading with empty content', () => {
      render(
        <TitleBar
          selectedContent=""
          selectedGame=""
          contentData={[]}
          isLoading={true}
        />
      );

      // Should show loading state
      expect(screen.getAllByText('Loading...')).toHaveLength(6); // Topic name (2) + dropdown options (4)
    });

    test('should handle loading with selected content', () => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[]}
          isLoading={true}
        />
      );

      // Should show loading state in topic name
      expect(screen.getAllByText('Loading...')).toHaveLength(6); // Topic name (2) + dropdown options (4)
    });

    test('should transition from loading to loaded state', () => {
      const { rerender } = render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[]}
          isLoading={true}
        />
      );

      // Initially loading
      expect(screen.getAllByText('Loading...')).toHaveLength(6);

      // Transition to loaded
      rerender(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          isLoading={false}
        />
      );

      // Should show proper content
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent('Verbs');
      });
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Callback Function Variations', () => {
    test('should handle missing callback functions', () => {
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

      // Should not crash when interacting
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      expect(() => fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } })).not.toThrow();

      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];
      expect(() => fireEvent.change(gameSelector, { target: { value: GAME_TYPES.IMAGE_CHOICE } })).not.toThrow();

      const settingsButton = screen.getAllByLabelText('Open settings')[0];
      expect(() => fireEvent.click(settingsButton)).not.toThrow();
    });

    test('should handle callback functions that throw errors', () => {
      const errorCallback = () => { throw new Error('Callback error'); };
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          onContentChange={errorCallback}
          onGameChange={errorCallback}
          onSettingsClick={errorCallback}
        />
      );

      // Should handle errors gracefully
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      expect(() => fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } })).not.toThrow();

      consoleSpy.mockRestore();
    });

    test('should call callbacks with correct parameters', () => {
      const mockOnContentChange = jest.fn();
      const mockOnGameChange = jest.fn();
      const mockOnSettingsClick = jest.fn();

      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          onContentChange={mockOnContentChange}
          onGameChange={mockOnGameChange}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      // Test content change callback
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });
      expect(mockOnContentChange).toHaveBeenCalledWith(CONTENT_TYPES.COLORS);

      // Test game change callback
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.IMAGE_CHOICE } });
      expect(mockOnGameChange).toHaveBeenCalledWith(GAME_TYPES.IMAGE_CHOICE);

      // Test settings click callback
      const settingsButton = screen.getAllByLabelText('Open settings')[0];
      fireEvent.click(settingsButton);
      expect(mockOnSettingsClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle extremely long topic names', () => {
      const veryLongTopicName = 'A'.repeat(1000);
      
      render(
        <TitleBar
          currentTopic={veryLongTopicName}
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
        />
      );

      // Should render with truncation
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('truncate');
        expect(heading).toHaveAttribute('title', veryLongTopicName);
      });
    });

    test('should handle special characters in content data', () => {
      const specialContentData = [
        { id: 1, chat: 'test<script>', english: 'Test & "quotes"' },
        { id: 2, chat: 'test\n\r\t', english: 'Test\u0000\u001F' }
      ];

      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={specialContentData}
        />
      );

      // Should render without XSS issues
      const headings = screen.getAllByRole('heading', { level: 1 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent('Verbs');
      });
    });

    test('should handle rapid prop changes', () => {
      const { rerender } = render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          isLoading={false}
        />
      );

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        const contentTypes = Object.values(CONTENT_TYPES);
        const randomContent = contentTypes[i % contentTypes.length];
        
        rerender(
          <TitleBar
            selectedContent={randomContent}
            selectedGame={GAME_TYPES.SPEECH}
            contentData={[{ id: i, chat: `test_${i}` }]}
            isLoading={i % 2 === 0}
          />
        );
      }

      // Should still render correctly
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(2);
    });

    test('should handle zero-length arrays and strings', () => {
      render(
        <TitleBar
          selectedContent=""
          selectedGame=""
          contentData={[]}
          currentTopic=""
          isLoading={false}
        />
      );

      // Should show appropriate fallback content
      expect(screen.getAllByText('Select Content')).toHaveLength(3); // Headings (2) + option (1)
    });
  });

  describe('Utility Functions Comprehensive Testing', () => {
    describe('getTopicDisplayName edge cases', () => {
      test('should handle all possible parameter combinations', () => {
        const testCases = [
          [null, null, null, 'Select Content'],
          [undefined, undefined, undefined, 'Select Content'],
          ['', [], false, 'Select Content'],
          ['', [], true, 'Loading...'],
          [CONTENT_TYPES.VERBS, [], false, 'No Verbs Available'],
          [CONTENT_TYPES.VERBS, [{ id: 1 }], false, 'Verbs'],
          ['unknown', [{ id: 1 }], false, 'Unknown'],
          [123, [{ id: 1 }], false, 'Unknown Content']
        ];

        testCases.forEach(([content, data, loading, expected]) => {
          expect(getTopicDisplayName(content, data, loading)).toBe(expected);
        });
      });
    });

    describe('getAvailableGames edge cases', () => {
      test('should handle all content types and edge cases', () => {
        // Test all valid content types
        Object.values(CONTENT_TYPES).forEach(contentType => {
          const games = getAvailableGames(contentType);
          expect(Array.isArray(games)).toBe(true);
          expect(games.length).toBeGreaterThan(0);
          games.forEach(game => {
            expect(game).toHaveProperty('value');
            expect(game).toHaveProperty('label');
          });
        });

        // Test edge cases
        expect(getAvailableGames(null)).toEqual([]);
        expect(getAvailableGames(undefined)).toEqual([]);
        expect(getAvailableGames('')).toEqual([]); // Empty string returns empty array
        expect(getAvailableGames('unknown')).toHaveLength(5); // Default games
      });
    });

    describe('isValidGameForContent comprehensive testing', () => {
      test('should validate all game/content combinations', () => {
        const validCombinations = [
          [GAME_TYPES.SPEECH, CONTENT_TYPES.VERBS],
          [GAME_TYPES.CONJUGATION, CONTENT_TYPES.VERBS],
          [GAME_TYPES.POSSESSIVE, CONTENT_TYPES.NOUNS],
          [GAME_TYPES.PHRASE, CONTENT_TYPES.PHRASES]
        ];

        const invalidCombinations = [
          [GAME_TYPES.CONJUGATION, CONTENT_TYPES.COLORS],
          [GAME_TYPES.POSSESSIVE, CONTENT_TYPES.VERBS],
          [GAME_TYPES.PHRASE, CONTENT_TYPES.VERBS]
        ];

        validCombinations.forEach(([game, content]) => {
          expect(isValidGameForContent(game, content)).toBe(true);
        });

        invalidCombinations.forEach(([game, content]) => {
          expect(isValidGameForContent(game, content)).toBe(false);
        });

        // Test edge cases
        expect(isValidGameForContent(null, CONTENT_TYPES.VERBS)).toBe(false);
        expect(isValidGameForContent(GAME_TYPES.SPEECH, null)).toBe(false);
        expect(isValidGameForContent('', CONTENT_TYPES.VERBS)).toBe(false);
        expect(isValidGameForContent(GAME_TYPES.SPEECH, '')).toBe(false);
      });
    });
  });
});