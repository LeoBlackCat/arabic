import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic } from './arabicUtils';

const SpeedTranslationGame = ({ contentData, contentType }) => {
  const [currentItem, setCurrentItem] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameMode, setGameMode] = useState('arabic_to_english');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [wordsPerMinute, setWordsPerMinute] = useState(0);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
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
    utterance.rate = 0.9;
    speechSynthRef.current.speak(utterance);
  }, [arabicVoice]);

  // Game timer
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameStarted) {
      endGame();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameStarted, timeLeft, gameOver]);

  const generateRandomItem = useCallback(() => {
    if (!contentData || contentData.length === 0) return null;
    
    const filteredData = contentData.filter(item => 
      item.ar && item.ar.trim() && item.eng && item.eng.trim() && item.chat && item.chat.trim()
    );
    
    if (filteredData.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * filteredData.length);
    return filteredData[randomIndex];
  }, [contentData]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setTimeLeft(60);
    setUserInput('');
    setStatusMsg(null);
    startTimeRef.current = Date.now();
    generateNewItem();
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    
    // Calculate words per minute
    const totalTime = (Date.now() - startTimeRef.current) / 1000 / 60; // in minutes
    const wpm = Math.round(score.correct / totalTime);
    setWordsPerMinute(wpm);
    
    if (streak > bestStreak) {
      setBestStreak(streak);
    }
  };

  const generateNewItem = () => {
    const newItem = generateRandomItem();
    setCurrentItem(newItem);
    setUserInput('');
    
    // Auto-speak in audio mode
    if (gameMode === 'audio_to_english' && newItem) {
      setTimeout(() => speakWord(newItem.ar), 100);
    }
    
    // Focus input after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const checkAnswer = () => {
    if (!currentItem || !userInput.trim()) return;

    const normalizedInput = userInput.trim().toLowerCase();
    let expectedAnswer = '';
    let isCorrect = false;

    switch (gameMode) {
      case 'arabic_to_english':
        expectedAnswer = currentItem.eng.toLowerCase();
        isCorrect = normalizedInput === expectedAnswer;
        break;
      case 'english_to_arabic':
        expectedAnswer = normalizeArabic(currentItem.ar);
        isCorrect = normalizeArabic(normalizedInput) === expectedAnswer;
        break;
      case 'chat_to_arabic':
        expectedAnswer = normalizeArabic(currentItem.ar);
        isCorrect = normalizeArabic(normalizedInput) === expectedAnswer;
        break;
      case 'audio_to_english':
        expectedAnswer = currentItem.eng.toLowerCase();
        isCorrect = normalizedInput === expectedAnswer;
        break;
      default:
        break;
    }

    const newScore = { ...score, total: score.total + 1 };
    
    if (isCorrect) {
      newScore.correct = score.correct + 1;
      setScore(newScore);
      setStreak(streak + 1);
      setStatusMsg(`✅ Correct! +${getStreakBonus()}`);
      
      // Quick success feedback
      setTimeout(() => {
        generateNewItem();
        setStatusMsg(null);
      }, 800);
    } else {
      setScore(newScore);
      setStreak(0);
      setStatusMsg(`❌ Wrong! Answer: ${getCorrectAnswerForDisplay()}`);
      
      // Show correct answer briefly
      setTimeout(() => {
        generateNewItem();
        setStatusMsg(null);
      }, 1500);
    }
  };

  const getStreakBonus = () => {
    if (streak >= 10) return '🔥🔥🔥';
    if (streak >= 5) return '🔥🔥';
    if (streak >= 3) return '🔥';
    return '';
  };

  const getCorrectAnswerForDisplay = () => {
    if (!currentItem) return '';
    
    switch (gameMode) {
      case 'arabic_to_english':
      case 'audio_to_english':
        return currentItem.eng;
      case 'english_to_arabic':
      case 'chat_to_arabic':
        return currentItem.ar;
      default:
        return '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  const getPromptText = () => {
    if (!currentItem) return '';
    
    switch (gameMode) {
      case 'arabic_to_english':
        return currentItem.ar;
      case 'english_to_arabic':
        return currentItem.eng;
      case 'chat_to_arabic':
        return currentItem.chat;
      case 'audio_to_english':
        return '🔊 Listen and translate';
      default:
        return '';
    }
  };

  const getPlaceholder = () => {
    switch (gameMode) {
      case 'arabic_to_english':
      case 'audio_to_english':
        return 'Type English translation...';
      case 'english_to_arabic':
      case 'chat_to_arabic':
        return 'اكتب بالعربية...';
      default:
        return 'Type answer...';
    }
  };

  const getGameModeLabel = () => {
    switch (gameMode) {
      case 'arabic_to_english':
        return 'Arabic → English';
      case 'english_to_arabic':
        return 'English → Arabic';
      case 'chat_to_arabic':
        return 'Romanized → Arabic';
      case 'audio_to_english':
        return 'Audio → English';
      default:
        return 'Translation';
    }
  };

  const replayAudio = () => {
    if (currentItem && gameMode === 'audio_to_english') {
      speakWord(currentItem.ar);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Speed Translation Challenge
        </h2>
        {gameStarted && (
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">
              Score: {score.correct}/{score.total}
            </div>
            <div className="text-lg font-semibold">
              Streak: {streak} {getStreakBonus()}
            </div>
            <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-600'}`}>
              {timeLeft}s
            </div>
          </div>
        )}
      </div>

      {!gameStarted && !gameOver ? (
        /* Start Screen */
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">How to play:</h3>
            <div className="text-left space-y-2">
              <p>⚡ <strong>Speed Challenge:</strong> Translate as many words as possible in 60 seconds</p>
              <p>🔥 <strong>Streak System:</strong> Build consecutive correct answers for bonus points</p>
              <p>🎯 <strong>Multiple Modes:</strong> Choose your preferred translation direction</p>
              <p>📊 <strong>Performance Tracking:</strong> Monitor your words per minute</p>
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Choose Game Mode:</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={() => setGameMode('arabic_to_english')}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  gameMode === 'arabic_to_english' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Arabic → English</div>
                <div className="text-sm text-gray-600">Read Arabic, type English</div>
              </button>
              <button
                onClick={() => setGameMode('english_to_arabic')}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  gameMode === 'english_to_arabic' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">English → Arabic</div>
                <div className="text-sm text-gray-600">Read English, type Arabic</div>
              </button>
              <button
                onClick={() => setGameMode('chat_to_arabic')}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  gameMode === 'chat_to_arabic' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Romanized → Arabic</div>
                <div className="text-sm text-gray-600">Read romanized, type Arabic</div>
              </button>
              <button
                onClick={() => setGameMode('audio_to_english')}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  gameMode === 'audio_to_english' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Audio → English</div>
                <div className="text-sm text-gray-600">Listen to Arabic, type English</div>
              </button>
            </div>
          </div>

          {bestStreak > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-lg font-semibold">
                🏆 Best Streak: {bestStreak} consecutive correct answers!
              </div>
            </div>
          )}
          
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xl font-semibold"
          >
            ⚡ Start Speed Challenge
          </button>
        </div>
      ) : gameOver ? (
        /* Game Over Screen */
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-green-700 mb-4">🎉 Game Complete!</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-lg font-semibold">Final Score:</div>
                <div className="text-3xl font-bold text-green-600">
                  {score.correct}/{score.total}
                </div>
                <div className="text-sm text-gray-600">
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}% accuracy
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold">Performance:</div>
                <div className="text-2xl font-bold text-blue-600">
                  {wordsPerMinute} WPM
                </div>
                <div className="text-sm text-gray-600">
                  Best streak: {bestStreak}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-medium">Mode: {getGameModeLabel()}</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => {
                setGameOver(false);
                setGameStarted(false);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              🎮 Change Mode
            </button>
          </div>
        </div>
      ) : (
        /* Game Screen */
        currentItem && (
          <div className="space-y-6">
            {/* Game Mode Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-700">
                Mode: {getGameModeLabel()}
              </div>
            </div>

            {/* Current Challenge */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                <div className="text-4xl font-bold text-blue-600" 
                     style={{direction: gameMode.includes('arabic') && gameMode !== 'english_to_arabic' ? 'rtl' : 'ltr'}}>
                  {getPromptText()}
                </div>
                
                {gameMode === 'audio_to_english' && (
                  <button
                    onClick={replayAudio}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    🔊 Replay Audio
                  </button>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border rounded-lg p-4">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
                className="w-full px-4 py-3 text-2xl border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{direction: gameMode.includes('arabic') && gameMode !== 'arabic_to_english' ? 'rtl' : 'ltr'}}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={checkAnswer}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
              >
                ✓ Submit
              </button>
              
              <button
                onClick={generateNewItem}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ⏭️ Skip
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

export default SpeedTranslationGame;