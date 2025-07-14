import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic } from './arabicUtils';
import { isElevenLabsAvailable, playElevenLabsSpeech } from './elevenLabsHelper';
import { isFirebaseStorageAvailable, playAudioWithFirebaseCache } from './firebaseStorageHelper';
import logicData from '../logic.json';

const SpeechConjugationGame = ({ contentData, contentType }) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHintText, setShowHintText] = useState(false);

  const speechSynthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const [arabicVoice, setArabicVoice] = useState(null);
  const [elevenLabsEnabled, setElevenLabsEnabled] = useState(false);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [azureSpeechEnabled, setAzureSpeechEnabled] = useState(false);

  // Initialize voices and check services availability
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthRef.current.getVoices();
      const arVoice = voices.find(v => v.lang.includes('ar') || v.name.toLowerCase().includes('arabic'));
      setArabicVoice(arVoice || voices[0]);
    };
    speechSynthRef.current.onvoiceschanged = loadVoices;
    loadVoices();
    
    // Check ElevenLabs availability
    const checkElevenLabs = () => {
      const available = isElevenLabsAvailable();
      setElevenLabsEnabled(available);
      console.log('SpeechConjugationGame: ElevenLabs TTS available:', available);
    };
    
    // Check Firebase Storage availability
    const checkFirebase = () => {
      const available = isFirebaseStorageAvailable();
      setFirebaseEnabled(available);
      console.log('SpeechConjugationGame: Firebase Storage available:', available);
    };

    // Check Azure Speech availability
    const checkAzureSpeech = () => {
      const available = localStorage.getItem('azure-speech-enabled') === 'true' && 
                       localStorage.getItem('azure-speech-key');
      setAzureSpeechEnabled(available);
      console.log('SpeechConjugationGame: Azure Speech available:', available);
    };
    
    checkElevenLabs();
    checkFirebase();
    checkAzureSpeech();
    
    return () => {
      speechSynthRef.current.onvoiceschanged = null;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Map Arabic -> chat for filename lookup (lazy-loaded on first use)
  let arToChatMap = null;
  const buildArMap = () => {
    if (arToChatMap) return arToChatMap;
    try {
      arToChatMap = {};
      [...logicData.items, ...(logicData.numerals || [])].forEach((it) => {
        if (it.ar && it.chat) arToChatMap[it.ar] = it.chat;
      });
    } catch (e) {
      console.warn('Unable to load logic.json for map:', e);
      arToChatMap = {};
    }
    return arToChatMap;
  };

  const speakWord = useCallback(async (text, chatOverride) => {
    if (!text) return;
    
    // Priority 0: Firebase Storage cache (if enabled)
    if (firebaseEnabled) {
      const map = buildArMap();
      const chat = chatOverride || map[text] || text;
      
      try {
        console.log(`SpeechConjugationGame: Using Firebase Storage cache for: "${text}" -> filename: "${chat}"`);
        await playAudioWithFirebaseCache(text, chat);
        return;
      } catch (error) {
        console.error('SpeechConjugationGame: Firebase Storage failed, falling back:', error);
      }
    }
    
    // Priority 1: ElevenLabs TTS (if enabled)
    if (elevenLabsEnabled) {
      try {
        console.log('SpeechConjugationGame: Using ElevenLabs TTS for:', text);
        await playElevenLabsSpeech(text);
        return;
      } catch (error) {
        console.error('SpeechConjugationGame: ElevenLabs TTS failed, falling back:', error);
      }
    }

    // Priority 2: Pre-generated WAV files
    const PLAY_AUDIO_FILES = true; // Match the setting from App.js
    if (PLAY_AUDIO_FILES) {
      const map = buildArMap();
      const chat = chatOverride || map[text] || text;
      const fileName = `${chat}.wav`;
      const audio = new Audio('.' + `/sounds/${encodeURIComponent(fileName)}`);
      
      try {
        await audio.play();
        console.log('SpeechConjugationGame: Played audio file:', fileName);
        return;
      } catch (error) {
        console.error('SpeechConjugationGame: Audio file play error:', error);
      }
    }

    // Priority 3: Browser TTS (fallback)
    try {
      speechSynthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      speechSynthRef.current.speak(utterance);
      console.log('SpeechConjugationGame: Using browser TTS for:', text);
    } catch (error) {
      console.error('SpeechConjugationGame: Browser TTS synthesis error:', error);
    }
  }, [arabicVoice, elevenLabsEnabled, firebaseEnabled]);

  const generateConjugationChallenge = useCallback(() => {
    if (!contentData || contentData.length === 0) return null;

    const verbs = contentData.filter(item => item.pos === 'verb' && item.you_m && item.you_f);
    if (verbs.length === 0) return null;

    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const subjects = [
      { pronoun: 'enta', form: 'you_m', label: 'you', arabicPronoun: 'إنت', englishLabel: 'you' },
      { pronoun: 'entee', form: 'you_f', label: 'you', arabicPronoun: 'إنتي', englishLabel: 'you' },
      { pronoun: 'entoo', form: 'you_pl', label: 'you all', arabicPronoun: 'إنتوا', englishLabel: 'you all' },
      { pronoun: 'ne7an', form: 'we', label: 'we', arabicPronoun: 'نحن', englishLabel: 'we' },
      { pronoun: 'hu', form: 'he', label: 'he', arabicPronoun: 'هو', englishLabel: 'he' },
      { pronoun: 'he', form: 'she', label: 'she', arabicPronoun: 'هي', englishLabel: 'she' },
      { pronoun: 'hum', form: 'they', label: 'they', arabicPronoun: 'هم', englishLabel: 'they' },
    ];

    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const correctForm = verb[subject.form];
    const correctFormChat = verb[subject.form + '_chat'];

    // Create simple English phrase by removing "i" and using the subject
    const verbEnglish = verb.eng.replace(/^i\s+/, ''); // Remove "i " from start
    const simpleEnglish = `${subject.englishLabel} ${verbEnglish}`;

    return {
      type: 'speech_conjugation',
      question: `Say "${simpleEnglish}"`,
      simpleQuestion: simpleEnglish,
      verb: verb,
      subject: subject,
      correctAnswer: `${subject.arabicPronoun} ${correctForm}`,
      correctAnswerChat: `${subject.pronoun} ${correctFormChat}`,
      correctForm: correctForm,
      correctFormChat: correctFormChat
    };
  }, [contentData]);

  const startListening = () => {
    if (azureSpeechEnabled) {
      startAzureRecognition();
    } else {
      startBrowserRecognition();
    }
  };

  const startAzureRecognition = async () => {
    try {
      const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk');
      const apiKey = localStorage.getItem('azure-speech-key');
      const region = localStorage.getItem('azure-speech-region') || 'eastus';
      
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
      speechConfig.speechRecognitionLanguage = 'ar-SA';
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      
      setIsListening(true);
      setUserAnswer('');
      setStatusMsg('🎤 Listening... (Azure Speech)');

      recognizer.recognizeOnceAsync((result) => {
        setIsListening(false);
        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const recognizedText = result.text;
          console.log('Azure recognized:', recognizedText);
          handleSpeechResult(recognizedText);
        } else {
          setStatusMsg('❌ Could not recognize speech. Try again.');
        }
        recognizer.close();
      });
    } catch (error) {
      console.error('Azure Speech Recognition error:', error);
      setIsListening(false);
      setStatusMsg('❌ Azure Speech Recognition failed. Falling back to browser.');
      startBrowserRecognition();
    }
  };

  const startBrowserRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatusMsg('❌ Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.lang = 'ar-SA';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    setIsListening(true);
    setUserAnswer('');
    setStatusMsg('🎤 Listening... (Browser STT)');

    recognitionRef.current.onresult = (event) => {
      const result = event.results[0][0].transcript;
      console.log('Browser recognized:', result);
      handleSpeechResult(result);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setStatusMsg('❌ Speech recognition error. Try again.');
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const calculatePronunciationAccuracy = (userText, correctText) => {
    const normalizedUser = normalizeArabic(userText.toLowerCase());
    const normalizedCorrect = normalizeArabic(correctText.toLowerCase());
    
    console.log('Accuracy calculation:', { userText, correctText, normalizedUser, normalizedCorrect });
    
    // Split into words
    const userWords = normalizedUser.split(/\s+/).filter(w => w.length > 0);
    const correctWords = normalizedCorrect.split(/\s+/).filter(w => w.length > 0);
    
    if (correctWords.length === 0) return 0;
    
    let totalScore = 0;
    
    correctWords.forEach(correctWord => {
      let bestWordScore = 0;
      
      userWords.forEach(userWord => {
        let score = 0;
        
        // Exact match
        if (userWord === correctWord) {
          score = 100;
        }
        // One contains the other
        else if (userWord.includes(correctWord) || correctWord.includes(userWord)) {
          score = 80;
        }
        // Calculate character similarity for Arabic words
        else {
          score = calculateArabicSimilarity(userWord, correctWord);
        }
        
        bestWordScore = Math.max(bestWordScore, score);
      });
      
      totalScore += bestWordScore;
    });
    
    const finalScore = Math.round(totalScore / correctWords.length);
    console.log('Final accuracy score:', finalScore);
    return finalScore;
  };

  const calculateArabicSimilarity = (word1, word2) => {
    if (word1.length === 0 || word2.length === 0) return 0;
    
    // For very short words, be more lenient
    if (word1.length <= 2 || word2.length <= 2) {
      if (word1[0] === word2[0]) return 60; // Same first letter
      return 20;
    }
    
    // Count matching characters in same positions
    let matches = 0;
    const minLength = Math.min(word1.length, word2.length);
    const maxLength = Math.max(word1.length, word2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (word1[i] === word2[i]) {
        matches++;
      }
    }
    
    // Base similarity on position matches
    let similarity = (matches / maxLength) * 100;
    
    // Bonus for same starting characters
    if (word1[0] === word2[0]) {
      similarity += 15;
    }
    
    // Bonus for same ending characters
    if (word1[word1.length - 1] === word2[word2.length - 1]) {
      similarity += 15;
    }
    
    // Count common characters (regardless of position)
    const chars1 = word1.split('');
    const chars2 = word2.split('');
    let commonChars = 0;
    
    chars1.forEach(char => {
      if (chars2.includes(char)) {
        commonChars++;
      }
    });
    
    const charSimilarity = (commonChars / maxLength) * 50;
    similarity = Math.max(similarity, charSimilarity);
    
    return Math.min(100, Math.round(similarity));
  };

  const handleSpeechResult = async (recognizedText) => {
    setIsListening(false);
    setUserAnswer(recognizedText);
    
    const normalizedUserAnswer = normalizeArabic(recognizedText);
    const normalizedCorrectAnswer = normalizeArabic(currentChallenge.correctForm);
    const fullCorrectAnswer = normalizeArabic(currentChallenge.correctAnswer);
    
    // Calculate pronunciation accuracy
    const accuracy = calculatePronunciationAccuracy(recognizedText, currentChallenge.correctAnswer);
    
    const newScore = { ...score, total: score.total + 1 };
    
    let statusMessage = '';
    if (normalizedUserAnswer.includes(normalizedCorrectAnswer) || accuracy >= 70) {
      newScore.correct = score.correct + 1;
      setScore(newScore);
      statusMessage = `✅ Excellent! ${accuracy}% accuracy`;
    } else if (accuracy >= 50) {
      newScore.correct = score.correct + 1; // Still count as correct for similar words
      setScore(newScore);
      statusMessage = `🔶 Good! ${accuracy}% accuracy - Very close pronunciation`;
    } else if (accuracy >= 30) {
      setScore(newScore);
      statusMessage = `🔸 Getting there! ${accuracy}% accuracy - Some similarity detected`;
    } else if (accuracy >= 15) {
      setScore(newScore);
      statusMessage = `🔹 Keep trying! ${accuracy}% accuracy - Partial match`;
    } else {
      setScore(newScore);
      statusMessage = `❌ ${accuracy}% accuracy - Try listening to the pronunciation again`;
    }
    
    setStatusMsg(statusMessage);
    setShowAnswer(true);
    
    // Don't auto-play audio to avoid browser restrictions
    // User can manually click the play button instead
    
    // Don't auto-advance - let user manually go to next question
  };

  const playCorrectAnswer = async (userTriggered = false) => {
    if (!currentChallenge) {
      console.warn('No current challenge to play audio for');
      return;
    }

    try {
      if (elevenLabsEnabled) {
        console.log('SpeechConjugationGame: Using ElevenLabs TTS for:', currentChallenge.correctAnswer);
        
        // Generate audio from ElevenLabs
        const { generateElevenLabsSpeech } = await import('./elevenLabsHelper');
        const audioBlob = await generateElevenLabsSpeech(
          currentChallenge.correctAnswer, 
          currentChallenge.correctAnswerChat, 
          'speech-game'
        );
        
        // Create audio element
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Set up event handlers
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          console.log('ElevenLabs audio finished playing');
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          console.error('ElevenLabs audio error:', error);
          throw new Error('ElevenLabs audio playback failed');
        };
        
        // Attempt to play
        try {
          await audio.play();
          console.log('ElevenLabs audio started successfully');
          return; // Success!
        } catch (playError) {
          URL.revokeObjectURL(audioUrl);
          console.warn('ElevenLabs audio play() failed:', playError.message);
          throw playError;
        }
      }

      // Try Firebase cache as fallback
      if (firebaseEnabled) {
        try {
          console.log('SpeechConjugationGame: Trying Firebase cache for:', currentChallenge.correctAnswer);
          await playAudioWithFirebaseCache(currentChallenge.correctAnswer, currentChallenge.correctAnswerChat);
          console.log('Firebase audio played successfully');
          return; // Success!
        } catch (error) {
          console.warn('Firebase cache failed:', error.message);
        }
      }

      // Browser TTS fallback - this should always work for user-triggered events
      console.log('SpeechConjugationGame: Using browser TTS for:', currentChallenge.correctAnswer);
      speechSynthRef.current.cancel();
      
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(currentChallenge.correctAnswer);
        if (arabicVoice) utterance.voice = arabicVoice;
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        
        utterance.onend = () => {
          console.log('Browser TTS finished');
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error('Browser TTS error:', error);
          resolve(); // Don't reject, just resolve
        };
        
        speechSynthRef.current.speak(utterance);
        console.log('Browser TTS started');
      });
      
    } catch (error) {
      console.error('All audio methods failed:', error.message);
      
      // Show user-friendly message
      alert('Unable to play audio. Please check your browser settings and allow audio playback.');
      throw error;
    }
  };

  // Audio priming to unlock playback after first user gesture
  const primeAudio = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = ctx.createBuffer(1, 1, 22050);
      source.connect(ctx.destination);
      source.start(0);
      setTimeout(() => ctx.close(), 100);
      window.__audioPrimed = true;
      console.log('Audio context primed successfully');
    } catch (error) {
      console.warn('Audio priming failed:', error);
    }
  };

  const startGame = () => {
    // Prime audio context for autoplay
    if (!window.__audioPrimed) {
      primeAudio();
    }
    
    setGameStarted(true);
    setScore({ correct: 0, total: 0 });
    setUserAnswer('');
    setStatusMsg(null);
    setShowAnswer(false);
    generateNewChallenge();
  };

  const generateNewChallenge = () => {
    const challenge = generateConjugationChallenge();
    setCurrentChallenge(challenge);
    setUserAnswer('');
    setShowAnswer(false);
    setShowHintText(false);
    setStatusMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Speech Conjugation Game
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">How to play:</h3>
            <div className="text-left space-y-2">
              <p>🎯 <strong>Speech Practice:</strong> Speak Arabic verb conjugations</p>
              <p>🎤 <strong>Voice Recognition:</strong> Uses {azureSpeechEnabled ? 'Azure Speech' : 'browser'} to understand your speech</p>
              <p>🗣️ <strong>Pronunciation:</strong> Listen to correct pronunciations</p>
              <p>📚 <strong>Immediate Feedback:</strong> Hear the correct answer after each attempt</p>
            </div>
          </div>

          {/* Speech Recognition Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Speech Recognition:</h4>
            <div className="text-sm space-y-1">
              <p>🎙️ <strong>Method:</strong> {azureSpeechEnabled ? 'Azure Speech (Premium)' : 'Browser STT (Basic)'}</p>
              <p>🌐 <strong>Language:</strong> Arabic (ar-SA)</p>
              <p>🔊 <strong>Audio:</strong> {elevenLabsEnabled ? 'ElevenLabs TTS' : firebaseEnabled ? 'Firebase Cache' : 'Browser TTS'}</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-xl font-semibold"
          >
            🎤 Start Speech Practice
          </button>
        </div>
      ) : (
        /* Game Screen */
        currentChallenge && (
          <div className="space-y-6">
            {/* Challenge Display */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-6 text-center text-blue-700">
                {currentChallenge.question}
              </h3>
              
              {/* Hint Buttons */}
              <div className="flex justify-center gap-3 mb-4">
                <button
                  onClick={async () => {
                    try {
                      await playCorrectAnswer(true);
                    } catch (error) {
                      console.error('Hint play failed:', error);
                    }
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-semibold"
                >
                  🔊 Hint: Hear Pronunciation
                </button>
                
                <button
                  onClick={() => setShowHintText(!showHintText)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                >
                  👁️ Hint: Show Pronunciation
                </button>
              </div>
              
              {/* Show hint text only when requested */}
              {showHintText && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-yellow-700 mb-2">
                      Say this:
                    </div>
                    <div className="text-xl font-bold mb-2" style={{direction: 'rtl'}}>
                      {currentChallenge.correctAnswer}
                    </div>
                    <div className="text-lg text-gray-700">
                      ({currentChallenge.correctAnswerChat})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Speech Input Area */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
              <button
                onClick={startListening}
                disabled={isListening}
                className={`px-8 py-4 rounded-lg text-xl font-semibold transition ${
                  isListening 
                    ? 'bg-red-500 text-white cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isListening ? '🎤 Listening...' : '🎤 Start Speaking'}
              </button>
              
              {userAnswer && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700 mb-2">You said:</div>
                  <div className="text-lg" style={{direction: 'rtl'}}>
                    {userAnswer}
                  </div>
                </div>
              )}
            </div>

            {/* Status and Answer */}
            {statusMsg && (
              <div className="bg-white border rounded-lg p-4">
                <p className="text-lg font-bold mb-2">{statusMsg}</p>
                {showAnswer && (
                  <div className="text-left space-y-2">
                    <div className="font-semibold">Correct Answer:</div>
                    <div className="text-lg p-3 bg-green-50 rounded-lg" style={{direction: 'rtl'}}>
                      {currentChallenge.correctAnswer}
                    </div>
                    <div className="text-sm text-gray-600">
                      ({currentChallenge.correctAnswerChat})
                    </div>
                    
                    {/* Manual play button in case autoplay fails */}
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={async () => {
                          try {
                            await playCorrectAnswer(true);
                          } catch (error) {
                            console.error('Manual play failed:', error);
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                      >
                        🔊 Play Pronunciation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2 justify-center">
              {!showAnswer ? (
                // Before answer is given
                <button
                  onClick={generateNewChallenge}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  ⏭️ Skip Question
                </button>
              ) : (
                // After answer is given
                <button
                  onClick={generateNewChallenge}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-lg font-semibold"
                >
                  ➡️ Next Question
                </button>
              )}
              
              <button
                onClick={async () => {
                  try {
                    await playCorrectAnswer(true);
                  } catch (error) {
                    console.error('Hear Answer failed:', error);
                  }
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                🔊 Hear Answer
              </button>
              
              <button
                onClick={() => {
                  setGameStarted(false);
                  setCurrentChallenge(null);
                  setUserAnswer('');
                  setStatusMsg(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default SpeechConjugationGame;