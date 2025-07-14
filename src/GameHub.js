import React, { useState, useEffect } from 'react';
import App from './App';
import ImageChoiceGame from './ImageChoiceGame';
import PuzzleGame from './PuzzleGame';
import ConjugationGame from './ConjugationGame';
import PossessiveGame from './PossessiveGame';
import ColorNounGame from './ColorNounGame';
import SentenceGame from './SentenceGame';
import ArabicWritingGame from './ArabicWritingGame';
import SpeedTranslationGame from './SpeedTranslationGame';
import GrammarPatternGame from './GrammarPatternGame';
import PhraseGame from './PhraseGame';
import AzureSpeechConfig from './AzureSpeechConfig';
import logicData from '../logic.json';
import mediaManifest from './mediaManifest.json';
import { getAzureSpeechConfig } from './azureSpeechHelper';

// Content types
const CONTENT_TYPES = {
  VERBS: 'verbs',
  COLORS: 'colors',
  NOUNS: 'nouns',
  PHRASES: 'phrases'
};

// Game types (excluding anime conversation game)
const GAME_TYPES = {
  SPEECH: 'speech',
  IMAGE_CHOICE: 'image_choice', 
  PUZZLE: 'puzzle',
  CONJUGATION: 'conjugation',
  POSSESSIVE: 'possessive',
  COLOR_NOUN: 'color_noun',
  SENTENCE: 'sentence',
  ARABIC_WRITING: 'arabic_writing',
  SPEED_TRANSLATION: 'speed_translation',
  GRAMMAR_PATTERN: 'grammar_pattern',
  PHRASE: 'phrase'
};

// Color mapping for HTML colors
const COLOR_MAP = {
  'a7mar': '#FF0000',     // Red
  'asfar': '#FFFF00',     // Yellow  
  'azrag': '#0000FF',     // Blue
  'abyadh': '#FFFFFF',    // White
  'aswad': '#000000',     // Black
  'akhdhar': '#00FF00',   // Green
  'rusasee': '#808080',   // Gray
  'wardee': '#FFC0CB',    // Pink
  'banafsajee': '#800080', // Purple
  'bonnee': '#8B4513',    // Brown
  'burtuqalee': '#FFA500', // Orange
  'fedhee': '#C0C0C0',    // Silver
  'thahabee': '#FFD700'   // Golden
};

