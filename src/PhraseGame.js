import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic } from './arabicUtils';

const PhraseGame = ({ contentData }) => {
  const [currentPhrase, setCurrentPhrase] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const recognitionRef = useRef(null);
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

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ar-SA';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSpeechResult(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusMsg('Speech recognition error. Try again.');
        setTimeout(() => setStatusMsg(null), 3000);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speakPhrase = useCallback((text) => {
    if (!text) return;
    speechSynthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (arabicVoice) utterance.voice = arabicVoice;
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    speechSynthRef.current.speak(utterance);
  }, [arabicVoice]);

  const generateRandomPhrase = useCallback(() => {
    if (!contentData || contentData.length === 0) return null;
    
    // Filter for phrases only
    const phrases = contentData.filter(item => 
      item.type === 'phrase' && item.ar && item.ar.trim() && item.eng && item.eng.trim()
    );
    
    if (phrases.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
  }, [contentData]);

  const startGame = () => {
    setGameStarted(true);
    setScore({ correct: 0, total: 0 });
    setStatusMsg(null);
    setShowHint(false);
    generateNewPhrase();
  };

  const generateNewPhrase = () => {
    const newPhrase = generateRandomPhrase();
    setCurrentPhrase(newPhrase);
    setShowHint(false);
    setStatusMsg(null);
  };

  const handleSpeechResult = (transcript) => {
    if (!currentPhrase) return;

    const normalizedInput = normalizeArabic(transcript.trim());
    const normalizedAnswer = normalizeArabic(currentPhrase.ar);
    
    const newScore = { ...score, total: score.total + 1 };
    
    // Check if spoken Arabic matches
    const isCorrect = normalizedInput === normalizedAnswer;
    
    if (isCorrect) {
      newScore.correct = score.correct + 1;
      setScore(newScore);
      setStatusMsg('✅ Perfect! You said it correctly!');
      speakPhrase(currentPhrase.ar);
      
      setTimeout(() => {
        generateNewPhrase();
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

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const playAudio = () => {
    if (currentPhrase) {
      speakPhrase(currentPhrase.ar);
    }
  };

  const skipCurrent = () => {
    generateNewPhrase();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Arabic Phrase Game
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
              <p>📱 <strong>See English phrase:</strong> You'll see an English phrase</p>
              <p>🎤 <strong>Say Arabic:</strong> Click microphone and say the Arabic translation</p>
              <p>🎯 <strong>Practice:</strong> Common Arabic phrases and expressions</p>
              <p>💡 <strong>Hints:</strong> See the arabizi (romanized) version when stuck</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xl font-semibold"
          >
            🎤 Start Phrase Practice
          </button>
        </div>
      ) : (
        /* Game Screen */
        currentPhrase && (
          <div className="space-y-6">
            {/* Current Challenge */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Say this in Arabic:</h3>
              
              <div className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">
                  {currentPhrase.eng}
                </div>
                
                {showHint && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="text-sm text-yellow-700 mb-1">Hint (Arabizi):</div>
                    <div className="text-lg font-semibold">
                      {currentPhrase.chat}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Microphone Button */}
            <div className="bg-white border rounded-lg p-6">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-24 h-24 rounded-full text-4xl transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                🎤
              </button>
              <div className="mt-4 text-lg font-semibold">
                {isListening ? 'Listening... Speak now!' : 'Click to speak'}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={playAudio}
                className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                🔊 Hear Arabic
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
                  setCurrentPhrase(null);
                  setStatusMsg(null);
                  if (recognitionRef.current) {
                    recognitionRef.current.stop();
                  }
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

            {/* Answer Display */}
            {showHint && (
              <div className="bg-gray-100 border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Arabic Answer:</div>
                <div className="text-2xl font-bold" style={{direction: 'rtl'}}>
                  {currentPhrase.ar}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default PhraseGame;