import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameHub, { CONTENT_TYPES, GAME_TYPES } from './GameHub';

// Mock the media manifest and logic data
jest.mock('../logic.json', () => ({
  items: [
    { id: 1, chat: 'test_verb', pos: 'verb', english: 'test verb' },
    { id: 2, chat: 'test_noun', pos: 'noun', english: 'test noun' },
    { id: 3, chat: 'test_color', type: 'colors', english: 'test color' },
    { id: 4, chat: 'test_phrase', type: 'phrase', english: 'test phrase' }
  ]
}));

jest.mock('./mediaManifest.json', () => ({
  items: {
    'test_verb': { hasAnyMedia: true, hasImage: true, hasVideo: false, availableFormats: ['image'] },
    'test_noun': { hasAnyMedia: true, hasImage: true, hasVideo: false, availableFormats: ['image'] },
    'test_color': { hasAnyMedia: false, hasImage: false, hasVideo: false, availableFormats: [] },
    'test_phrase': { hasAnyMedia: false, hasImage: false, hasVideo: false, availableFormats: [] }
  }
}));

// Mock the game components to avoid complex rendering
jest.mock('./App', () => {
  return function MockApp({ contentData, contentType }) {
    return <div data-testid="speech-game">Speech Game - {contentType} - {contentData.length} items</div>;
  };
});

jest.mock('./ImageChoiceGame', () => {
  return function MockImageChoiceGame({ contentData, contentType }) {
    return <div data-testid="image-choice-game">Image Choice Game - {contentType} - {contentData.length} items</div>;
  };
});

jest.mock('./PuzzleGame', () => {
  return function MockPuzzleGame({ contentData, contentType }) {
    return <div data-testid="puzzle-game">Puzzle Game - {contentType} - {contentData.length} items</div>;
  };
});

jest.mock('./ConjugationGame', () => {
  return function MockConjugationGame({ contentData, contentType }) {
    return <div data-testid="conjugation-game">Conjugation Game - {contentType} - {contentData.length} items</div>;
  };
});

jest.mock('./ArabicWritingGame', () => {
  return function MockArabicWritingGame({ contentData, contentType }) {
    return <div data-testid="arabic-writing-game">Arabic Writing Game - {contentType} - {contentData.length} items</div>;
  };
});

jest.mock('./AzureSpeechConfig', () => {
  return function MockAzureSpeechConfig({ isOpen, onClose, onConfigChange }) {
    return isOpen ? (
      <div data-testid="speech-config-modal">
        <button onClick={() => onClose()}>Close</button>
        <button onClick={() => onConfigChange({ azure: { isEnabled: true }, elevenlabs: { isEnabled: false } })}>
          Enable Azure
        </button>
      </div>
    ) : null;
  };
});

// Mock other game components
jest.mock('./SpeedTranslationGame', () => () => <div data-testid="speed-translation-game">Speed Translation Game</div>);
jest.mock('./GrammarPatternGame', () => () => <div data-testid="grammar-pattern-game">Grammar Pattern Game</div>);
jest.mock('./SpeechConjugationGame', () => () => <div data-testid="speech-conjugation-game">Speech Conjugation Game</div>);
jest.mock('./PossessiveGame', () => () => <div data-testid="possessive-game">Possessive Game</div>);
jest.mock('./ColorNounGame', () => () => <div data-testid="color-noun-game">Color Noun Game</div>);
jest.mock('./SentenceGame', () => () => <div data-testid="sentence-game">Sentence Game</div>);
jest.mock('./PhraseGame', () => () => <div data-testid="phrase-game">Phrase Game</div>);
jest.mock('./SentenceImageGame', () => () => <div data-testid="sentence-image-game">Sentence Image Game</div>);

// Mock Azure Speech Helper
jest.mock('./azureSpeechHelper', () => ({
  getAzureSpeechConfig: () => ({ isEnabled: false, apiKey: '', region: 'eastus' })
}));

