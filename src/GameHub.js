import React, { useState, useEffect } from 'react';
import App from './App';
import ImageChoiceGame from './ImageChoiceGame';
import PuzzleGame from './PuzzleGame';
import ConjugationGame from './ConjugationGame';
import PossessiveGame from './PossessiveGame';
import AzureSpeechConfig from './AzureSpeechConfig';
import logicData from '../logic.json';
import mediaManifest from './mediaManifest.json';
import { getAzureSpeechConfig } from './azureSpeechHelper';

// Content types
const CONTENT_TYPES = {
  VERBS: 'verbs',
  COLORS: 'colors',
  NOUNS: 'nouns'
};

// Game types (excluding anime conversation game)
const GAME_TYPES = {
  SPEECH: 'speech',
  IMAGE_CHOICE: 'image_choice', 
  PUZZLE: 'puzzle',
  CONJUGATION: 'conjugation',
  POSSESSIVE: 'possessive'
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
  const [azureConfig, setAzureConfig] = useState({ isEnabled: false, apiKey: '', region: 'eastus' });

  // Get available games based on content type
  const getAvailableGames = (contentType) => {
    switch (contentType) {
      case CONTENT_TYPES.VERBS:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.CONJUGATION, label: 'Conjugation Practice' }
        ];
      case CONTENT_TYPES.COLORS:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' }
        ];
      case CONTENT_TYPES.NOUNS:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' },
          { value: GAME_TYPES.POSSESSIVE, label: 'Possessive Practice' }
        ];
      default:
        return [
          { value: GAME_TYPES.SPEECH, label: 'Speech Recognition' },
          { value: GAME_TYPES.IMAGE_CHOICE, label: 'Image Choice' },
          { value: GAME_TYPES.PUZZLE, label: 'Puzzle Game' }
        ];
    }
  };

  // Load Azure Speech configuration on mount
  useEffect(() => {
    const config = getAzureSpeechConfig();
    setAzureConfig(config);
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
      }
      
      console.log(`Loaded ${data.length} ${selectedContent} items (filtered by media availability):`, data);
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

              {/* Azure Speech Configuration Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAzureConfig(true)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    azureConfig.isEnabled 
                      ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🎤 {azureConfig.isEnabled ? 'Azure Speech' : 'Speech Config'}
                </button>
              </div>
            </div>
          </div>

          {/* Content info */}
          <div className="mt-2 text-sm text-gray-600">
            {contentData.length > 0 && (
              <span>
                {contentData.length} {selectedContent} with media files • 
                Playing: {selectedGame.replace('_', ' ')}
                {azureConfig.isEnabled && (
                  <span className="ml-2 text-green-600">
                    • Azure Speech enabled
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

      {/* Azure Speech Configuration Modal */}
      <AzureSpeechConfig
        isOpen={showAzureConfig}
        onClose={() => setShowAzureConfig(false)}
        onConfigChange={(config) => {
          setAzureConfig(config);
          console.log('Azure Speech config updated:', config);
        }}
      />
    </div>
  );
};

export { CONTENT_TYPES, GAME_TYPES, COLOR_MAP };
export default GameHub;