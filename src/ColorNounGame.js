import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic, checkPronunciation } from './arabicUtils';
import logicData from '../logic.json';
import { isAzureSpeechAvailable, startAzureSpeechRecognition } from './azureSpeechHelper';

// Toggle: if true, play pre-generated WAV files located in /sounds; otherwise use browser TTS
const PLAY_AUDIO_FILES = true;

// Similarity threshold for pronunciation acceptance (0.5 = 50% similar)
const SIMILARITY_THRESHOLD = 0.5;

/**
 * Color-Noun Game Component
 * Shows colorful images and requires pronunciation of color + noun with proper gender agreement
 */
const ColorNounGame = () => {
  const [currentCombination, setCurrentCombination] = useState(null);
  const [combinations, setCombinations] = useState([]);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameStarted, setGameStarted] = useState(false);

  /** Speech-synthesis helpers */
  const speechSynthRef = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);

  /* -------------------- Initialize voices ------------------- */
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

  /* -------------------- Load combinations data ------------------- */
  useEffect(() => {
    // For now, create mock combinations until we have the real generated images
    const mockCombinations = createMockCombinations();
    setCombinations(mockCombinations);
    console.log('[ColorNounGame] Loaded combinations:', mockCombinations);
  }, []);

  // Create mock combinations from existing data
  const createMockCombinations = () => {
    const colors = logicData.items.filter(item => item.type === 'colors');
    const colorfulNouns = logicData.items.filter(item => 
      item.pos === 'noun' && item.colorful === true
    );

    const mockData = [];
    
    // Create a few combinations for testing
    const testCombinations = [
      { noun: 'sayyaarah', color: 'a7mar' }, // red car (feminine)
      { noun: 'motar', color: 'azrag' },     // blue car (masculine)
      { noun: 'bait', color: 'akhdhar' },    // green house
      { noun: 'shantah', color: 'aswad' },   // black bag (feminine)
      { noun: 'kitaab', color: 'asfar' },    // yellow book
    ];

    testCombinations.forEach(combo => {
      const noun = colorfulNouns.find(n => n.chat === combo.noun);
      const color = colors.find(c => c.chat === combo.color);
      
      if (noun && color) {
        const isNounFeminine = noun.gender === 'f';
        const colorForm = isNounFeminine ? 
          { ar: color.ar_f, chat: color.chat_f } : 
          { ar: color.ar, chat: color.chat };

        mockData.push({
          id: `${noun.chat}_${color.chat}`,
          noun: noun.chat,
          color: color.chat,
          filename: `${noun.chat}_${color.chat}.png`,
          arabicPhrase: `${noun.ar} ${colorForm.ar}`,
          chatPhrase: `${noun.chat} ${colorForm.chat}`,
          englishPhrase: `${color.eng} ${noun.eng}`,
          nounGender: noun.gender,
          colorForm: isNounFeminine ? 'feminine' : 'masculine',
          nounData: noun,
          colorData: color
        });
      }
    });

    return mockData;
  };

  /** ----------------------------------
   * Helper: speakWord
   * --------------------------------*/
  const speakWord = useCallback((text, chatOverride) => {
    if (!text) return;

    if (PLAY_AUDIO_FILES && chatOverride) {
      // Try to find audio file
      const audio = new Audio(`./sounds/${encodeURIComponent(chatOverride)}.wav`);
      audio.play().catch(() => {
        // fallback to TTS
        speechSynthRef.current.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        if (arabicVoice) utt.voice = arabicVoice;
        utt.lang = 'ar-SA';
        utt.rate = 0.8;
        speechSynthRef.current.speak(utt);
      });
      return;
    }

    speechSynthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (arabicVoice) utterance.voice = arabicVoice;
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    speechSynthRef.current.speak(utterance);
  }, [arabicVoice]);

  /** ----------------------------------
   * Start speech recognition
   * --------------------------------*/
  const startRecognition = useCallback(() => {
    if (!currentCombination) {
      console.error('[ColorNounGame] No current combination available');
      return;
    }

    console.log(`[ColorNounGame] Starting recognition`);
    console.log(`[ColorNounGame] Expecting: "${currentCombination.arabicPhrase}" (${currentCombination.chatPhrase})`);
    
    // Check if Azure Speech is available and enabled
    const useAzureSpeech = isAzureSpeechAvailable();
    
    if (useAzureSpeech) {
      startAzureRecognition();
    } else {
      startWebKitRecognition();
    }
  }, [currentCombination]);

  /** ----------------------------------
   * Process recognition result
   * --------------------------------*/
  const processRecognitionResult = useCallback((recognizedText) => {
    if (!currentCombination) {
      console.error('[ColorNounGame] No current combination set');
      return;
    }
    
    console.log(`[ColorNounGame] Heard: "${recognizedText}", Expected: "${currentCombination.arabicPhrase}" (${currentCombination.chatPhrase})`);
    
    // Create mock object for pronunciation checking
    const mockItem = {
      ar: currentCombination.arabicPhrase,
      chat: currentCombination.chatPhrase,
      eng: currentCombination.englishPhrase
    };
    
    // Check pronunciation
    const pronunciationResult = checkPronunciation(recognizedText, mockItem, [], SIMILARITY_THRESHOLD);
    
    console.log('[ColorNounGame] Pronunciation result:', pronunciationResult);
    
    const newScore = { ...score, total: score.total + 1 };
    
    if (pronunciationResult.isCorrect || pronunciationResult.matchType === 'partial') {
      newScore.correct = score.correct + 1;
      setScore(newScore);
      
      // Provide feedback
      if (pronunciationResult.matchType === 'exact') {
        setStatusMsg('✅ Perfect!');
      } else if (pronunciationResult.matchType === 'similarity') {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`✅ Good enough! (${percentage}% similar)`);
      } else {
        setStatusMsg('✅ Good job!');
      }
      
      // Play the correct pronunciation
      speakWord(currentCombination.arabicPhrase, currentCombination.chatPhrase);
      
      // Move to next combination after delay
      setTimeout(() => {
        selectRandomCombination();
        setStatusMsg(null);
      }, 2500);
      
    } else {
      setScore(newScore);
      
      // Show similarity feedback for incorrect answers
      if (pronunciationResult.similarity && pronunciationResult.similarity > 0.2) {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`❌ Close (${percentage}% similar) - try again`);
      } else {
        setStatusMsg('❌ Try again');
      }
      
      // Play the correct pronunciation
      speakWord(currentCombination.arabicPhrase, currentCombination.chatPhrase);
      
      // Clear status after delay but stay on same combination
      setTimeout(() => {
        setStatusMsg(null);
      }, 3000);
    }
  }, [currentCombination, score]);

  /** ----------------------------------
   * Azure Speech Recognition
   * --------------------------------*/
  const startAzureRecognition = useCallback(async () => {
    setIsRecording(true);
    
    try {
      const result = await startAzureSpeechRecognition();
      
      if (result.success && result.text) {
        processRecognitionResult(result.text);
      } else {
        console.log('[Azure Speech] Recognition failed:', result.error);
        if (result.error === 'No Arabic speech detected') {
          setStatusMsg('❌ Please speak in Arabic. Try again.');
        } else {
          setStatusMsg('❌ No speech detected. Try again.');
        }
      }
    } catch (error) {
      console.error('[Azure Speech] Recognition failed:', error);
      setStatusMsg('❌ Speech recognition failed. Try again.');
    } finally {
      setIsRecording(false);
    }
  }, [processRecognitionResult]);

  /** ----------------------------------
   * WebKit Speech Recognition (fallback)
   * --------------------------------*/
  const startWebKitRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    // Stop previous instance if any
    if (recognition) {
      recognition.stop();
    }

    const rec = new window.webkitSpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'ar-SA';

    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);

    rec.onerror = (e) => {
      console.error('WebKit Speech recognition error', e);
      setIsRecording(false);
    };

    rec.onresult = (event) => {
      const res = event.results[0][0].transcript.trim();
      console.log('[WebKit Speech] Heard:', res);
      processRecognitionResult(res);
    };

    setRecognition(rec);
    try {
      rec.start();
    } catch (e) {
      console.error('Unable to start recognition', e);
    }
  }, [recognition, processRecognitionResult]);

  /** ----------------------------------
   * Game functions
   * --------------------------------*/
  const selectRandomCombination = () => {
    if (combinations.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * combinations.length);
    const selected = combinations[randomIndex];
    setCurrentCombination(selected);
    
    console.log('[ColorNounGame] Selected combination:', selected);
  };

  const startGame = () => {
    setGameStarted(true);
    setScore({ correct: 0, total: 0 });
    selectRandomCombination();
    setStatusMsg(null);
  };

  const playCurrentPronunciation = () => {
    if (currentCombination) {
      speakWord(currentCombination.arabicPhrase, currentCombination.chatPhrase);
    }
  };

  const skipCurrent = () => {
    selectRandomCombination();
    setStatusMsg(null);
  };

  if (combinations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center font-sans">
        <h2 className="text-2xl font-bold mb-4">Color + Noun Game</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-lg text-yellow-800">
            📚 No colorful combinations found!
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Please generate colorful images first using the generateColorfulImages.js script.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Color + Noun Game
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
              <p>🖼️ <strong>Look at the image</strong> - You'll see a colorful object</p>
              <p>🎤 <strong>Say the color + noun</strong> - Use correct gender agreement</p>
              <p>✅ <strong>Examples:</strong></p>
              <ul className="ml-6 space-y-1">
                <li>• سيارة حمراء (sayyaarah 7amra) - red car (feminine)</li>
                <li>• موتر أحمر (motar a7mar) - red car (masculine)</li>
                <li>• بيت أخضر (bait akhdhar) - green house (masculine)</li>
                <li>• شنطة سوداء (shantah sawda) - black bag (feminine)</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xl font-semibold"
          >
            🎮 Start Game
          </button>
          
          <div className="text-sm text-gray-600">
            {combinations.length} colorful combinations available
          </div>
        </div>
      ) : (
        /* Game Screen */
        currentCombination && (
          <div className="space-y-6">
            {/* Image Display */}
            <div className="flex justify-center">
              <div className="w-80 h-80 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                {/* For now, show a placeholder since we don't have actual images yet */}
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {currentCombination.noun === 'sayyaarah' || currentCombination.noun === 'motar' ? '🚗' :
                     currentCombination.noun === 'bait' ? '🏠' :
                     currentCombination.noun === 'shantah' ? '👜' :
                     currentCombination.noun === 'kitaab' ? '📚' : '🎨'}
                  </div>
                  <div className="text-2xl font-bold" style={{color: getColorHex(currentCombination.color)}}>
                    {currentCombination.englishPhrase}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    ({currentCombination.colorForm} form)
                  </div>
                </div>
              </div>
            </div>

            {/* Expected Answer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Say:</h3>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {currentCombination.arabicPhrase}
                </div>
                <div className="text-lg text-gray-600">
                  ({currentCombination.chatPhrase})
                </div>
                <div className="text-sm text-gray-500">
                  {currentCombination.englishPhrase}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={startRecognition}
                disabled={isRecording}
                className={`px-4 py-2 rounded font-semibold transition ${
                  isRecording 
                    ? 'bg-red-500 text-white cursor-not-allowed' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isRecording ? '🎤 Listening...' : '🎤 Start Speaking'}
              </button>
              
              <button
                onClick={playCurrentPronunciation}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                🔊 Play
              </button>
              
              <button
                onClick={skipCurrent}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm"
              >
                ⏭️ Skip
              </button>
              
              <button
                onClick={() => {
                  setGameStarted(false);
                  setCurrentCombination(null);
                  setStatusMsg(null);
                }}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
              >
                🏠 Main Menu
              </button>
            </div>

            {/* Status Message */}
            {statusMsg && (
              <div className="bg-white border rounded-lg p-3">
                <p className="text-lg font-bold">{statusMsg}</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

// Helper function to get color hex value
const getColorHex = (colorChat) => {
  const colorMap = {
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
  
  return colorMap[colorChat] || '#CCCCCC';
};

export default ColorNounGame;