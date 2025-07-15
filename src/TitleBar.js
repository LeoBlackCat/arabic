import React from 'react';

// Error boundary component for dropdown interactions
class DropdownErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dropdown interaction error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-700 text-sm">
          <span>⚠️ Dropdown error - please refresh</span>
        </div>
      );
    }

    return this.props.children;
  }
}

// Content types constants (should match GameHub.js)
const CONTENT_TYPES = {
  VERBS: 'verbs',
  COLORS: 'colors',
  NOUNS: 'nouns',
  PHRASES: 'phrases'
};

// Game types constants (should match GameHub.js)
const GAME_TYPES = {
  SPEECH: 'speech',
  IMAGE_CHOICE: 'image_choice', 
  PUZZLE: 'puzzle',
  CONJUGATION: 'conjugation',
  SPEECH_CONJUGATION: 'speech_conjugation',
  POSSESSIVE: 'possessive',
  COLOR_NOUN: 'color_noun',
  SENTENCE: 'sentence',
  ARABIC_WRITING: 'arabic_writing',
  SPEED_TRANSLATION: 'speed_translation',
  GRAMMAR_PATTERN: 'grammar_pattern',
  PHRASE: 'phrase',
  SENTENCE_IMAGE: 'sentence_image'
};

// Topic name mapping from content types to display names
const TOPIC_DISPLAY_NAMES = {
  [CONTENT_TYPES.VERBS]: 'Verbs',
  [CONTENT_TYPES.COLORS]: 'Colors',
  [CONTENT_TYPES.NOUNS]: 'Nouns',
  [CONTENT_TYPES.PHRASES]: 'Phrases'
};

/**
 * Calculate the topic name to display based on selected content
 * @param {string} selectedContent - The currently selected content type
 * @param {Array} contentData - Array of content items (optional, for future enhancements)
 * @param {boolean} isLoading - Whether content is currently being loaded
 * @returns {string} The display name for the topic
 */
const getTopicDisplayName = (selectedContent, contentData = [], isLoading = false) => {
  // Handle loading state
  if (isLoading) {
    return 'Loading...';
  }

  // Handle no content selected
  if (!selectedContent) {
    return 'Select Content';
  }

  // Handle empty content data after loading
  if (Array.isArray(contentData) && contentData.length === 0 && selectedContent) {
    return `No ${TOPIC_DISPLAY_NAMES[selectedContent] || selectedContent} Available`;
  }

  // Get display name from mapping
  const displayName = TOPIC_DISPLAY_NAMES[selectedContent];
  
  // Fallback to capitalized content type if not found in mapping
  if (!displayName) {
    // Validate that selectedContent is a string before processing
    if (typeof selectedContent === 'string') {
      return selectedContent.charAt(0).toUpperCase() + selectedContent.slice(1);
    }
    return 'Unknown Content';
  }

  return displayName;
};

/**
 * Get available games based on content type
 * @param {string} contentType - The selected content type
 * @returns {Array} Array of game options with value and label properties
 */
const getAvailableGames = (contentType) => {
  // Handle invalid or missing content type
  if (!contentType || typeof contentType !== 'string') {
    return [];
  }

  try {
    switch (contentType) {
      case CONTENT_TYPES.VERBS:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.CONJUGATION, label: 'Conjugation Practice' },
          { value: GAME_TYPES.SPEECH_CONJUGATION, label: 'Speech Conjugation' },
          { value: GAME_TYPES.ARABIC_WRITING, label: 'Arabic Writing' },
          { value: GAME_TYPES.SPEED_TRANSLATION, label: 'Speed Translation' },
          { value: GAME_TYPES.GRAMMAR_PATTERN, label: 'Grammar Patterns' }
        ];
      case CONTENT_TYPES.COLORS:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.ARABIC_WRITING, label: 'Arabic Writing' },
          { value: GAME_TYPES.SPEED_TRANSLATION, label: 'Speed Translation' }
        ];
      case CONTENT_TYPES.NOUNS:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.POSSESSIVE, label: 'Possessive Practice' },
          { value: GAME_TYPES.COLOR_NOUN, label: 'Color + Noun Game' },
          { value: GAME_TYPES.SENTENCE, label: 'Sentence Builder' },
          { value: GAME_TYPES.ARABIC_WRITING, label: 'Arabic Writing' },
          { value: GAME_TYPES.SPEED_TRANSLATION, label: 'Speed Translation' },
          { value: GAME_TYPES.GRAMMAR_PATTERN, label: 'Grammar Patterns' }
        ];
      case CONTENT_TYPES.PHRASES:
        return [
          { value: GAME_TYPES.PHRASE, label: 'Phrase Practice' },
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.ARABIC_WRITING, label: 'Arabic Writing' },
          { value: GAME_TYPES.SPEED_TRANSLATION, label: 'Speed Translation' },
          { value: GAME_TYPES.SENTENCE_IMAGE, label: 'Sentence Image Game' }
        ];
      default:
        // Fallback games for unknown content types
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.ARABIC_WRITING, label: 'Arabic Writing' },
          { value: GAME_TYPES.SPEED_TRANSLATION, label: 'Speed Translation' }
        ];
    }
  } catch (error) {
    console.error('Error getting available games for content type:', contentType, error);
    // Return minimal fallback games on error
    return [
      { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
      { value: GAME_TYPES.ARABIC_WRITING, label: 'Arabic Writing' }
    ];
  }
};

