import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ImageChoiceGame from './ImageChoiceGame';
import PuzzleGame from './PuzzleGame';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

function Root() {
  const [game, setGame] = useState('speak');
  return (
    <>
      <div className="flex justify-center gap-4 my-4">
        <button
          onClick={() => setGame('speak')}
          className={`px-4 py-2 rounded text-white font-semibold transition ${game === 'speak' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          🎤 Game 1: Speak
        </button>
        <button
          onClick={() => setGame('choose')}
          className={`px-4 py-2 rounded text-white font-semibold transition ${game === 'choose' ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          🖼️ Game 2: Choose Image
        </button>
        <button
          onClick={() => setGame('puzzle')}
          className={`px-4 py-2 rounded text-white font-semibold transition ${game === 'puzzle' ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          🔲 Game 3: Puzzle
        </button>
      </div>
      {game === 'speak' ? <App /> : game === 'choose' ? <ImageChoiceGame /> : <PuzzleGame /> }
    </>
  );
}

root.render(<Root />);
