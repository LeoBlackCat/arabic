import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { getThemeClass, applyTheme, createTransition } from './utils/themeUtils.js';
import { animateElement, staggerAnimation } from './utils/animationUtils.js';
import { ArabicText, ArabiziText } from './components/LanguageText.js';
import TouchOptimizedButton from './components/TouchOptimizedButton.js';
import BottomSheet from './components/BottomSheet.js';
import { isTouchDevice } from './utils/touchUtils.js';

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
 * 
 * Optimized with React.memo for performance and enhanced accessibility features.
 */
const TitleBar = React.memo(({
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
  // Mobile-specific state
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [isTouch] = useState(isTouchDevice());
  // Memoize the topic name calculation to prevent unnecessary recalculations
  const displayTopic = useMemo(() => 
    currentTopic || getTopicDisplayName(selectedContent, contentData, isLoading),
    [currentTopic, selectedContent, contentData, isLoading]
  );
  
  // Memoize available games calculation
  const availableGames = useMemo(() => 
    getAvailableGames(selectedContent),
    [selectedContent]
  );
  
  // Memoize game validation
  const isCurrentGameValid = useMemo(() => 
    isValidGameForContent(selectedGame, selectedContent),
    [selectedGame, selectedContent]
  );

  // Memoize speech service status for settings button styling
  const isSpeechActive = useMemo(() => 
    speechConfig?.azure?.isEnabled || speechConfig?.elevenlabs?.isEnabled,
    [speechConfig?.azure?.isEnabled, speechConfig?.elevenlabs?.isEnabled]
  );
  
  // Refs for animation and theming
  const titleBarRef = useRef(null);
  const topicRef = useRef(null);
  const controlsRef = useRef(null);
  
  // Memoize theme class for content-aware styling
  const themeClass = useMemo(() => 
    getThemeClass(selectedContent),
    [selectedContent]
  );
  
  // Apply theme to titlebar when content changes
  useEffect(() => {
    if (titleBarRef.current && selectedContent) {
      applyTheme(titleBarRef.current, selectedContent);
    }
  }, [selectedContent]);
  
  // Animate topic name when it changes
  useEffect(() => {
    if (topicRef.current && displayTopic && !isLoading) {
      animateElement(topicRef.current, 'fadeInUp', { duration: 300 });
    }
  }, [displayTopic, isLoading]);
  
  // Animate controls when they become available
  useEffect(() => {
    if (controlsRef.current && selectedContent && !isLoading) {
      const controls = controlsRef.current.querySelectorAll('select, button');
      staggerAnimation(controls, 'fadeInUp', 50, { duration: 200 });
    }
  }, [selectedContent, isLoading]);
  
  // Memoized content change handler with useCallback to prevent unnecessary re-renders
  const handleContentChange = useCallback((newContent) => {
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
  }, [onContentChange, onGameChange, selectedGame]);
  
  // Memoized game change handler with useCallback
  const handleGameChange = useCallback((newGame) => {
    try {
      if (isValidGameForContent(newGame, selectedContent)) {
        onGameChange(newGame);
      } else {
        console.warn('Invalid game selection:', newGame, 'for content:', selectedContent);
      }
    } catch (error) {
      console.error('Error handling game change:', error);
    }
  }, [onGameChange, selectedContent]);

  // Keyboard navigation handler for enhanced accessibility
  const handleKeyDown = useCallback((event, action) => {
    // Handle Enter and Space key presses for button-like behavior
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
    // Handle Escape key to close dropdowns (native select behavior)
    if (event.key === 'Escape') {
      event.target.blur();
    }
  }, []);

  return (
    <div 
      ref={titleBarRef}
      className={`nav-bar glass transition-all duration-300 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 ${themeClass}`}
      role="banner"
      aria-label="Navigation titlebar"
    >
      <div className="max-w-4xl mx-auto">
        {/* Mobile Layout: Stacked elements for screens < 640px */}
        <div className="sm:hidden">
          {/* Top row: Topic name and settings */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h1 
                ref={topicRef}
                className="text-lg font-bold text-neutral-800 truncate text-gradient"
                title={displayTopic}
                aria-live="polite"
                aria-atomic="true"
                id="current-topic-mobile"
              >
                {displayTopic}
              </h1>
            </div>
            <TouchOptimizedButton
              onClick={isTouch ? () => setShowMobileSettings(true) : onSettingsClick}
              variant={isSpeechActive ? 'primary' : 'ghost'}
              size="medium"
              className="ml-3"
              aria-label={`Open settings panel. Speech services are currently ${isSpeechActive ? 'active' : 'inactive'}`}
              aria-describedby="settings-button-help-mobile"
              hapticFeedback={true}
            >
              <span aria-hidden="true">⚙️</span>
              <span className="sr-only">Settings</span>
            </TouchOptimizedButton>
            <span id="settings-button-help-mobile" className="sr-only">
              Configure speech recognition and text-to-speech settings for the learning games
            </span>
          </div>
          
          {/* Bottom row: Selectors */}
          <div ref={controlsRef} className="flex gap-2" role="group" aria-label="Content and game selection controls">
            <div className="flex-1">
              <DropdownErrorBoundary>
                <select
                  value={selectedContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => {})}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-transparent bg-white hover:bg-neutral-50 transition-all cursor-pointer touch-manipulation hover:shadow-md"
                  aria-label="Select content type to learn"
                  aria-describedby="content-selector-help"
                  id="content-type-selector"
                  disabled={isLoading}
                  aria-required="true"
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
                  onKeyDown={(e) => handleKeyDown(e, () => {})}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-transparent bg-white hover:bg-neutral-50 transition-all cursor-pointer touch-manipulation hover:shadow-md"
                  aria-label="Select game type to play"
                  aria-describedby="game-selector-help"
                  id="game-type-selector"
                  disabled={!selectedContent || availableGames.length === 0 || isLoading}
                  aria-required="true"
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
            Choose the type of Arabic content you want to practice. This selection will determine which games are available.
          </span>
          <span id="game-selector-help" className="sr-only">
            Choose the type of game you want to play with the selected content. Different content types offer different game options.
          </span>
        </div>

        {/* Tablet and Desktop Layout: Single row for screens ≥ 640px */}
        <div className="hidden sm:flex items-center justify-between gap-3 md:gap-4" role="navigation" aria-label="Main navigation controls">
          {/* Topic Name Display */}
          <div className="flex-shrink-0 min-w-0 max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[400px]">
            <h1 
              className="text-lg sm:text-xl font-bold text-neutral-800 truncate text-gradient"
              title={displayTopic}
              aria-live="polite"
              aria-atomic="true"
              id="current-topic-desktop"
            >
              {displayTopic}
            </h1>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" role="group" aria-label="Content and game selection controls">
            {/* Content Type Selector */}
            <div className="flex items-center">
              <DropdownErrorBoundary>
                <select
                  value={selectedContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => {})}
                  className="select px-2 py-1.5 sm:px-3 sm:py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-transparent bg-white hover:bg-neutral-50 transition-all cursor-pointer min-w-[100px] sm:min-w-[120px] md:min-w-[140px] hover:shadow-md"
                  aria-label="Select content type to learn"
                  aria-describedby="content-selector-help-desktop"
                  id="content-type-selector-desktop"
                  disabled={isLoading}
                  aria-required="true"
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
                Choose the type of Arabic content you want to practice. This selection will determine which games are available.
              </span>
            </div>

            {/* Game Type Selector */}
            <div className="flex items-center">
              <DropdownErrorBoundary>
                <select
                  value={isCurrentGameValid ? selectedGame : ''}
                  onChange={(e) => handleGameChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => {})}
                  className="select px-2 py-1.5 sm:px-3 sm:py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-transparent bg-white hover:bg-neutral-50 transition-all cursor-pointer min-w-[120px] sm:min-w-[140px] md:min-w-[160px] hover:shadow-md"
                  aria-label="Select game type to play"
                  aria-describedby="game-selector-help-desktop"
                  id="game-type-selector-desktop"
                  disabled={!selectedContent || availableGames.length === 0 || isLoading}
                  aria-required="true"
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
                Choose the type of game you want to play with the selected content. Different content types offer different game options.
              </span>
            </div>

            {/* Settings Button */}
            <div className="flex items-center">
              <button
                onClick={onSettingsClick}
                onKeyDown={(e) => handleKeyDown(e, onSettingsClick)}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-sm rounded-lg border transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:scale-105 ${
                  isSpeechActive
                    ? 'btn-primary shadow-primary' 
                    : 'btn-ghost hover:shadow-md'
                }`}
                aria-label={`Open settings panel. Speech services are currently ${isSpeechActive ? 'active' : 'inactive'}`}
                aria-describedby="settings-button-help-desktop"
                title={isSpeechActive ? 'Speech Active - Click to configure' : 'Configure speech settings'}
                type="button"
              >
                <span aria-hidden="true">⚙️</span>
                <span className="sr-only">Settings</span>
              </button>
              <span id="settings-button-help-desktop" className="sr-only">
                Configure speech recognition and text-to-speech settings for the learning games
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Settings Bottom Sheet */}
      <BottomSheet
        isOpen={showMobileSettings}
        onClose={() => setShowMobileSettings(false)}
        title="Settings"
        height="auto"
        maxHeight="80vh"
        showHandle={true}
        closeOnBackdrop={true}
        closeOnSwipeDown={true}
      >
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Speech Settings
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Configure your speech recognition and text-to-speech preferences
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <span className="font-medium text-neutral-800">Azure Speech</span>
                <p className="text-xs text-neutral-600">Microsoft speech services</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${speechConfig?.azure?.isEnabled ? 'bg-green-500' : 'bg-neutral-300'}`} />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <span className="font-medium text-neutral-800">ElevenLabs</span>
                <p className="text-xs text-neutral-600">AI voice synthesis</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${speechConfig?.elevenlabs?.isEnabled ? 'bg-green-500' : 'bg-neutral-300'}`} />
            </div>
          </div>
          
          <TouchOptimizedButton
            onClick={() => {
              setShowMobileSettings(false);
              onSettingsClick();
            }}
            variant="primary"
            size="large"
            className="w-full mt-6"
            hapticFeedback={true}
          >
            Open Full Settings
          </TouchOptimizedButton>
        </div>
      </BottomSheet>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo to optimize re-renders
  // Only re-render if props that actually affect the component have changed
  return (
    prevProps.selectedContent === nextProps.selectedContent &&
    prevProps.selectedGame === nextProps.selectedGame &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.currentTopic === nextProps.currentTopic &&
    prevProps.contentData?.length === nextProps.contentData?.length &&
    prevProps.speechConfig?.azure?.isEnabled === nextProps.speechConfig?.azure?.isEnabled &&
    prevProps.speechConfig?.elevenlabs?.isEnabled === nextProps.speechConfig?.elevenlabs?.isEnabled &&
    prevProps.onContentChange === nextProps.onContentChange &&
    prevProps.onGameChange === nextProps.onGameChange &&
    prevProps.onSettingsClick === nextProps.onSettingsClick
  );
});

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