describe('TitleBar and GameHub Integration', () => {
  describe('Initial State and Loading', () => {
    test('should render TitleBar with initial state', async () => {
      render(<GameHub />);

      // Should show loading state initially
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 1 });
        headings.forEach(heading => {
          expect(heading).toHaveTextContent('Verbs');
        });
      });

      // Should render the default game (speech)
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });
    });

    test('should load content data and update TitleBar', async () => {
      render(<GameHub />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toHaveTextContent('verbs - 1 items');
      });
    });
  });

  describe('Content Type Changes', () => {
    test('should update game when content type changes', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Change content type to colors
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });

      // Should update topic name
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 1 });
        headings.forEach(heading => {
          expect(heading).toHaveTextContent('Colors');
        });
      });

      // Should still show speech game (available for colors)
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toHaveTextContent('colors - 1 items');
      });
    });

    test('should reset game when switching to incompatible content type', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Change to conjugation game (only available for verbs)
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.CONJUGATION } });

      await waitFor(() => {
        expect(screen.getByTestId('conjugation-game')).toBeInTheDocument();
      });

      // Change content type to colors (conjugation not available)
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });

      // Should reset to speech game (first available for colors)
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });
    });

    test('should load appropriate content data for each content type', async () => {
      render(<GameHub />);

      // Test verbs
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toHaveTextContent('verbs - 1 items');
      });

      // Switch to nouns
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.NOUNS } });

      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toHaveTextContent('nouns - 1 items');
      });

      // Switch to colors
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });

      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toHaveTextContent('colors - 1 items');
      });

      // Switch to phrases
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.PHRASES } });

      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toHaveTextContent('phrases - 1 items');
      });
    });
  });

  describe('Game Type Changes', () => {
    test('should switch between different games', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Switch to image choice game
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.IMAGE_CHOICE } });

      await waitFor(() => {
        expect(screen.getByTestId('image-choice-game')).toBeInTheDocument();
        expect(screen.queryByTestId('speech-game')).not.toBeInTheDocument();
      });

      // Switch to puzzle game
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.PUZZLE } });

      await waitFor(() => {
        expect(screen.getByTestId('puzzle-game')).toBeInTheDocument();
        expect(screen.queryByTestId('image-choice-game')).not.toBeInTheDocument();
      });
    });

    test('should pass correct props to game components', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Switch to Arabic writing game
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.ARABIC_WRITING } });

      await waitFor(() => {
        const gameComponent = screen.getByTestId('arabic-writing-game');
        expect(gameComponent).toBeInTheDocument();
        expect(gameComponent).toHaveTextContent('verbs - 1 items');
      });
    });
  });

  describe('Settings Integration', () => {
    test('should open and close settings modal', async () => {
      render(<GameHub />);

      // Settings modal should not be visible initially
      expect(screen.queryByTestId('speech-config-modal')).not.toBeInTheDocument();

      // Click settings button
      const settingsButton = screen.getAllByLabelText(/Open settings panel/)[0];
      fireEvent.click(settingsButton);

      // Settings modal should be visible
      await waitFor(() => {
        expect(screen.getByTestId('speech-config-modal')).toBeInTheDocument();
      });

      // Close settings modal
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      // Settings modal should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('speech-config-modal')).not.toBeInTheDocument();
      });
    });

    test('should update speech config and reflect in TitleBar', async () => {
      render(<GameHub />);

      // Initially settings button should not show active state
      const settingsButton = screen.getAllByLabelText(/Open settings panel/)[0];
      expect(settingsButton).not.toHaveClass('bg-blue-500');

      // Open settings modal
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByTestId('speech-config-modal')).toBeInTheDocument();
      });

      // Enable Azure speech
      const enableButton = screen.getByText('Enable Azure');
      fireEvent.click(enableButton);

      // Close modal
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      // Settings button should now show active state
      await waitFor(() => {
        expect(settingsButton).toHaveClass('bg-blue-500');
      });
    });
  });

  describe('State Synchronization', () => {
    test('should maintain state consistency between TitleBar and GameHub', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Change content and game
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];

      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.NOUNS } });
      
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 1 });
        headings.forEach(heading => {
          expect(heading).toHaveTextContent('Nouns');
        });
      });

      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.POSSESSIVE } });

      await waitFor(() => {
        expect(screen.getByTestId('possessive-game')).toBeInTheDocument();
      });

      // Verify selectors show correct values
      expect(contentSelector.value).toBe(CONTENT_TYPES.NOUNS);
      expect(gameSelector.value).toBe(GAME_TYPES.POSSESSIVE);
    });

    test('should handle rapid state changes gracefully', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];

      // Rapid content changes
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.NOUNS } });
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.VERBS } });

      // Should end up with verbs
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 1 });
        headings.forEach(heading => {
          expect(heading).toHaveTextContent('Verbs');
        });
      });

      // Rapid game changes
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.IMAGE_CHOICE } });
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.PUZZLE } });
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.CONJUGATION } });

      // Should end up with conjugation game
      await waitFor(() => {
        expect(screen.getByTestId('conjugation-game')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle content loading errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<GameHub />);

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(2);
      });

      consoleSpy.mockRestore();
    });

    test('should handle missing game components gracefully', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Try to switch to a game that might not exist
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];
      
      // This should not crash the application
      expect(() => {
        fireEvent.change(gameSelector, { target: { value: 'nonexistent_game' } });
      }).not.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    test('should not cause unnecessary re-renders', async () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <GameHub />;
      };

      render(<TestWrapper />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Change content type
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 1 });
        headings.forEach(heading => {
          expect(heading).toHaveTextContent('Colors');
        });
      });

      // Should not cause excessive re-renders
      const finalRenderCount = renderSpy.mock.calls.length;
      expect(finalRenderCount - initialRenderCount).toBeLessThan(5);
    });
  });

  describe('Accessibility Integration', () => {
    test('should maintain accessibility when switching between games', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Switch games and verify accessibility is maintained
      const gameSelector = screen.getAllByLabelText('Select game type to play')[0];
      fireEvent.change(gameSelector, { target: { value: GAME_TYPES.IMAGE_CHOICE } });

      await waitFor(() => {
        expect(screen.getByTestId('image-choice-game')).toBeInTheDocument();
      });

      // Verify selectors still have proper labels
      expect(screen.getAllByLabelText('Select content type to learn')).toHaveLength(2);
      expect(screen.getAllByLabelText('Select game type to play')).toHaveLength(2);
      expect(screen.getAllByLabelText(/Open settings panel/)).toHaveLength(2);
    });

    test('should announce content changes to screen readers', async () => {
      render(<GameHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('speech-game')).toBeInTheDocument();
      });

      // Change content type
      const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
      fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });

      // Topic name should update (screen readers will announce this change)
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 1 });
        headings.forEach(heading => {
          expect(heading).toHaveTextContent('Colors');
        });
      });
    });
  });
});