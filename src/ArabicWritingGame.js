import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic, checkPronunciation } from './arabicUtils';

const ArabicWritingGame = ({ contentData, contentType }) => {
  const [currentItem, setCurrentItem] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [difficulty, setDifficulty] = useState('beginner');
  const [mode, setMode] = useState('type'); // 'type' or 'recognize'

  const inputRef = useRef(null);
  const speechSynthRef = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthRef.current.getVoices();
      const arVoice = voices.find(v => v.lang.includes('ar') || v.name.toLowerCase().includes('arabic'));
      setArabicVoice(arVoice || voices[0]);
    };
    speechSynthRef.current.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      speechSynthRef.current.onvoiceschanged = null;
    };
  }, []);

  const speakWord = useCallback((text) => {
    if (!text) return;
    speechSynthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (arabicVoice) utterance.voice = arabicVoice;
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    speechSynthRef.current.speak(utterance);
  }, [arabicVoice]);

  const generateRandomItem = useCallback(() => {
    if (!contentData || contentData.length === 0) return null;
    
    const filteredData = contentData.filter(item => 
      item.ar && item.ar.trim() && item.eng && item.eng.trim()
    );
    
    if (filteredData.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * filteredData.length);
    return filteredData[randomIndex];
  }, [contentData]);

  const startGame = () => {
    setGameStarted(true);
    setScore({ correct: 0, total: 0 });
    setUserInput('');
    setStatusMsg(null);
    setShowHint(false);
    generateNewItem();
  };

  const generateNewItem = () => {
    const newItem = generateRandomItem();
    setCurrentItem(newItem);
    setUserInput('');
    setShowHint(false);
    setStatusMsg(null);
    
    // Focus input after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const checkAnswer = () => {
    if (!currentItem || !userInput.trim()) return;

    const normalizedInput = normalizeArabic(userInput.trim());
    const normalizedAnswer = normalizeArabic(currentItem.ar);
    
    const newScore = { ...score, total: score.total + 1 };
    
    if (mode === 'type') {
      // Check if typed Arabic matches
      const isCorrect = normalizedInput === normalizedAnswer;
      
      if (isCorrect) {
        newScore.correct = score.correct + 1;
        setScore(newScore);
        setStatusMsg('✅ Perfect! You wrote it correctly!');
        speakWord(currentItem.ar);
        
        setTimeout(() => {
          generateNewItem();
        }, 2000);
      } else {
        setScore(newScore);
        
        // Check partial match
        const similarity = calculateSimilarity(normalizedInput, normalizedAnswer);
        if (similarity > 0.6) {
          setStatusMsg(`❌ Very close! (${Math.round(similarity * 100)}% correct) - Try again`);
        } else {
          setStatusMsg('❌ Not quite right - Try again or use hint');
        }
        
        setTimeout(() => {
          setStatusMsg(null);
        }, 3000);
      }
    } else {
      // Recognition mode - check if user input matches English
      const isCorrect = userInput.toLowerCase().trim() === currentItem.eng.toLowerCase().trim();
      
      if (isCorrect) {
        newScore.correct = score.correct + 1;
        setScore(newScore);
        setStatusMsg('✅ Correct translation!');
        speakWord(currentItem.ar);
        
        setTimeout(() => {
          generateNewItem();
        }, 2000);
      } else {
        setScore(newScore);
        setStatusMsg('❌ Try again - What does this mean in English?');
        
        setTimeout(() => {
          setStatusMsg(null);
        }, 3000);
      }
    }
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / maxLen;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const playAudio = () => {
    if (currentItem) {
      speakWord(currentItem.ar);
    }
  };

  const skipCurrent = () => {
    generateNewItem();
  };

  const getDifficultyItems = () => {
    if (!contentData) return [];
    
    switch (difficulty) {
      case 'beginner':
        return contentData.filter(item => item.ar && item.ar.length <= 6);
      case 'intermediate':
        return contentData.filter(item => item.ar && item.ar.length > 6 && item.ar.length <= 12);
      case 'advanced':
        return contentData.filter(item => item.ar && item.ar.length > 12);
      default:
        return contentData;
    }
  };

  const getPlaceholder = () => {
    if (mode === 'type') {
      return 'اكتب الكلمة بالعربية...';
    } else {
      return 'Type the English meaning...';
    }
  };

  const getPromptText = () => {
    if (!currentItem) return '';
    
    if (mode === 'type') {
      return `Write in Arabic: "${currentItem.eng}"`;
    } else {
      return `What does this mean in English?`;
    }
  };

  const getExpectedAnswer = () => {
    if (!currentItem) return '';
    return mode === 'type' ? currentItem.ar : currentItem.eng;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Arabic Writing Game
        </h2>
        {gameStarted && (
          <div className="text-lg font-semibold">
            Score: {score.correct}/{score.total}
            {score.total > 0 && (
              <span className="text-sm text-gray-600 ml-2">
                ({Math.round((score.correct / score.total) * 100)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {!gameStarted ? (
        /* Start Screen */
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">How to play:</h3>
            <div className="text-left space-y-2">
              <p>✍️ <strong>Writing Mode:</strong> See English word, type Arabic script</p>
              <p>👁️ <strong>Reading Mode:</strong> See Arabic script, type English meaning</p>
              <p>🎯 <strong>Practice:</strong> Arabic script recognition and writing</p>
              <p>💡 <strong>Hints:</strong> Available when you need help</p>
            </div>
          </div>

          {/* Game Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Game Settings</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mode:</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="type">Writing Mode (English → Arabic)</option>
                  <option value="recognize">Reading Mode (Arabic → English)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner (Short words)</option>
                  <option value="intermediate">Intermediate (Medium words)</option>
                  <option value="advanced">Advanced (Long words)</option>
                </select>
              </div>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xl font-semibold"
          >
            ✍️ Start Writing Practice
          </button>
        </div>
      ) : (
        /* Game Screen */
        currentItem && (
          <div className="space-y-6">
            {/* Current Challenge */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{getPromptText()}</h3>
              
              {mode === 'type' ? (
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {currentItem.eng}
                  </div>
                  <div className="text-sm text-gray-600">
                    ({currentItem.chat})
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-blue-600" style={{direction: 'rtl'}}>
                    {currentItem.ar}
                  </div>
                  <div className="text-sm text-gray-600">
                    ({currentItem.chat})
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border rounded-lg p-4">
              <div className="space-y-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getPlaceholder()}
                  className="w-full px-4 py-3 text-2xl border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{direction: mode === 'type' ? 'rtl' : 'ltr'}}
                />
                
                {showHint && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="text-sm text-yellow-700 mb-1">Hint:</div>
                    <div className="text-lg font-semibold">
                      {getExpectedAnswer()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={checkAnswer}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
              >
                ✓ Check Answer
              </button>
              
              <button
                onClick={playAudio}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                🔊 Play Audio
              </button>
              
              <button
                onClick={toggleHint}
                className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                💡 {showHint ? 'Hide' : 'Show'} Hint
              </button>
              
              <button
                onClick={skipCurrent}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ⏭️ Skip
              </button>
              
              <button
                onClick={() => {
                  setGameStarted(false);
                  setCurrentItem(null);
                  setUserInput('');
                  setStatusMsg(null);
                }}
                className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                🏠 Menu
              </button>
            </div>

            {/* Status Message */}
            {statusMsg && (
              <div className="bg-white border rounded-lg p-4">
                <p className="text-lg font-bold">{statusMsg}</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default ArabicWritingGame;