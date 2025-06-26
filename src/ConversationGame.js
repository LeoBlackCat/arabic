import React, { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeArabic } from './arabicUtils';
import logicData from '../logic.json';

// Game modes
const GAME_MODES = {
  TUTORIAL: 'tutorial',
  PRACTICE: 'practice',
  CONVERSATION: 'conversation'
};

// Character expressions
const EXPRESSIONS = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  ENCOURAGING: 'encouraging',
  CONFUSED: 'confused'
};

// Time contexts for background changes
const TIME_CONTEXTS = {
  MORNING: 'morning',
  EVENING: 'evening',
  GENERAL: 'general'
};

const ConversationGame = () => {
  const [gameMode, setGameMode] = useState(GAME_MODES.TUTORIAL);
  const [currentPhrase, setCurrentPhrase] = useState(null);
  const [expectedResponse, setExpectedResponse] = useState(null);
  const [conversationPairs, setConversationPairs] = useState([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [characterExpression, setCharacterExpression] = useState(EXPRESSIONS.NEUTRAL);
  const [timeContext, setTimeContext] = useState(TIME_CONTEXTS.GENERAL);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [result, setResult] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  
  const speechSynthesis = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.current.getVoices();
      const arabic = voices.find(voice => 
        voice.lang.includes('ar') || voice.name.toLowerCase().includes('arabic')
      );
      setArabicVoice(arabic || voices[0]);
    };
    speechSynthesis.current.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  // Load conversation pairs from logic.json
  useEffect(() => {
    const loadConversationPairs = () => {
      try {
        // Extract conversation pairs
        const pairs = [];
        const items = logicData.items || [];
        
        items.forEach(item => {
          if (item.initial) {
            // Find the response to this initial phrase
            const response = items.find(responseItem => 
              responseItem.replyTo && responseItem.replyTo.includes(item.id.toString())
            );
            
            if (response) {
              pairs.push({
                greeting: item,
                response: response,
                timeContext: getTimeContext(item.chat)
              });
            }
          }
        });
        
        console.log('Loaded conversation pairs:', pairs);
        setConversationPairs(pairs);
        if (pairs.length > 0) {
          setCurrentPhrase(pairs[0].greeting);
          setExpectedResponse(pairs[0].response);
          setTimeContext(pairs[0].timeContext);
        }
      } catch (error) {
        console.error('Error loading conversation pairs:', error);
      }
    };
    
    loadConversationPairs();
  }, []);

  // Determine time context from phrase
  const getTimeContext = (chat) => {
    if (chat.includes('sabaa7')) return TIME_CONTEXTS.MORNING;
    if (chat.includes('masa')) return TIME_CONTEXTS.EVENING;
    return TIME_CONTEXTS.GENERAL;
  };

  // Text-to-speech function
  const speakText = useCallback((text, isArabic = true) => {
    speechSynthesis.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (isArabic && arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = 'ar-SA';
    }
    utterance.rate = 0.8;
    
    speechSynthesis.current.speak(utterance);
  }, [arabicVoice]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';
      
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          handleSpeechResult(result[0].transcript.trim());
        }
      };
      
      setRecognition(recognition);
    }
  }, []);

  // Handle speech recognition result
  const handleSpeechResult = (transcript) => {
    if (!expectedResponse) return;
    
    const normalizedTranscript = normalizeArabic(transcript);
    const normalizedExpected = normalizeArabic(expectedResponse.ar);
    const isCorrect = normalizedTranscript === normalizedExpected;
    
    setAttempts(prev => prev + 1);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setCharacterExpression(EXPRESSIONS.HAPPY);
      setResult({ transcript, isCorrect: true });
      
      // Progress to next pair after success
      setTimeout(() => {
        nextConversationPair();
      }, 2000);
    } else {
      setCharacterExpression(EXPRESSIONS.ENCOURAGING);
      setResult({ transcript, isCorrect: false });
      
      // Show correct answer
      setTimeout(() => {
        speakText(expectedResponse.ar);
      }, 1000);
    }
  };

  // Move to next conversation pair
  const nextConversationPair = () => {
    const nextIndex = (currentPairIndex + 1) % conversationPairs.length;
    setCurrentPairIndex(nextIndex);
    
    const nextPair = conversationPairs[nextIndex];
    setCurrentPhrase(nextPair.greeting);
    setExpectedResponse(nextPair.response);
    setTimeContext(nextPair.timeContext);
    setCharacterExpression(EXPRESSIONS.NEUTRAL);
    setResult(null);
  };

  // Start/stop recording
  const toggleRecording = () => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Tutorial demonstration
  const playTutorial = () => {
    if (!currentPhrase || !expectedResponse) return;
    
    setShowTutorial(true);
    setCharacterExpression(EXPRESSIONS.NEUTRAL);
    
    // Character 1 speaks
    speakText(currentPhrase.ar);
    
    // Character 2 responds after delay
    setTimeout(() => {
      speakText(expectedResponse.ar);
      setShowTutorial(false);
    }, 3000);
  };

  // Get character image path based on expression and context
  const getCharacterImage = (characterId, expression = EXPRESSIONS.NEUTRAL) => {
    const imagePath = `/characters/${characterId}_${expression.toLowerCase()}_${timeContext}.png`;
    return imagePath;
  };

  // Get background image based on time context
  const getBackgroundImage = () => {
    return `/backgrounds/${timeContext}.jpg`;
  };

  // Handle image load errors with fallbacks
  const handleImageError = (e, characterId) => {
    console.log(`Image failed to load: ${e.target.src}`);
    // Fallback to neutral expression for the same character and context
    if (!e.target.src.includes('neutral')) {
      e.target.src = `/characters/${characterId}_neutral_${timeContext}.png`;
    } else {
      // Final fallback to a different context if neutral doesn't exist
      e.target.src = `/characters/${characterId}_neutral_morning.png`;
    }
  };

  if (!currentPhrase || !expectedResponse) {
    return <div className="text-center p-8">Loading conversation...</div>;
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${getBackgroundImage()})` }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Arabic Conversation Game
          </h1>
          <div className="text-white text-lg">
            Score: {score}/{attempts} | Pair: {currentPairIndex + 1}/{conversationPairs.length}
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setGameMode(GAME_MODES.TUTORIAL)}
            className={`px-4 py-2 rounded ${gameMode === GAME_MODES.TUTORIAL ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
          >
            Tutorial
          </button>
          <button
            onClick={() => setGameMode(GAME_MODES.PRACTICE)}
            className={`px-4 py-2 rounded ${gameMode === GAME_MODES.PRACTICE ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
          >
            Practice
          </button>
        </div>

        {/* Character Display */}
        <div className="flex justify-between items-center mb-8">
          {/* Character 1 - Speaks the greeting */}
          <div className="text-center">
            <img
              src={getCharacterImage('character1', EXPRESSIONS.NEUTRAL)}
              alt="Character 1"
              className="w-48 h-64 object-cover rounded-lg shadow-lg mb-2"
              onError={(e) => handleImageError(e, 'character1')}
            />
            <div className="bg-white bg-opacity-90 p-3 rounded-lg max-w-xs">
              <p className="text-xl font-bold text-blue-900 mb-1" style={{direction: 'rtl'}}>
                {currentPhrase.ar}
              </p>
              <p className="text-sm text-gray-600 italic">({currentPhrase.chat})</p>
              <p className="text-sm text-gray-700">{currentPhrase.eng}</p>
            </div>
          </div>

          {/* Character 2 - Shows expected response */}
          <div className="text-center">
            <img
              src={getCharacterImage('character2', characterExpression)}
              alt="Character 2"
              className="w-48 h-64 object-cover rounded-lg shadow-lg mb-2"
              onError={(e) => handleImageError(e, 'character2')}
            />
            {gameMode === GAME_MODES.TUTORIAL && (
              <div className="bg-white bg-opacity-90 p-3 rounded-lg max-w-xs">
                <p className="text-xl font-bold text-green-900 mb-1" style={{direction: 'rtl'}}>
                  {expectedResponse.ar}
                </p>
                <p className="text-sm text-gray-600 italic">({expectedResponse.chat})</p>
                <p className="text-sm text-gray-700">{expectedResponse.eng}</p>
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={playTutorial}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            🎭 Play Tutorial
          </button>
          
          <button
            onClick={() => speakText(currentPhrase.ar)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔊 Hear Greeting
          </button>
          
          {gameMode === GAME_MODES.PRACTICE && (
            <button
              onClick={toggleRecording}
              className={`px-6 py-3 rounded-lg transition ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              {isRecording ? '🎤 Recording...' : '🎤 Practice Response'}
            </button>
          )}
        </div>

        {/* Result Display */}
        {result && (
          <div className="text-center bg-white bg-opacity-90 p-4 rounded-lg max-w-md mx-auto">
            <p className="mb-2">
              You said: <span className="font-bold" style={{direction: 'rtl'}}>{result.transcript}</span>
            </p>
            <p className={`text-xl font-bold ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {result.isCorrect ? '✅ Perfect!' : '❌ Try again!'}
            </p>
            {!result.isCorrect && (
              <p className="mt-2 text-sm text-gray-700">
                Correct answer: <span className="font-bold" style={{direction: 'rtl'}}>{expectedResponse.ar}</span>
              </p>
            )}
          </div>
        )}

        {/* Skip Button */}
        <div className="text-center mt-6">
          <button
            onClick={nextConversationPair}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Skip to Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationGame;