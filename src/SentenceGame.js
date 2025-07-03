import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic, checkPronunciation } from './arabicUtils';
import logicData from '../logic.json';
import { isAzureSpeechAvailable, startAzureSpeechRecognition } from './azureSpeechHelper';

// Toggle: if true, play pre-generated WAV files located in /sounds; otherwise use browser TTS
const PLAY_AUDIO_FILES = true;

// Similarity threshold for pronunciation acceptance (0.5 = 50% similar)
const SIMILARITY_THRESHOLD = 0.5;

/**
 * Sentence Game Component
 * Shows verb + color + noun combinations and requires complete sentence pronunciation
 * Examples: "I want a red car" = "أبا سيارة حمراء" (aba sayyaarah 7amra)
 */
const SentenceGame = () => {
  const [currentSentence, setCurrentSentence] = useState(null);
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
   * Generate random sentence
   * --------------------------------*/
  const generateRandomSentence = useCallback(() => {
    // Get verbs, colors, and colorful nouns
    const verbs = logicData.items.filter(item => item.pos === 'verb');
    const colors = logicData.items.filter(item => item.type === 'colors');
    const colorfulNouns = logicData.items.filter(item => 
      item.pos === 'noun' && item.colorful === true
    );

    // Filter out alternates for nouns
    const alternateNounIds = new Set();
    colorfulNouns.forEach(noun => {
      if (noun.alternate) {
        alternateNounIds.add(noun.alternate);
      }
    });
    const mainNouns = colorfulNouns.filter(noun => !alternateNounIds.has(noun.id));

    // Select random components
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const noun = mainNouns[Math.floor(Math.random() * mainNouns.length)];

    // Determine gender agreement for color
    const isNounFeminine = noun.gender === 'f';
    const colorForm = isNounFeminine ? 
      { ar: color.ar_f, chat: color.chat_f, eng: color.eng + ' (f)' } : 
      { ar: color.ar, chat: color.chat, eng: color.eng + ' (m)' };

    // Create sentence variations based on verb type
    let arabicSentence, chatSentence, englishSentence;
    
    // Check if it's a modal verb (aba = want, agdar = can)
    const isModal = ['aba', 'agdar'].includes(verb.chat);
    
    if (isModal) {
      // Modal + verb + color + noun: "I want/can [verb] a red car"
      // For now, use simple modal + color + noun: "I want a red car"
      arabicSentence = `${verb.ar} ${noun.ar} ${colorForm.ar}`;
      chatSentence = `${verb.chat} ${noun.chat} ${colorForm.chat}`;
      
      if (verb.chat === 'aba') {
        englishSentence = `I want a ${color.eng.toLowerCase()} ${noun.eng.toLowerCase()}`;
      } else if (verb.chat === 'agdar') {
        englishSentence = `I can use a ${color.eng.toLowerCase()} ${noun.eng.toLowerCase()}`;
      }
    } else {
      // Regular verb + color + noun: "I eat blue cheese"
      arabicSentence = `${verb.ar} ${noun.ar} ${colorForm.ar}`;
      chatSentence = `${verb.chat} ${noun.chat} ${colorForm.chat}`;
      englishSentence = `I ${verb.eng.replace('I ', '').toLowerCase()} ${color.eng.toLowerCase()} ${noun.eng.toLowerCase()}`;
    }

    return {
      id: `${verb.chat}_${noun.chat}_${color.chat}`,
      verb: {
        ar: verb.ar,
        chat: verb.chat,
        eng: verb.eng,
        data: verb
      },
      noun: {
        ar: noun.ar,
        chat: noun.chat,
        eng: noun.eng,
        gender: noun.gender,
        data: noun
      },
      color: {
        ar: colorForm.ar,
        chat: colorForm.chat,
        eng: colorForm.eng,
        data: color
      },
      sentence: {
        ar: arabicSentence,
        chat: chatSentence,
        eng: englishSentence
      },
      isModal: isModal
    };
  }, []);

  /** ----------------------------------
   * Start speech recognition
   * --------------------------------*/
  const startRecognition = useCallback(() => {
    if (!currentSentence) {
      console.error('[SentenceGame] No current sentence available');
      return;
    }

    console.log(`[SentenceGame] Starting recognition`);
    console.log(`[SentenceGame] Expecting: "${currentSentence.sentence.ar}" (${currentSentence.sentence.chat})`);
    
    // Check if Azure Speech is available and enabled
    const useAzureSpeech = isAzureSpeechAvailable();
    
    if (useAzureSpeech) {
      startAzureRecognition();
    } else {
      startWebKitRecognition();
    }
  }, [currentSentence]);

  /** ----------------------------------
   * Process recognition result
   * --------------------------------*/
  const processRecognitionResult = useCallback((recognizedText) => {
    if (!currentSentence) {
      console.error('[SentenceGame] No current sentence set');
      return;
    }
    
    console.log(`[SentenceGame] Heard: "${recognizedText}", Expected: "${currentSentence.sentence.ar}" (${currentSentence.sentence.chat})`);
    
    // Create mock object for pronunciation checking
    const mockItem = {
      ar: currentSentence.sentence.ar,
      chat: currentSentence.sentence.chat,
      eng: currentSentence.sentence.eng
    };
    
    // Check pronunciation
    const pronunciationResult = checkPronunciation(recognizedText, mockItem, [], SIMILARITY_THRESHOLD);
    
    console.log('[SentenceGame] Pronunciation result:', pronunciationResult);
    
    const newScore = { ...score, total: score.total + 1 };
    
    if (pronunciationResult.isCorrect || pronunciationResult.matchType === 'partial') {
      newScore.correct = score.correct + 1;
      setScore(newScore);
      
      // Provide feedback
      if (pronunciationResult.matchType === 'exact') {
        setStatusMsg('✅ Perfect sentence!');
      } else if (pronunciationResult.matchType === 'similarity') {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`✅ Good sentence! (${percentage}% similar)`);
      } else {
        setStatusMsg('✅ Well done!');
      }
      
      // Play the correct pronunciation
      speakWord(currentSentence.sentence.ar, currentSentence.sentence.chat);
      
      // Move to next sentence after delay
      setTimeout(() => {
        generateNewSentence();
        setStatusMsg(null);
      }, 3000);
      
    } else {
      setScore(newScore);
      
      // Show similarity feedback for incorrect answers
      if (pronunciationResult.similarity && pronunciationResult.similarity > 0.2) {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`❌ Close (${percentage}% similar) - try again`);
      } else {
        setStatusMsg('❌ Try the complete sentence again');
      }
      
      // Play the correct pronunciation
      speakWord(currentSentence.sentence.ar, currentSentence.sentence.chat);
      
      // Clear status after delay but stay on same sentence
      setTimeout(() => {
        setStatusMsg(null);
      }, 4000);
    }
  }, [currentSentence, score]);

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
  const generateNewSentence = () => {
    const sentence = generateRandomSentence();
    setCurrentSentence(sentence);
    console.log('[SentenceGame] Generated sentence:', sentence);
  };

  const startGame = () => {
    setGameStarted(true);
    setScore({ correct: 0, total: 0 });
    generateNewSentence();
    setStatusMsg(null);
  };

  const playCurrentPronunciation = () => {
    if (currentSentence) {
      speakWord(currentSentence.sentence.ar, currentSentence.sentence.chat);
    }
  };

  const skipCurrent = () => {
    generateNewSentence();
    setStatusMsg(null);
  };

  // Helper function to get color hex value
  const getColorHex = (colorChat) => {
    const colorMap = {
      'a7mar': '#FF0000', 'asfar': '#FFFF00', 'azrag': '#0000FF',
      'abyadh': '#FFFFFF', 'aswad': '#000000', 'akhdhar': '#00FF00',
      'rusasee': '#808080', 'wardee': '#FFC0CB', 'banafsajee': '#800080',
      'bonnee': '#8B4513', 'burtuqalee': '#FFA500', 'fedhee': '#C0C0C0',
      'thahabee': '#FFD700'
    };
    return colorMap[colorChat] || '#CCCCCC';
  };

  // Helper function to get emoji for verb
  const getVerbEmoji = (verbChat) => {
    const verbEmojis = {
      'aba': '🙏', 'agdar': '💪', 'aakel': '🍽️', 'ashrab': '🥤',
      'asawee': '🛠️', 'a7eb': '❤️', 'aakheth': '✋', 'ashoof': '👀',
      'asma3': '👂', 'aseer': '🚶', 'ashteree': '🛒', 'agra': '📖',
      'akteb': '✍️', 'al3ab': '🎮', 'anaam': '😴', 'asoog': '🚗'
    };
    return verbEmojis[verbChat] || '🎯';
  };

  // Helper function to get emoji for noun
  const getNounEmoji = (nounChat) => {
    const nounEmojis = {
      'sayyaarah': '🚗', 'motar': '🚙', 'bait': '🏠', 'kitaab': '📚',
      'shantah': '👜', 'taawlah': '🪑', 'baab': '🚪', 'kirsee': '🪑',
      'burj': '🏢', 'sa3a': '⌚', 'chai': '🍵', 'gahwa': '☕',
      'mai': '💧', '3aseer': '🧃', 'jebin': '🧀', 'khebz': '🍞'
    };
    return nounEmojis[nounChat] || '📦';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Sentence Builder Game
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
              <p>🎯 <strong>Build complete sentences</strong> - Combine verb + color + noun</p>
              <p>🎤 <strong>Say the full sentence</strong> - Use proper gender agreement</p>
              <p>✅ <strong>Examples:</strong></p>
              <ul className="ml-6 space-y-1">
                <li>• أبا سيارة حمراء (aba sayyaarah 7amra) - I want a red car</li>
                <li>• آكل جبن أزرق (aakel jebin azrag) - I eat blue cheese</li>
                <li>• أقدر أسوق موتر أسود (agdar asoog motar aswad) - I can drive a black car</li>
                <li>• أشرب جاي أخضر (ashrab chai akhdhar) - I drink green tea</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                💡 <strong>Grammar Focus:</strong> Colors must agree with noun gender!
              </p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xl font-semibold"
          >
            🎮 Start Building Sentences
          </button>
        </div>
      ) : (
        /* Game Screen */
        currentSentence && (
          <div className="space-y-6">
            {/* Sentence Components Display */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Verb */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="text-4xl mb-2">{getVerbEmoji(currentSentence.verb.chat)}</div>
                <div className="text-lg font-bold text-purple-700">
                  {currentSentence.verb.ar}
                </div>
                <div className="text-sm text-purple-600">
                  ({currentSentence.verb.chat})
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentSentence.verb.eng}
                </div>
              </div>

              {/* Color + Noun */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="text-4xl mb-2" style={{color: getColorHex(currentSentence.color.data.chat)}}>
                  {getNounEmoji(currentSentence.noun.chat)}
                </div>
                <div className="text-lg font-bold text-green-700">
                  {currentSentence.noun.ar} {currentSentence.color.ar}
                </div>
                <div className="text-sm text-green-600">
                  ({currentSentence.noun.chat} {currentSentence.color.chat})
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentSentence.color.data.eng} {currentSentence.noun.eng}
                  <span className="ml-1 text-blue-500">
                    ({currentSentence.noun.gender === 'f' ? 'feminine' : 'masculine'})
                  </span>
                </div>
              </div>

              {/* Complete Sentence */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-lg font-bold text-yellow-700">
                  Complete Sentence:
                </div>
                <div className="text-sm text-yellow-600 mt-1">
                  {currentSentence.sentence.eng}
                </div>
                {currentSentence.isModal && (
                  <div className="text-xs text-blue-500 mt-1">
                    (Modal verb)
                  </div>
                )}
              </div>
            </div>

            {/* Expected Answer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Say the complete sentence:</h3>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {currentSentence.sentence.ar}
                </div>
                <div className="text-lg text-gray-600">
                  ({currentSentence.sentence.chat})
                </div>
                <div className="text-sm text-gray-500">
                  "{currentSentence.sentence.eng}"
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
                {isRecording ? '🎤 Listening...' : '🎤 Say Sentence'}
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
                  setCurrentSentence(null);
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

export default SentenceGame;