const GameHub = () => {
  const [selectedContent, setSelectedContent] = useState(CONTENT_TYPES.VERBS);
  const [selectedGame, setSelectedGame] = useState(GAME_TYPES.SPEECH);
  const [contentData, setContentData] = useState([]);
  const [showAzureConfig, setShowAzureConfig] = useState(false);
  const [speechConfig, setSpeechConfig] = useState({ 
    azure: { isEnabled: false, apiKey: '', region: 'eastus' },
    elevenlabs: { isEnabled: false, apiKey: '', voiceId: 'DANw8bnAVbjDEHwZIoYa' }
  });

  // Get all data types for grammar pattern game
  const getAllGrammarData = () => {
    const allData = [];
    
    // Get verbs (for conjugation patterns)
    const verbs = logicData.items.filter(item => item.pos === 'verb');
    const alternateVerbIds = new Set();
    verbs.forEach(verb => {
      if (verb.alternate) {
        alternateVerbIds.add(verb.alternate);
      }
    });
    const filteredVerbs = verbs.filter(verb => !alternateVerbIds.has(verb.id));
    allData.push(...filteredVerbs);
    
    // Get nouns (for possessive patterns and gender agreement)
    const nouns = logicData.items.filter(item => item.pos === 'noun');
    const alternateNounIds = new Set();
    nouns.forEach(noun => {
      if (noun.alternate) {
        alternateNounIds.add(noun.alternate);
      }
    });
    const filteredNouns = nouns.filter(noun => !alternateNounIds.has(noun.id));
    allData.push(...filteredNouns);
    
    // Get colors (for gender agreement patterns)
    const colors = logicData.items.filter(item => item.type === 'colors');
    allData.push(...colors);
    
    return allData;
  };

  // Get available games based on content type
  const getAvailableGames = (contentType) => {
    switch (contentType) {
      case CONTENT_TYPES.VERBS:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.CONJUGATION, label: 'Conjugation Practice' },
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
          { value: GAME_TYPES.SPEED_TRANSLATION, label: 'Speed Translation' }
        ];
      default:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.ARABIC_WRITING, label: 'Arabic Writing' },
          { value: GAME_TYPES.SPEED_TRANSLATION, label: 'Speed Translation' }
        ];
    }
  };

  // Load speech configuration on mount
  useEffect(() => {
    const azureConfig = getAzureSpeechConfig();
    setSpeechConfig(prev => ({
      ...prev,
      azure: azureConfig
    }));
  }, []);

  // Load content data based on selection
  useEffect(() => {
    const loadContentData = () => {
      let data = [];
      
      if (selectedContent === CONTENT_TYPES.VERBS) {
        // Get verbs from logic.json that have media files available
        const allVerbs = logicData.items.filter(item => item.pos === 'verb');
        
        // Filter out alternate verbs - only keep verbs that don't have an 'alternate' field pointing TO them
        const alternateVerbIds = new Set();
        allVerbs.forEach(verb => {
          if (verb.alternate) {
            // This verb points to an alternate, so mark the alternate for removal
            alternateVerbIds.add(verb.alternate);
          }
        });
        
        // Show: only verbs that are not alternates and have media files
        data = allVerbs
          .filter(verb => !alternateVerbIds.has(verb.id)) // Don't show alternate verbs
          .filter(item => {
            // Check if this verb has media files available
            const manifestItem = mediaManifest.items[item.chat];
            return manifestItem && manifestItem.hasAnyMedia;
          })
          .map(item => {
            const manifestItem = mediaManifest.items[item.chat];
            return {
              ...item,
              url: `/pictures/${item.chat.toLowerCase()}.png`,
              path: `${item.chat.toLowerCase()}.png`,
              hasImage: manifestItem.hasImage,
              hasVideo: manifestItem.hasVideo,
              availableFormats: manifestItem.availableFormats
            };
          });
          
        console.log(`[GameHub] Filtered ${allVerbs.length} verbs to ${data.length} (removed ${alternateVerbIds.size} alternates)`);
      } else if (selectedContent === CONTENT_TYPES.COLORS) {
        // Get colors from logic.json (always available via HTML colors)
        data = logicData.items
          .filter(item => item.type === 'colors')
          .map(item => ({
            ...item,
            color: COLOR_MAP[item.chat] || '#CCCCCC',
            hasImage: false,
            hasVideo: false,
            availableFormats: ['color']
          }));
      } else if (selectedContent === CONTENT_TYPES.NOUNS) {
        // Get nouns from logic.json that have media files available
        const allNouns = logicData.items.filter(item => item.pos === 'noun');
        
        // Filter out alternate nouns - only keep nouns that don't have an 'alternate' field pointing TO them
        const alternateNounIds = new Set();
        allNouns.forEach(noun => {
          if (noun.alternate) {
            // This noun points to an alternate, so mark the alternate for removal
            alternateNounIds.add(noun.alternate);
          }
        });
        
        // Show: only nouns that are not alternates and have media files
        data = allNouns
          .filter(noun => !alternateNounIds.has(noun.id)) // Don't show alternate nouns
          .filter(item => {
            // Check if this noun has media files available
            const manifestItem = mediaManifest.items[item.chat];
            return manifestItem && manifestItem.hasAnyMedia;
          })
          .map(item => {
            const manifestItem = mediaManifest.items[item.chat];
            return {
              ...item,
              url: `/pictures/${item.chat.toLowerCase()}.png`,
              path: `${item.chat.toLowerCase()}.png`,
              hasImage: manifestItem.hasImage,
              hasVideo: manifestItem.hasVideo,
              availableFormats: manifestItem.availableFormats
            };
          });
          
        console.log(`[GameHub] Filtered ${allNouns.length} nouns to ${data.length} (removed ${alternateNounIds.size} alternates)`);
      } else if (selectedContent === CONTENT_TYPES.PHRASES) {
        // Get phrases from logic.json
        data = logicData.items
          .filter(item => item.type === 'phrase')
          .map(item => ({
            ...item,
            hasImage: false,
            hasVideo: false,
            availableFormats: ['text']
          }));
      }
      
      console.log(`Loaded ${data.length} ${selectedContent} items:`, data);
      setContentData(data);
    };

    loadContentData();
  }, [selectedContent]);

  // Reset selected game when content type changes to ensure valid combinations
  useEffect(() => {
    const availableGames = getAvailableGames(selectedContent);
    if (!availableGames.find(game => game.value === selectedGame)) {
      setSelectedGame(availableGames[0].value);
    }
  }, [selectedContent, selectedGame]);

  // Render the selected game component
  const renderGame = () => {
    const commonProps = {
      contentData,
      contentType: selectedContent,
      colorMap: COLOR_MAP
    };

    switch (selectedGame) {
      case GAME_TYPES.SPEECH:
        return <App {...commonProps} />;
      case GAME_TYPES.IMAGE_CHOICE:
        return <ImageChoiceGame {...commonProps} />;
      case GAME_TYPES.PUZZLE:
        return <PuzzleGame {...commonProps} />;
      case GAME_TYPES.CONJUGATION:
        return <ConjugationGame {...commonProps} />;
      case GAME_TYPES.POSSESSIVE:
        return <PossessiveGame {...commonProps} />;
      case GAME_TYPES.COLOR_NOUN:
        return <ColorNounGame {...commonProps} />;
      case GAME_TYPES.SENTENCE:
        return <SentenceGame {...commonProps} />;
      case GAME_TYPES.ARABIC_WRITING:
        return <ArabicWritingGame {...commonProps} />;
      case GAME_TYPES.SPEED_TRANSLATION:
        return <SpeedTranslationGame {...commonProps} />;
      case GAME_TYPES.GRAMMAR_PATTERN:
        return <GrammarPatternGame contentData={getAllGrammarData()} contentType={selectedContent} />;
      case GAME_TYPES.PHRASE:
        return <PhraseGame {...commonProps} />;
      default:
        return <App {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with dropdowns */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Arabic Learning Games
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Content Type Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Content:
                </label>
                <select
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={CONTENT_TYPES.VERBS}>Verbs</option>
                  <option value={CONTENT_TYPES.COLORS}>Colors</option>
                  <option value={CONTENT_TYPES.NOUNS}>Nouns</option>
                  <option value={CONTENT_TYPES.PHRASES}>Phrases</option>
                </select>
              </div>

              {/* Game Type Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Game:
                </label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getAvailableGames(selectedContent).map(game => (
                    <option key={game.value} value={game.value}>
                      {game.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speech Configuration Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAzureConfig(true)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    speechConfig.azure.isEnabled || speechConfig.elevenlabs.isEnabled
                      ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🎤 {speechConfig.azure.isEnabled || speechConfig.elevenlabs.isEnabled ? 'Speech Active' : 'Speech Config'}
                </button>
              </div>
            </div>
          </div>

          {/* Content info */}
          <div className="mt-2 text-sm text-gray-600">
            {contentData.length > 0 && (
              <span>
                {contentData.length} {selectedContent} with media files • 
                Playing: {selectedGame.replace('_', ' ').replace('color noun', 'Color+Noun')}
                {speechConfig.azure.isEnabled && (
                  <span className="ml-2 text-green-600">
                    • Azure Speech enabled
                  </span>
                )}
                {speechConfig.elevenlabs.isEnabled && (
                  <span className="ml-2 text-green-600">
                    • ElevenLabs TTS enabled
                  </span>
                )}
                {(selectedContent === CONTENT_TYPES.VERBS || selectedContent === CONTENT_TYPES.NOUNS) && (
                  <span className="ml-2 text-blue-600">
                    ({contentData.filter(item => item.hasVideo).length} with video)
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Game content */}
      <div className="flex-1">
        {contentData.length > 0 ? (
          renderGame()
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-lg text-gray-600 mb-2">
                Loading {selectedContent}...
              </div>
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      {/* Speech Configuration Modal */}
      <AzureSpeechConfig
        isOpen={showAzureConfig}
        onClose={() => setShowAzureConfig(false)}
        onConfigChange={(config) => {
          setSpeechConfig(config);
          console.log('Speech config updated:', config);
        }}
      />
    </div>
  );
};

export { CONTENT_TYPES, GAME_TYPES, COLOR_MAP };
export default GameHub;