/**
 * Validate if a game is available for the given content type
 * @param {string} gameType - The game type to validate
 * @param {string} contentType - The content type to check against
 * @returns {boolean} Whether the game is valid for the content type
 */
const isValidGameForContent = (gameType, contentType) => {
  if (!gameType || !contentType) return false;
  
  const availableGames = getAvailableGames(contentType);
  return availableGames.some(game => game.value === gameType);
};

/**
 * TitleBar Component
 * 
 * A mobile-inspired titlebar that displays the current topic name prominently
 * and provides compact controls for content/game selection and settings access.
 * Replaces the traditional multi-row header with a streamlined single-line interface.
 */
const TitleBar = ({
  currentTopic = null, // Deprecated - will be calculated dynamically
  selectedContent = '',
  selectedGame = '',
  contentData = [],
  isLoading = false, // New prop to indicate loading state
  speechConfig = { azure: { isEnabled: false }, elevenlabs: { isEnabled: false } },
  onContentChange = () => {},
  onGameChange = () => {},
  onSettingsClick = () => {}
}) => {
  // Calculate the topic name dynamically based on selected content
  const displayTopic = currentTopic || getTopicDisplayName(selectedContent, contentData, isLoading);
  
  // Get available games for the current content type
  const availableGames = getAvailableGames(selectedContent);
  
  // Validate current game selection against available games
  const isCurrentGameValid = isValidGameForContent(selectedGame, selectedContent);
  
  // Handle invalid content/game combinations
  const handleContentChange = (newContent) => {
    try {
      onContentChange(newContent);
      
      // If current game is not valid for new content, reset to first available game
      if (!isValidGameForContent(selectedGame, newContent)) {
        const newAvailableGames = getAvailableGames(newContent);
        if (newAvailableGames.length > 0) {
          onGameChange(newAvailableGames[0].value);
        }
      }
    } catch (error) {
      console.error('Error handling content change:', error);
    }
  };
  
  // Handle game change with validation
  const handleGameChange = (newGame) => {
    try {
      if (isValidGameForContent(newGame, selectedContent)) {
        onGameChange(newGame);
      } else {
        console.warn('Invalid game selection:', newGame, 'for content:', selectedContent);
      }
    } catch (error) {
      console.error('Error handling game change:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Layout: Stacked elements for screens < 640px */}
        <div className="sm:hidden">
          {/* Top row: Topic name and settings */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h1 
                className="text-lg font-bold text-gray-800 truncate"
                title={displayTopic}
              >
                {displayTopic}
              </h1>
            </div>
            <button
              onClick={onSettingsClick}
              className={`ml-3 p-2 text-sm rounded-md border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation ${
                speechConfig.azure.isEnabled || speechConfig.elevenlabs.isEnabled
                  ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 active:bg-blue-700' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100'
              }`}
              aria-label="Open settings"
              title={speechConfig.azure.isEnabled || speechConfig.elevenlabs.isEnabled ? 'Speech Active - Click to configure' : 'Configure speech settings'}
            >
              ⚙️
            </button>
          </div>
          
          {/* Bottom row: Selectors */}
          <div className="flex gap-2">
            <div className="flex-1">
              <DropdownErrorBoundary>
                <select
                  value={selectedContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors cursor-pointer touch-manipulation"
                  aria-label="Select content type to learn"
                  aria-describedby="content-selector-help"
                  id="content-type-selector"
                  disabled={isLoading}
                >
                  <option value="" disabled>
                    {isLoading ? 'Loading...' : 'Content'}
                  </option>
                  <option value={CONTENT_TYPES.VERBS}>Verbs</option>
                  <option value={CONTENT_TYPES.COLORS}>Colors</option>
                  <option value={CONTENT_TYPES.NOUNS}>Nouns</option>
                  <option value={CONTENT_TYPES.PHRASES}>Phrases</option>
                </select>
              </DropdownErrorBoundary>
            </div>
            
            <div className="flex-1">
              <DropdownErrorBoundary>
                <select
                  value={isCurrentGameValid ? selectedGame : ''}
                  onChange={(e) => handleGameChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors cursor-pointer touch-manipulation"
                  aria-label="Select game type to play"
                  aria-describedby="game-selector-help"
                  id="game-type-selector"
                  disabled={!selectedContent || availableGames.length === 0 || isLoading}
                >
                  <option value="" disabled>
                    {isLoading ? 'Loading...' : !selectedContent ? 'Content First' : availableGames.length === 0 ? 'No Games Available' : 'Game'}
                  </option>
                  {availableGames.map((game) => (
                    <option key={game.value} value={game.value}>
                      {game.label}
                    </option>
                  ))}
                </select>
              </DropdownErrorBoundary>
            </div>
          </div>
          
          {/* Hidden helper text for screen readers */}
          <span id="content-selector-help" className="sr-only">
            Choose the type of Arabic content you want to practice
          </span>
          <span id="game-selector-help" className="sr-only">
            Choose the type of game you want to play with the selected content
          </span>
        </div>

        {/* Tablet and Desktop Layout: Single row for screens ≥ 640px */}
        <div className="hidden sm:flex items-center justify-between gap-3 md:gap-4">
          {/* Topic Name Display */}
          <div className="flex-shrink-0 min-w-0 max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[400px]">
            <h1 
              className="text-lg sm:text-xl font-bold text-gray-800 truncate"
              title={displayTopic}
            >
              {displayTopic}
            </h1>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Content Type Selector */}
            <div className="flex items-center">
              <DropdownErrorBoundary>
                <select
                  value={selectedContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[100px] sm:min-w-[120px] md:min-w-[140px]"
                  aria-label="Select content type to learn"
                  aria-describedby="content-selector-help-desktop"
                  id="content-type-selector-desktop"
                  disabled={isLoading}
                >
                  <option value="" disabled>
                    {isLoading ? 'Loading...' : 'Select Content'}
                  </option>
                  <option value={CONTENT_TYPES.VERBS}>Verbs</option>
                  <option value={CONTENT_TYPES.COLORS}>Colors</option>
                  <option value={CONTENT_TYPES.NOUNS}>Nouns</option>
                  <option value={CONTENT_TYPES.PHRASES}>Phrases</option>
                </select>
              </DropdownErrorBoundary>
              <span id="content-selector-help-desktop" className="sr-only">
                Choose the type of Arabic content you want to practice
              </span>
            </div>

            {/* Game Type Selector */}
            <div className="flex items-center">
              <DropdownErrorBoundary>
                <select
                  value={isCurrentGameValid ? selectedGame : ''}
                  onChange={(e) => handleGameChange(e.target.value)}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[120px] sm:min-w-[140px] md:min-w-[160px]"
                  aria-label="Select game type to play"
                  aria-describedby="game-selector-help-desktop"
                  id="game-type-selector-desktop"
                  disabled={!selectedContent || availableGames.length === 0 || isLoading}
                >
                  <option value="" disabled>
                    {isLoading ? 'Loading...' : !selectedContent ? 'Select Content First' : availableGames.length === 0 ? 'No Games Available' : 'Select Game'}
                  </option>
                  {availableGames.map((game) => (
                    <option key={game.value} value={game.value}>
                      {game.label}
                    </option>
                  ))}
                </select>
              </DropdownErrorBoundary>
              <span id="game-selector-help-desktop" className="sr-only">
                Choose the type of game you want to play with the selected content
              </span>
            </div>

            {/* Settings Button */}
            <div className="flex items-center">
              <button
                onClick={onSettingsClick}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-sm rounded-md border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  speechConfig.azure.isEnabled || speechConfig.elevenlabs.isEnabled
                    ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 focus:bg-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:bg-gray-50'
                }`}
                aria-label="Open settings"
                title={speechConfig.azure.isEnabled || speechConfig.elevenlabs.isEnabled ? 'Speech Active - Click to configure' : 'Configure speech settings'}
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
export { 
  getTopicDisplayName, 
  getAvailableGames, 
  isValidGameForContent,
  DropdownErrorBoundary,
  TOPIC_DISPLAY_NAMES, 
  CONTENT_TYPES, 
  GAME_TYPES 
};