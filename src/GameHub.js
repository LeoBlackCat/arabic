import React, { useState, useEffect } from 'react';
import App from './App';
import ImageChoiceGame from './ImageChoiceGame';
import PuzzleGame from './PuzzleGame';
import logicData from '../logic.json';

// Content types
const CONTENT_TYPES = {
  VERBS: 'verbs',
  COLORS: 'colors'
};

// Game types (excluding anime conversation game)
const GAME_TYPES = {
  SPEECH: 'speech',
  IMAGE_CHOICE: 'image_choice', 
  PUZZLE: 'puzzle'
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

  // Load content data based on selection
  useEffect(() => {
    const loadContentData = () => {
      let data = [];
      
      if (selectedContent === CONTENT_TYPES.VERBS) {
        // Get verbs from logic.json (items with pos="verb")
        data = logicData.items
          .filter(item => item.pos === 'verb')
          .map(item => ({
            ...item,
            url: `/pictures/${item.chat.toLowerCase()}.png`,
            path: `${item.chat.toLowerCase()}.png`,
            hasImage: true
          }));
      } else if (selectedContent === CONTENT_TYPES.COLORS) {
        // Get colors from logic.json (items with type="colors")
        data = logicData.items
          .filter(item => item.type === 'colors')
          .map(item => ({
            ...item,
            color: COLOR_MAP[item.chat] || '#CCCCCC',
            hasImage: false
          }));
      }
      
      console.log(`Loaded ${data.length} ${selectedContent} items:`, data);
      setContentData(data);
    };

    loadContentData();
  }, [selectedContent]);

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
                  <option value={GAME_TYPES.SPEECH}>Speech Recognition</option>
                  <option value={GAME_TYPES.IMAGE_CHOICE}>Image Choice</option>
                  <option value={GAME_TYPES.PUZZLE}>Puzzle Game</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content info */}
          <div className="mt-2 text-sm text-gray-600">
            {contentData.length > 0 && (
              <span>
                {contentData.length} {selectedContent} loaded • 
                Playing: {selectedGame.replace('_', ' ')}
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
    </div>
  );
};

export { CONTENT_TYPES, GAME_TYPES, COLOR_MAP };
export default GameHub;